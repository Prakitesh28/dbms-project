import express from 'express';
import { getDb } from '../db/connection.js';

const router = express.Router();

// GET all inventory items from v_current_stock_levels
router.get('/items', async (req, res) => {
  try {
    const { farm_id, category, status } = req.query;
    const db = await getDb();
    
    let query = 'SELECT * FROM v_current_stock_levels WHERE 1=1';
    const params = [];

    if (farm_id) {
      query += ' AND farm_id = ?';
      params.push(farm_id);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (status) {
      query += ' AND stock_status = ?';
      params.push(status);
    }

    query += ' ORDER BY item_name ASC';

    const items = db.prepare(query).all(...params);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET low stock items view
router.get('/views/low-stock', async (req, res) => {
  try {
    const db = await getDb();
    const items = db.prepare('SELECT * FROM v_low_stock_items').all();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET out of stock items view
router.get('/views/out-of-stock', async (req, res) => {
  try {
    const db = await getDb();
    const items = db.prepare('SELECT * FROM v_out_of_stock_items').all();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET monthly inventory value view
router.get('/views/monthly-value', async (req, res) => {
  try {
    const db = await getDb();
    const data = db.prepare('SELECT * FROM v_monthly_inventory_value').all();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create inventory item
router.post('/items', async (req, res) => {
  try {
    const { farm_id, name, category, unit, unit_cost, reorder_level, initial_stock, supplier_id } = req.body;
    if (!farm_id || !name || !category || !unit || unit_cost == null) {
      return res.status(400).json({ error: 'Missing required item fields' });
    }
    const db = await getDb();
    
    db.exec('BEGIN TRANSACTION');
    let itemId;
    try {
      const result = db.prepare(`
        INSERT INTO inventory_items (farm_id, name, category, unit, unit_cost, reorder_level, current_stock, supplier_id)
        VALUES (?, ?, ?, ?, ?, ?, 0.0, ?)
      `).run(farm_id, name, category, unit, Number(unit_cost), Number(reorder_level || 10.0), supplier_id || null);

      itemId = result.lastInsertRowid;

      // If initial stock was provided, create an initial purchase transaction inside the same atomic transaction
      if (initial_stock && Number(initial_stock) > 0) {
        const today = new Date().toISOString().split('T')[0];
        db.prepare(`
          INSERT INTO inventory_transactions (inventory_item_id, supplier_id, transaction_type, quantity, unit_cost, transaction_date, notes)
          VALUES (?, ?, 'purchase', ?, ?, ?, 'Initial inventory stock opening')
        `).run(itemId, supplier_id || null, Number(initial_stock), Number(unit_cost), today);
      }
      db.exec('COMMIT');
    } catch (txErr) {
      try { db.exec('ROLLBACK'); } catch (_) {}
      throw txErr;
    }

    const created = db.prepare('SELECT * FROM v_current_stock_levels WHERE item_id = ?').get(itemId);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update inventory item
router.put('/items/:id', async (req, res) => {
  try {
    const { farm_id, name, category, unit, unit_cost, reorder_level, supplier_id } = req.body;
    const db = await getDb();
    db.prepare(`
      UPDATE inventory_items
      SET farm_id = ?, name = ?, category = ?, unit = ?, unit_cost = ?, reorder_level = ?, supplier_id = ?
      WHERE id = ?
    `).run(farm_id, name, category, unit, Number(unit_cost), Number(reorder_level), supplier_id || null, req.params.id);

    const updated = db.prepare('SELECT * FROM v_current_stock_levels WHERE item_id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE inventory item
router.delete('/items/:id', async (req, res) => {
  try {
    const db = await getDb();
    db.prepare('DELETE FROM inventory_items WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET inventory transactions (with date range & filters)
router.get('/transactions', async (req, res) => {
  try {
    const { start_date, end_date, item_id, crop_cycle_id, type } = req.query;
    const db = await getDb();

    let query = `
      SELECT 
        t.*,
        i.name as item_name,
        i.category as item_category,
        i.unit,
        s.name as supplier_name,
        p.plot_code,
        p.name as plot_name,
        cr.name as crop_name,
        cv.name as variety_name,
        c.season as cycle_season
      FROM inventory_transactions t
      JOIN inventory_items i ON t.inventory_item_id = i.id
      LEFT JOIN suppliers s ON t.supplier_id = s.id
      LEFT JOIN crop_cycles c ON t.crop_cycle_id = c.id
      LEFT JOIN plots p ON c.plot_id = p.id
      LEFT JOIN crop_varieties cv ON c.crop_variety_id = cv.id
      LEFT JOIN crops cr ON cv.crop_id = cr.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      query += ' AND t.transaction_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND t.transaction_date <= ?';
      params.push(end_date);
    }
    if (item_id) {
      query += ' AND t.inventory_item_id = ?';
      params.push(item_id);
    }
    if (crop_cycle_id) {
      query += ' AND t.crop_cycle_id = ?';
      params.push(crop_cycle_id);
    }
    if (type) {
      query += ' AND t.transaction_type = ?';
      params.push(type);
    }

    query += ' ORDER BY t.transaction_date DESC, t.id DESC';

    const transactions = db.prepare(query).all(...params);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create inventory transaction (Log Usage, Purchase, Wastage, Adjustment)
router.post('/transactions', async (req, res) => {
  try {
    const { inventory_item_id, crop_cycle_id, supplier_id, transaction_type, quantity, unit_cost, transaction_date, notes } = req.body;
    
    if (!inventory_item_id || !transaction_type || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Item, transaction type, and positive quantity are required.' });
    }

    const db = await getDb();
    
    // If unit_cost was omitted, fetch current unit_cost from item
    let resolvedUnitCost = unit_cost;
    if (resolvedUnitCost == null) {
      const item = db.prepare('SELECT unit_cost FROM inventory_items WHERE id = ?').get(inventory_item_id);
      resolvedUnitCost = item ? item.unit_cost : 0;
    }

    const transDate = transaction_date || new Date().toISOString().split('T')[0];

    // Attempt insert - this will trigger trg_prevent_negative_inventory if usage > current_stock!
    const result = db.prepare(`
      INSERT INTO inventory_transactions (inventory_item_id, crop_cycle_id, supplier_id, transaction_type, quantity, unit_cost, transaction_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      inventory_item_id,
      crop_cycle_id || null,
      supplier_id || null,
      transaction_type,
      Number(quantity),
      Number(resolvedUnitCost),
      transDate,
      notes || null
    );

    const created = db.prepare(`
      SELECT t.*, i.name as item_name, i.unit, i.category as item_category
      FROM inventory_transactions t
      JOIN inventory_items i ON t.inventory_item_id = i.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    // Also return updated item stock level
    const updatedItem = db.prepare('SELECT * FROM v_current_stock_levels WHERE item_id = ?').get(inventory_item_id);

    res.status(201).json({ transaction: created, updatedItem });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

