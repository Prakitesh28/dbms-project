import express from 'express';
import { getDb } from '../db/connection.js';

const router = express.Router();

// GET all sales records
router.get('/', async (req, res) => {
  try {
    const { harvest_id } = req.query;
    const db = await getDb();

    let query = `
      SELECT 
        s.*,
        h.harvest_date,
        h.quantity_harvested,
        h.quality_grade,
        h.unit as produce_unit,
        c.id as cycle_id,
        c.season,
        p.plot_code,
        p.name as plot_name,
        cr.name as crop_name,
        cv.name as variety_name,
        f.name as farm_name
      FROM sales_records s
      JOIN harvest_records h ON s.harvest_id = h.id
      JOIN crop_cycles c ON h.crop_cycle_id = c.id
      JOIN plots p ON c.plot_id = p.id
      JOIN farms f ON p.farm_id = f.id
      JOIN crop_varieties cv ON c.crop_variety_id = cv.id
      JOIN crops cr ON cv.crop_id = cr.id
      WHERE 1=1
    `;
    const params = [];

    if (harvest_id) {
      query += ' AND s.harvest_id = ?';
      params.push(harvest_id);
    }

    query += ' ORDER BY s.sale_date DESC, s.id DESC';

    const sales = db.prepare(query).all(...params);
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST record new sale
router.post('/', async (req, res) => {
  try {
    const { harvest_id, sale_date, buyer_name, quantity_sold, unit_price, payment_status, notes } = req.body;
    if (!harvest_id || !sale_date || !buyer_name || !quantity_sold || quantity_sold <= 0 || unit_price == null) {
      return res.status(400).json({ error: 'Harvest ID, sale date, buyer, quantity, and unit price are required.' });
    }

    const db = await getDb();
    const result = db.prepare(`
      INSERT INTO sales_records (harvest_id, sale_date, buyer_name, quantity_sold, unit_price, payment_status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      harvest_id,
      sale_date,
      buyer_name,
      Number(quantity_sold),
      Number(unit_price),
      payment_status || 'Paid',
      notes || null
    );

    const created = db.prepare(`
      SELECT s.*, h.harvest_date, cr.name as crop_name, cv.name as variety_name
      FROM sales_records s
      JOIN harvest_records h ON s.harvest_id = h.id
      JOIN crop_cycles c ON h.crop_cycle_id = c.id
      JOIN crop_varieties cv ON c.crop_variety_id = cv.id
      JOIN crops cr ON cv.crop_id = cr.id
      WHERE s.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE sale
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    db.prepare('DELETE FROM sales_records WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Sale record deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

