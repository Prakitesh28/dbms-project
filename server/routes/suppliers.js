import express from 'express';
import { getDb } from '../db/connection.js';

const router = express.Router();

// GET all suppliers
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const suppliers = db.prepare(`
      SELECT s.*,
        COUNT(DISTINCT i.id) as supplied_items_count,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'purchase' THEN t.total_cost ELSE 0 END), 0) as total_purchase_value
      FROM suppliers s
      LEFT JOIN inventory_items i ON i.supplier_id = s.id
      LEFT JOIN inventory_transactions t ON t.supplier_id = s.id
      GROUP BY s.id
      ORDER BY s.name ASC
    `).all();
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create supplier
router.post('/', async (req, res) => {
  try {
    const { name, contact_person, phone, email, address, rating } = req.body;
    if (!name) return res.status(400).json({ error: 'Supplier name is required.' });

    const db = await getDb();
    const result = db.prepare(`
      INSERT INTO suppliers (name, contact_person, phone, email, address, rating)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, contact_person || null, phone || null, email || null, address || null, rating != null ? Number(rating) : null);

    const created = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update supplier
router.put('/:id', async (req, res) => {
  try {
    const { name, contact_person, phone, email, address, rating } = req.body;
    const db = await getDb();
    db.prepare(`
      UPDATE suppliers
      SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, rating = ?
      WHERE id = ?
    `).run(name, contact_person, phone, email, address, rating != null ? Number(rating) : null, req.params.id);

    const updated = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE supplier
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

