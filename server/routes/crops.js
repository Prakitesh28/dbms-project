import express from 'express';
import { getDb } from '../db/connection.js';

const router = express.Router();

// GET all crops with their varieties
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const crops = db.prepare('SELECT * FROM crops ORDER BY name ASC').all();
    const varieties = db.prepare('SELECT * FROM crop_varieties ORDER BY name ASC').all();
    
    const cropsWithVarieties = crops.map(c => ({
      ...c,
      varieties: varieties.filter(v => v.crop_id === c.id)
    }));

    res.json(cropsWithVarieties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all varieties
router.get('/varieties', async (req, res) => {
  try {
    const db = await getDb();
    const varieties = db.prepare(`
      SELECT cv.*, cr.name as crop_name, cr.category as crop_category, cr.standard_yield_unit
      FROM crop_varieties cv
      JOIN crops cr ON cv.crop_id = cr.id
      ORDER BY cr.name ASC, cv.name ASC
    `).all();
    res.json(varieties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create crop
router.post('/', async (req, res) => {
  try {
    const { name, category, standard_yield_unit, description } = req.body;
    const db = await getDb();
    const result = db.prepare(`
      INSERT INTO crops (name, category, standard_yield_unit, description)
      VALUES (?, ?, ?, ?)
    `).run(name, category, standard_yield_unit || 'kg', description || '');
    
    const created = db.prepare('SELECT * FROM crops WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST create crop variety
router.post('/varieties', async (req, res) => {
  try {
    const { crop_id, name, days_to_maturity, expected_yield_per_acre, optimal_season } = req.body;
    const db = await getDb();
    const result = db.prepare(`
      INSERT INTO crop_varieties (crop_id, name, days_to_maturity, expected_yield_per_acre, optimal_season)
      VALUES (?, ?, ?, ?, ?)
    `).run(crop_id, name, Number(days_to_maturity), Number(expected_yield_per_acre), optimal_season);
    
    const created = db.prepare(`
      SELECT cv.*, cr.name as crop_name, cr.category as crop_category, cr.standard_yield_unit
      FROM crop_varieties cv
      JOIN crops cr ON cv.crop_id = cr.id
      WHERE cv.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE crop
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    db.prepare('DELETE FROM crops WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Crop deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE variety
router.delete('/varieties/:id', async (req, res) => {
  try {
    const db = await getDb();
    db.prepare('DELETE FROM crop_varieties WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Variety deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

