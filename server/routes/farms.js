import express from 'express';
import { getDb } from '../db/connection.js';

const router = express.Router();

// GET all farms
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const farms = db.prepare(`
      SELECT f.*, 
        COUNT(DISTINCT p.id) as plot_count,
        COALESCE(SUM(p.area_acres), 0) as cultivated_acres
      FROM farms f
      LEFT JOIN plots p ON p.farm_id = f.id
      GROUP BY f.id
      ORDER BY f.id ASC
    `).all();
    res.json(farms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single farm
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const farm = db.prepare('SELECT * FROM farms WHERE id = ?').get(req.params.id);
    if (!farm) return res.status(404).json({ error: 'Farm not found' });
    res.json(farm);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create farm
router.post('/', async (req, res) => {
  try {
    const { name, location, latitude, longitude, total_area_acres } = req.body;
    if (!name || !location || latitude == null || longitude == null || !total_area_acres) {
      return res.status(400).json({ error: 'Missing required farm fields' });
    }
    const db = await getDb();
    const result = db.prepare(`
      INSERT INTO farms (name, location, latitude, longitude, total_area_acres)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, location, Number(latitude), Number(longitude), Number(total_area_acres));
    
    const created = db.prepare('SELECT * FROM farms WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update farm
router.put('/:id', async (req, res) => {
  try {
    const { name, location, latitude, longitude, total_area_acres } = req.body;
    const db = await getDb();
    db.prepare(`
      UPDATE farms 
      SET name = ?, location = ?, latitude = ?, longitude = ?, total_area_acres = ?
      WHERE id = ?
    `).run(name, location, Number(latitude), Number(longitude), Number(total_area_acres), req.params.id);
    
    const updated = db.prepare('SELECT * FROM farms WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE farm
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    db.prepare('DELETE FROM farms WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Farm deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

