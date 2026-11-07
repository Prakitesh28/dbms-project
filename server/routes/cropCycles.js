import express from 'express';
import { getDb } from '../db/connection.js';

const router = express.Router();

// GET all crop cycles with rich joins and variance metrics
router.get('/', async (req, res) => {
  try {
    const { farm_id, plot_id, status, season } = req.query;
    const db = await getDb();
    
    let query = `
      SELECT 
        c.*,
        p.plot_code,
        p.name as plot_name,
        p.area_acres,
        p.soil_type,
        f.id as farm_id,
        f.name as farm_name,
        cv.name as variety_name,
        cv.days_to_maturity,
        cv.expected_yield_per_acre,
        cr.id as crop_id,
        cr.name as crop_name,
        cr.category as crop_category,
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
          SELECT COALESCE(SUM(t.total_cost), 0.0)
          FROM inventory_transactions t
          WHERE t.crop_cycle_id = c.id AND t.transaction_type = 'usage'
        ) as total_input_cost,
        (
          SELECT COALESCE(SUM(s.total_amount), 0.0)
          FROM harvest_records h
          JOIN sales_records s ON s.harvest_id = h.id
          WHERE h.crop_cycle_id = c.id
        ) as total_revenue
      FROM crop_cycles c
      JOIN plots p ON c.plot_id = p.id
      JOIN farms f ON p.farm_id = f.id
      JOIN crop_varieties cv ON c.crop_variety_id = cv.id
      JOIN crops cr ON cv.crop_id = cr.id
      WHERE 1=1
    `;
    const params = [];

    if (farm_id) {
      query += ' AND f.id = ?';
      params.push(farm_id);
    }
    if (plot_id) {
      query += ' AND c.plot_id = ?';
      params.push(plot_id);
    }
    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }
    if (season) {
      query += ' AND c.season = ?';
      params.push(season);
    }

    query += ' ORDER BY c.sowing_date DESC';

    const cycles = db.prepare(query).all(...params);
    res.json(cycles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single crop cycle with related usages and harvests
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const cycle = db.prepare(`
      SELECT 
        c.*,
        p.plot_code,
        p.name as plot_name,
        p.area_acres,
        p.soil_type,
        f.id as farm_id,
        f.name as farm_name,
        cv.name as variety_name,
        cr.id as crop_id,
        cr.name as crop_name,
        cr.category as crop_category,
        cr.standard_yield_unit,
        ROUND(COALESCE(c.actual_yield, 0.0) - c.estimated_yield, 2) as variance_units,
        ROUND(
          CASE 
            WHEN c.estimated_yield > 0 
            THEN ((COALESCE(c.actual_yield, 0.0) - c.estimated_yield) / c.estimated_yield) * 100.0
            ELSE 0.0 
          END, 2
        ) as variance_percentage
      FROM crop_cycles c
      JOIN plots p ON c.plot_id = p.id
      JOIN farms f ON p.farm_id = f.id
      JOIN crop_varieties cv ON c.crop_variety_id = cv.id
      JOIN crops cr ON cv.crop_id = cr.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!cycle) return res.status(404).json({ error: 'Crop cycle not found' });

    // Associated input usages
    const usages = db.prepare(`
      SELECT t.*, i.name as item_name, i.category as item_category, i.unit
      FROM inventory_transactions t
      JOIN inventory_items i ON t.inventory_item_id = i.id
      WHERE t.crop_cycle_id = ? AND t.transaction_type = 'usage'
      ORDER BY t.transaction_date ASC
    `).all(req.params.id);

    // Associated harvests
    const harvests = db.prepare(`
      SELECT h.*, 
        (SELECT COALESCE(SUM(s.quantity_sold), 0) FROM sales_records s WHERE s.harvest_id = h.id) as quantity_sold,
        (SELECT COALESCE(SUM(s.total_amount), 0) FROM sales_records s WHERE s.harvest_id = h.id) as total_revenue
      FROM harvest_records h
      WHERE h.crop_cycle_id = ?
      ORDER BY h.harvest_date ASC
    `).all(req.params.id);

    res.json({ ...cycle, usages, harvests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create crop cycle
router.post('/', async (req, res) => {
  try {
    const { plot_id, crop_variety_id, season, sowing_date, expected_harvest_date, estimated_yield, status, notes } = req.body;
    
    if (!plot_id || !crop_variety_id || !season || !sowing_date || !expected_harvest_date || estimated_yield == null) {
      return res.status(400).json({ error: 'Missing required crop cycle fields' });
    }

    const db = await getDb();
    const result = db.prepare(`
      INSERT INTO crop_cycles (plot_id, crop_variety_id, season, sowing_date, expected_harvest_date, estimated_yield, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      plot_id, 
      crop_variety_id, 
      season, 
      sowing_date, 
      expected_harvest_date, 
      Number(estimated_yield), 
      status || 'Planned', 
      notes || null
    );

    const created = db.prepare('SELECT * FROM crop_cycles WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update crop cycle
router.put('/:id', async (req, res) => {
  try {
    const { plot_id, crop_variety_id, season, sowing_date, expected_harvest_date, actual_harvest_date, estimated_yield, actual_yield, status, notes } = req.body;
    const db = await getDb();

    db.prepare(`
      UPDATE crop_cycles
      SET plot_id = ?, crop_variety_id = ?, season = ?, sowing_date = ?, expected_harvest_date = ?, 
          actual_harvest_date = ?, estimated_yield = ?, actual_yield = ?, status = ?, notes = ?
      WHERE id = ?
    `).run(
      plot_id, 
      crop_variety_id, 
      season, 
      sowing_date, 
      expected_harvest_date, 
      actual_harvest_date || null, 
      Number(estimated_yield), 
      actual_yield != null ? Number(actual_yield) : null, 
      status, 
      notes || null, 
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM crop_cycles WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE crop cycle
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    db.prepare('DELETE FROM crop_cycles WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Crop cycle deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

