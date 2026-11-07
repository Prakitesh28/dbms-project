import express from 'express';
import { getDb } from '../db/connection.js';

const router = express.Router();

// GET all plots (optionally filtered by farm_id)
router.get('/', async (req, res) => {
  try {
    const { farm_id } = req.query;
    const db = await getDb();
    
    let query = `
      SELECT p.*, f.name as farm_name,
        (SELECT c.id FROM crop_cycles c WHERE c.plot_id = p.id AND c.status IN ('Planned', 'Sown', 'Growing') ORDER BY c.sowing_date DESC LIMIT 1) as active_cycle_id,
        (SELECT cr.name FROM crop_cycles c JOIN crop_varieties cv ON c.crop_variety_id = cv.id JOIN crops cr ON cv.crop_id = cr.id WHERE c.plot_id = p.id AND c.status IN ('Planned', 'Sown', 'Growing') ORDER BY c.sowing_date DESC LIMIT 1) as current_crop_name,
        (SELECT cv.name FROM crop_cycles c JOIN crop_varieties cv ON c.crop_variety_id = cv.id WHERE c.plot_id = p.id AND c.status IN ('Planned', 'Sown', 'Growing') ORDER BY c.sowing_date DESC LIMIT 1) as current_variety_name,
        (SELECT c.status FROM crop_cycles c WHERE c.plot_id = p.id AND c.status IN ('Planned', 'Sown', 'Growing') ORDER BY c.sowing_date DESC LIMIT 1) as current_cycle_status,
        (SELECT COUNT(*) FROM crop_cycles c WHERE c.plot_id = p.id) as total_cycles_count
      FROM plots p
      JOIN farms f ON p.farm_id = f.id
    `;
    const params = [];

    if (farm_id) {
      query += ' WHERE p.farm_id = ?';
      params.push(farm_id);
    }
    query += ' ORDER BY p.plot_code ASC';

    const plots = db.prepare(query).all(...params);
    res.json(plots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single plot
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const plot = db.prepare(`
      SELECT p.*, f.name as farm_name 
      FROM plots p
      JOIN farms f ON p.farm_id = f.id
      WHERE p.id = ?
    `).get(req.params.id);
    if (!plot) return res.status(404).json({ error: 'Plot not found' });
    res.json(plot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET plot crop-cycle history
router.get('/:id/history', async (req, res) => {
  try {
    const db = await getDb();
    const history = db.prepare(`
      SELECT 
        c.id as cycle_id,
        c.season,
        cr.name as crop_name,
        cv.name as variety_name,
        c.sowing_date,
        c.expected_harvest_date,
        c.actual_harvest_date,
        c.status,
        c.estimated_yield,
        c.actual_yield,
        cr.standard_yield_unit,
        ROUND(COALESCE(c.actual_yield, 0.0) - c.estimated_yield, 2) as variance_units,
        ROUND(
          CASE 
            WHEN c.estimated_yield > 0 
            THEN ((COALESCE(c.actual_yield, 0.0) - c.estimated_yield) / c.estimated_yield) * 100.0
            ELSE 0.0 
          END, 2
        ) as variance_percentage,
        (
          SELECT COALESCE(SUM(t.total_cost), 0) 
          FROM inventory_transactions t 
          WHERE t.crop_cycle_id = c.id AND t.transaction_type = 'usage'
        ) as total_input_cost,
        (
          SELECT COALESCE(SUM(s.total_amount), 0) 
          FROM harvest_records h 
          JOIN sales_records s ON s.harvest_id = h.id 
          WHERE h.crop_cycle_id = c.id
        ) as total_sales_revenue,
        c.notes
      FROM crop_cycles c
      JOIN crop_varieties cv ON c.crop_variety_id = cv.id
      JOIN crops cr ON cv.crop_id = cr.id
      WHERE c.plot_id = ?
      ORDER BY c.sowing_date DESC
    `).all(req.params.id);

    const plot = db.prepare('SELECT p.*, f.name as farm_name FROM plots p JOIN farms f ON p.farm_id = f.id WHERE p.id = ?').get(req.params.id);
    res.json({ plot, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create plot
router.post('/', async (req, res) => {
  try {
    const { farm_id, plot_code, name, area_acres, soil_type, irrigation_type, status } = req.body;
    if (!farm_id || !plot_code || !name || !area_acres || !soil_type || !irrigation_type) {
      return res.status(400).json({ error: 'Missing required plot fields' });
    }
    const db = await getDb();
    const result = db.prepare(`
      INSERT INTO plots (farm_id, plot_code, name, area_acres, soil_type, irrigation_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(farm_id, plot_code, name, Number(area_acres), soil_type, irrigation_type, status || 'Active');
    
    const created = db.prepare('SELECT * FROM plots WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update plot
router.put('/:id', async (req, res) => {
  try {
    const { farm_id, plot_code, name, area_acres, soil_type, irrigation_type, status } = req.body;
    const db = await getDb();
    db.prepare(`
      UPDATE plots
      SET farm_id = ?, plot_code = ?, name = ?, area_acres = ?, soil_type = ?, irrigation_type = ?, status = ?
      WHERE id = ?
    `).run(farm_id, plot_code, name, Number(area_acres), soil_type, irrigation_type, status, req.params.id);
    
    const updated = db.prepare('SELECT * FROM plots WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE plot
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    db.prepare('DELETE FROM plots WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Plot deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

