import express from 'express';
import { getDb } from '../db/connection.js';

const router = express.Router();

// GET all harvests with sales rollup
router.get('/', async (req, res) => {
  try {
    const { cycle_id } = req.query;
    const db = await getDb();

    let query = `
      SELECT 
        h.*,
        c.season,
        c.sowing_date,
        p.plot_code,
        p.name as plot_name,
        cr.name as crop_name,
        cv.name as variety_name,
        f.name as farm_name,
        COALESCE(SUM(s.quantity_sold), 0.0) as total_sold_qty,
        ROUND(h.quantity_harvested - COALESCE(SUM(s.quantity_sold), 0.0), 2) as remaining_qty,
        COALESCE(SUM(s.total_amount), 0.0) as total_sales_revenue
      FROM harvest_records h
      JOIN crop_cycles c ON h.crop_cycle_id = c.id
      JOIN plots p ON c.plot_id = p.id
      JOIN farms f ON p.farm_id = f.id
      JOIN crop_varieties cv ON c.crop_variety_id = cv.id
      JOIN crops cr ON cv.crop_id = cr.id
      LEFT JOIN sales_records s ON s.harvest_id = h.id
      WHERE 1=1
    `;
    const params = [];

    if (cycle_id) {
      query += ' AND h.crop_cycle_id = ?';
      params.push(cycle_id);
    }

    query += ' GROUP BY h.id ORDER BY h.harvest_date DESC';

    const harvests = db.prepare(query).all(...params);
    res.json(harvests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create harvest
router.post('/', async (req, res) => {
  try {
    const { crop_cycle_id, harvest_date, quantity_harvested, unit, quality_grade, storage_location, notes } = req.body;
    if (!crop_cycle_id || !harvest_date || !quantity_harvested || quantity_harvested <= 0) {
      return res.status(400).json({ error: 'Crop cycle, valid harvest date, and positive quantity are required.' });
    }

    const db = await getDb();
    const result = db.prepare(`
      INSERT INTO harvest_records (crop_cycle_id, harvest_date, quantity_harvested, unit, quality_grade, storage_location, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      crop_cycle_id,
      harvest_date,
      Number(quantity_harvested),
      unit || 'kg',
      quality_grade || 'Grade A',
      storage_location || null,
      notes || null
    );

    const created = db.prepare(`
      SELECT h.*, cr.name as crop_name, cv.name as variety_name
      FROM harvest_records h
      JOIN crop_cycles c ON h.crop_cycle_id = c.id
      JOIN crop_varieties cv ON c.crop_variety_id = cv.id
      JOIN crops cr ON cv.crop_id = cr.id
      WHERE h.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update harvest
router.put('/:id', async (req, res) => {
  try {
    const { crop_cycle_id, harvest_date, quantity_harvested, unit, quality_grade, storage_location, notes } = req.body;
    const db = await getDb();
    
    db.prepare(`
      UPDATE harvest_records
      SET crop_cycle_id = ?, harvest_date = ?, quantity_harvested = ?, unit = ?, quality_grade = ?, storage_location = ?, notes = ?
      WHERE id = ?
    `).run(
      crop_cycle_id,
      harvest_date,
      Number(quantity_harvested),
      unit || 'kg',
      quality_grade,
      storage_location || null,
      notes || null,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM harvest_records WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE harvest
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    db.prepare('DELETE FROM harvest_records WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Harvest record deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

