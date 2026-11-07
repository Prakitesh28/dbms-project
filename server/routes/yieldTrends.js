import express from 'express';
import { getDb } from '../db/connection.js';

const router = express.Router();

// GET /api/yield-trends
router.get('/', async (req, res) => {
  try {
    const { crop_id } = req.query;
    const db = await getDb();

    // 1. All historical cycles with yield metrics & underperformance flags
    let query = `
      SELECT 
        c.id as cycle_id,
        c.season,
        c.sowing_date,
        c.expected_harvest_date,
        c.actual_harvest_date,
        c.status,
        c.estimated_yield,
        c.actual_yield,
        cr.id as crop_id,
        cr.name as crop_name,
        cr.category as crop_category,
        cr.standard_yield_unit,
        cv.name as variety_name,
        p.plot_code,
        p.name as plot_name,
        p.area_acres,
        ROUND(c.estimated_yield / p.area_acres, 2) as estimated_per_acre,
        ROUND(c.actual_yield / p.area_acres, 2) as actual_per_acre,
        ROUND(c.actual_yield - c.estimated_yield, 2) as variance_units,
        ROUND(
          CASE 
            WHEN c.estimated_yield > 0 
            THEN ((c.actual_yield - c.estimated_yield) / c.estimated_yield) * 100.0
            ELSE 0.0 
          END, 2
        ) as variance_percentage,
        CASE 
          WHEN c.status = 'Harvested' AND c.estimated_yield > 0 AND ((c.actual_yield - c.estimated_yield) / c.estimated_yield) < -0.15 
          THEN 1 
          ELSE 0 
        END as is_deficit_flagged,
        c.notes
      FROM crop_cycles c
      JOIN plots p ON c.plot_id = p.id
      JOIN crop_varieties cv ON c.crop_variety_id = cv.id
      JOIN crops cr ON cv.crop_id = cr.id
      WHERE c.status = 'Harvested'
    `;
    const params = [];

    if (crop_id) {
      query += ' AND cr.id = ?';
      params.push(crop_id);
    }

    query += ' ORDER BY c.sowing_date ASC';

    const cycles = db.prepare(query).all(...params);

    // 2. Aggregate seasonal comparison series per crop for charting
    const crops = db.prepare('SELECT id, name, standard_yield_unit FROM crops ORDER BY name ASC').all();

    // Grouping for multi-line charts across seasons
    const seasonsList = [...new Set(cycles.map(c => c.season))];
    const chartData = seasonsList.map(season => {
      const entry = { season };
      crops.forEach(crop => {
        const matching = cycles.filter(c => c.season === season && c.crop_id === crop.id);
        if (matching.length > 0) {
          const totalActual = matching.reduce((sum, m) => sum + m.actual_yield, 0);
          const totalEstimated = matching.reduce((sum, m) => sum + m.estimated_yield, 0);
          entry[`${crop.name}_actual`] = totalActual;
          entry[`${crop.name}_estimated`] = totalEstimated;
        }
      });
      return entry;
    });

    const flaggedCycles = cycles.filter(c => c.is_deficit_flagged === 1);

    res.json({
      crops,
      cycles,
      chartData,
      flaggedCycles,
      flaggedCount: flaggedCycles.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

