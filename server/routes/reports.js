import express from 'express';
import { getDb } from '../db/connection.js';

const router = express.Router();

// 1. Cost per acre report
router.get('/cost-per-acre', async (req, res) => {
  try {
    const db = await getDb();
    const rows = db.prepare(`
      SELECT
        c.id AS cycle_id,
        f.name AS farm_name,
        p.plot_code,
        p.name AS plot_name,
        p.area_acres,
        cr.name AS crop_name,
        cv.name AS variety_name,
        c.season,
        c.status,
        COALESCE(SUM(t.total_cost), 0.0) AS total_input_cost,
        ROUND(COALESCE(SUM(t.total_cost), 0.0) / p.area_acres, 2) AS input_cost_per_acre
      FROM crop_cycles c
      JOIN plots p ON c.plot_id = p.id
      JOIN farms f ON p.farm_id = f.id
      JOIN crop_varieties cv ON c.crop_variety_id = cv.id
      JOIN crops cr ON cv.crop_id = cr.id
      LEFT JOIN inventory_transactions t ON t.crop_cycle_id = c.id AND t.transaction_type = 'usage'
      GROUP BY c.id, f.name, p.plot_code, p.name, p.area_acres, cr.name, cv.name, c.season, c.status
      ORDER BY c.sowing_date DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Yield per acre report
router.get('/yield-per-acre', async (req, res) => {
  try {
    const db = await getDb();
    const rows = db.prepare(`
      SELECT
        c.id AS cycle_id,
        p.plot_code,
        p.name AS plot_name,
        cr.name AS crop_name,
        cv.name AS variety_name,
        c.season,
        p.area_acres,
        c.estimated_yield,
        COALESCE(c.actual_yield, 0.0) AS actual_yield,
        cr.standard_yield_unit AS yield_unit,
        ROUND(c.estimated_yield / p.area_acres, 2) AS estimated_yield_per_acre,
        ROUND(COALESCE(c.actual_yield, 0.0) / p.area_acres, 2) AS actual_yield_per_acre,
        ROUND(COALESCE(c.actual_yield, 0.0) - c.estimated_yield, 2) AS variance_absolute,
        ROUND(
          CASE
            WHEN c.estimated_yield > 0
            THEN ((COALESCE(c.actual_yield, 0.0) - c.estimated_yield) / c.estimated_yield) * 100.0
            ELSE 0.0
          END,
          2
        ) AS variance_pct,
        CASE
          WHEN c.actual_yield IS NULL OR c.status NOT IN ('Harvested', 'Archived') THEN 'Pending Harvest'
          WHEN c.actual_yield >= c.estimated_yield THEN 'Optimal / Exceeded'
          WHEN ((c.actual_yield - c.estimated_yield) / c.estimated_yield) < -0.15 THEN 'CRITICAL DEFICIT (>15%)'
          ELSE 'Minor Shortfall'
        END AS yield_assessment
      FROM crop_cycles c
      JOIN plots p ON c.plot_id = p.id
      JOIN crop_varieties cv ON c.crop_variety_id = cv.id
      JOIN crops cr ON cv.crop_id = cr.id
      ORDER BY c.sowing_date DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Profit by crop report
router.get('/profit-by-crop', async (req, res) => {
  try {
    const db = await getDb();
    const rows = db.prepare(`
      WITH CycleCosts AS (
        SELECT
          t.crop_cycle_id,
          COALESCE(SUM(t.total_cost), 0.0) AS cycle_input_cost
        FROM inventory_transactions t
        WHERE t.transaction_type = 'usage' AND t.crop_cycle_id IS NOT NULL
        GROUP BY t.crop_cycle_id
      ),
      CycleSales AS (
        SELECT
          h.crop_cycle_id,
          COALESCE(SUM(s.total_amount), 0.0) AS cycle_revenue
        FROM harvest_records h
        JOIN sales_records s ON s.harvest_id = h.id
        GROUP BY h.crop_cycle_id
      )
      SELECT
        cr.name AS crop_name,
        cr.category AS crop_category,
        COUNT(DISTINCT c.id) AS cycles_cultivated,
        ROUND(SUM(p.area_acres), 1) AS total_acres_farmed,
        ROUND(COALESCE(SUM(cc.cycle_input_cost), 0.0), 2) AS total_input_costs,
        ROUND(COALESCE(SUM(cs.cycle_revenue), 0.0), 2) AS total_sales_revenue,
        ROUND(COALESCE(SUM(cs.cycle_revenue), 0.0) - COALESCE(SUM(cc.cycle_input_cost), 0.0), 2) AS net_profit,
        ROUND(
          CASE
            WHEN COALESCE(SUM(cc.cycle_input_cost), 0.0) > 0
            THEN ((COALESCE(SUM(cs.cycle_revenue), 0.0) - SUM(cc.cycle_input_cost)) / SUM(cc.cycle_input_cost)) * 100.0
            ELSE 0.0
          END,
          1
        ) AS roi_percentage
      FROM crops cr
      JOIN crop_varieties cv ON cv.crop_id = cr.id
      JOIN crop_cycles c ON c.crop_variety_id = cv.id
      JOIN plots p ON c.plot_id = p.id
      LEFT JOIN CycleCosts cc ON cc.crop_cycle_id = c.id
      LEFT JOIN CycleSales cs ON cs.crop_cycle_id = c.id
      GROUP BY cr.id, cr.name, cr.category
      ORDER BY net_profit DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Seasonal comparisons report
router.get('/seasonal-comparisons', async (req, res) => {
  try {
    const db = await getDb();
    const rows = db.prepare(`
      SELECT
        c.season,
        COUNT(c.id) AS total_cycles,
        ROUND(SUM(p.area_acres), 1) AS total_acres_sown,
        ROUND(COALESCE(SUM(c.actual_yield), 0.0), 2) AS total_harvested_yield,
        ROUND(
          COALESCE(
            (SELECT SUM(t.total_cost)
             FROM inventory_transactions t
             JOIN crop_cycles c2 ON t.crop_cycle_id = c2.id
             WHERE c2.season = c.season AND t.transaction_type = 'usage'),
            0.0
          ),
          2
        ) AS total_seasonal_input_cost,
        ROUND(
          COALESCE(
            (SELECT SUM(s.total_amount)
             FROM sales_records s
             JOIN harvest_records h ON s.harvest_id = h.id
             JOIN crop_cycles c3 ON h.crop_cycle_id = c3.id
             WHERE c3.season = c.season),
            0.0
          ),
          2
        ) AS total_seasonal_revenue
      FROM crop_cycles c
      JOIN plots p ON c.plot_id = p.id
      GROUP BY c.season
      ORDER BY MIN(c.sowing_date) ASC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. CSV Export Endpoint
router.get('/export-csv', async (req, res) => {
  try {
    const { type } = req.query;
    const db = await getDb();
    let rows = [];
    let filename = 'farmledger_export.csv';

    if (type === 'cost_per_acre') {
      rows = db.prepare(`
        SELECT
          c.id AS cycle_id, f.name AS farm_name, p.plot_code, p.name AS plot_name, p.area_acres,
          cr.name AS crop_name, cv.name AS variety_name, c.season, c.status,
          COALESCE(SUM(t.total_cost), 0.0) AS total_input_cost,
          ROUND(COALESCE(SUM(t.total_cost), 0.0) / p.area_acres, 2) AS input_cost_per_acre
        FROM crop_cycles c
        JOIN plots p ON c.plot_id = p.id
        JOIN farms f ON p.farm_id = f.id
        JOIN crop_varieties cv ON c.crop_variety_id = cv.id
        JOIN crops cr ON cv.crop_id = cr.id
        LEFT JOIN inventory_transactions t ON t.crop_cycle_id = c.id AND t.transaction_type = 'usage'
        GROUP BY c.id, f.name, p.plot_code, p.name, p.area_acres, cr.name, cv.name, c.season, c.status
        ORDER BY c.sowing_date DESC
      `).all();
      filename = 'farmledger_cost_per_acre.csv';
    } else if (type === 'yield_per_acre') {
      rows = db.prepare('SELECT * FROM v_estimated_vs_actual_yield').all();
      filename = 'farmledger_yield_analysis.csv';
    } else if (type === 'profit_by_crop') {
      rows = db.prepare(`
        WITH CycleCosts AS (
          SELECT t.crop_cycle_id, COALESCE(SUM(t.total_cost), 0.0) AS cycle_input_cost
          FROM inventory_transactions t WHERE t.transaction_type = 'usage' AND t.crop_cycle_id IS NOT NULL GROUP BY t.crop_cycle_id
        ),
        CycleSales AS (
          SELECT h.crop_cycle_id, COALESCE(SUM(s.total_amount), 0.0) AS cycle_revenue
          FROM harvest_records h JOIN sales_records s ON s.harvest_id = h.id GROUP BY h.crop_cycle_id
        )
        SELECT cr.name AS crop_name, cr.category, COUNT(DISTINCT c.id) AS cycles,
          ROUND(SUM(p.area_acres), 1) AS acres,
          ROUND(COALESCE(SUM(cc.cycle_input_cost), 0.0), 2) AS costs,
          ROUND(COALESCE(SUM(cs.cycle_revenue), 0.0), 2) AS revenue,
          ROUND(COALESCE(SUM(cs.cycle_revenue), 0.0) - COALESCE(SUM(cc.cycle_input_cost), 0.0), 2) AS profit
        FROM crops cr
        JOIN crop_varieties cv ON cv.crop_id = cr.id
        JOIN crop_cycles c ON c.crop_variety_id = cv.id
        JOIN plots p ON c.plot_id = p.id
        LEFT JOIN CycleCosts cc ON cc.crop_cycle_id = c.id
        LEFT JOIN CycleSales cs ON cs.crop_cycle_id = c.id
        GROUP BY cr.id, cr.name, cr.category
        ORDER BY profit DESC
      `).all();
      filename = 'farmledger_profit_by_crop.csv';
    } else if (type === 'transactions') {
      rows = db.prepare(`
        SELECT t.id, t.transaction_date, t.transaction_type, i.name as item_name, i.category,
               t.quantity, i.unit, t.unit_cost, t.total_cost, s.name as supplier, t.notes
        FROM inventory_transactions t
        JOIN inventory_items i ON t.inventory_item_id = i.id
        LEFT JOIN suppliers s ON t.supplier_id = s.id
        ORDER BY t.transaction_date DESC
      `).all();
      filename = 'farmledger_inventory_transactions.csv';
    } else {
      rows = db.prepare('SELECT * FROM v_current_stock_levels').all();
      filename = 'farmledger_inventory_stock.csv';
    }

    if (rows.length === 0) {
      return res.status(200).send('No data available');
    }

    // Convert rows to CSV
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(','),
      ...rows.map(row => 
        headers.map(h => {
          const val = row[h];
          if (val == null) return '';
          const str = String(val).replace(/"/g, '""');
          return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
        }).join(',')
      )
    ];

    const csvContent = csvLines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

