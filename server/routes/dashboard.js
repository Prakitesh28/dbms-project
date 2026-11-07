import express from 'express';
import { getDb } from '../db/connection.js';

const router = express.Router();

// GET /api/dashboard/stats - Six Inventory Stat Cards
router.get('/stats', async (req, res) => {
  try {
    const { farm_id } = req.query;
    const db = await getDb();

    // 1. Total Items & 2. Total Value
    let itemQuery = `
      SELECT 
        COUNT(item_id) as total_items,
        COALESCE(SUM(total_valuation), 0.0) as total_value,
        SUM(CASE WHEN stock_status = 'Low Stock' THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN stock_status = 'Out of Stock' THEN 1 ELSE 0 END) as out_of_stock_count
      FROM v_current_stock_levels
    `;
    const params = [];
    if (farm_id) {
      itemQuery += ' WHERE farm_id = ?';
      params.push(farm_id);
    }
    const itemStats = db.prepare(itemQuery).get(...params);

    // 5. Recent Activity (last 7 days transactions count and net volume)
    const recentActivity = db.prepare(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total_cost), 0.0) as value
      FROM inventory_transactions
      WHERE transaction_date >= date('now', '-7 days')
    `).get();

    // 6. Monthly Activity (Current month vs previous month transaction count and % change)
    const currentMonth = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_cost), 0.0) as value
      FROM inventory_transactions
      WHERE strftime('%Y-%m', transaction_date) = strftime('%Y-%m', 'now')
    `).get();

    const lastMonth = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_cost), 0.0) as value
      FROM inventory_transactions
      WHERE strftime('%Y-%m', transaction_date) = strftime('%Y-%m', date('now', 'start of month', '-1 month'))
    `).get();

    let monthlyChangePct = 0;
    if (lastMonth && lastMonth.count > 0) {
      monthlyChangePct = Math.round(((currentMonth.count - lastMonth.count) / lastMonth.count) * 100);
    } else if (currentMonth.count > 0) {
      monthlyChangePct = 100;
    }

    res.json({
      total_items: {
        value: itemStats.total_items,
        label: 'Total Items',
        status_caption: `${itemStats.total_items} registered stock SKUs`,
        status_color: 'text-emerald-600 bg-emerald-50'
      },
      total_value: {
        value: Number(itemStats.total_value.toFixed(2)),
        label: 'Total Value',
        status_caption: 'Current live holding valuation',
        status_color: 'text-blue-600 bg-blue-50'
      },
      low_stock: {
        value: itemStats.low_stock_count,
        label: 'Low Stock',
        status_caption: itemStats.low_stock_count > 0 ? `${itemStats.low_stock_count} items near depletion threshold` : 'All stocks healthy',
        status_color: itemStats.low_stock_count > 0 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'
      },
      out_of_stock: {
        value: itemStats.out_of_stock_count,
        label: 'Out of Stock',
        status_caption: itemStats.out_of_stock_count > 0 ? 'Urgent reordering needed' : 'Zero depleted items',
        status_color: itemStats.out_of_stock_count > 0 ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'
      },
      recent_activity: {
        value: recentActivity.count,
        label: 'Recent Activity (7d)',
        status_caption: `${recentActivity.count} movements in past 7 days`,
        status_color: 'text-indigo-600 bg-indigo-50'
      },
      monthly_activity: {
        value: currentMonth.count,
        label: 'Monthly Activity',
        status_caption: `${monthlyChangePct >= 0 ? '+' : ''}${monthlyChangePct}% vs previous month`,
        status_color: monthlyChangePct >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 bg-slate-50'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/inventory-charts - Donut by Category & 12-Month Trend Line Chart
router.get('/inventory-charts', async (req, res) => {
  try {
    const db = await getDb();

    // 1. Category Donut: Stock units and Valuation by category
    const categoryStats = db.prepare(`
      SELECT 
        category,
        COUNT(item_id) as item_count,
        ROUND(SUM(current_stock), 1) as total_units,
        ROUND(SUM(total_valuation), 2) as total_valuation
      FROM v_current_stock_levels
      GROUP BY category
      ORDER BY total_valuation DESC
    `).all();

    // 2. 12-Month Trends: Value of purchases/usages and transaction counts
    const monthlyTrends = db.prepare(`
      SELECT 
        strftime('%Y-%m', transaction_date) as month,
        COUNT(id) as transaction_count,
        ROUND(SUM(CASE WHEN transaction_type = 'purchase' THEN total_cost ELSE 0 END), 2) as purchases,
        ROUND(SUM(CASE WHEN transaction_type = 'usage' THEN total_cost ELSE 0 END), 2) as usages,
        ROUND(SUM(total_cost), 2) as total_movement_value
      FROM inventory_transactions
      WHERE transaction_date >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', transaction_date)
      ORDER BY month ASC
    `).all();

    res.json({
      category_distribution: categoryStats,
      monthly_trends: monthlyTrends
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/financial - Financial Tab Data
router.get('/financial', async (req, res) => {
  try {
    const { farm_id } = req.query;
    const db = await getDb();

    let query = `
      SELECT 
        c.id as cycle_id,
        c.season,
        c.sowing_date,
        c.expected_harvest_date,
        c.actual_harvest_date,
        c.status,
        cr.name as crop_name,
        cv.name as variety_name,
        p.plot_code,
        p.name as plot_name,
        p.area_acres,
        f.name as farm_name,
        COALESCE((
          SELECT SUM(t.total_cost) 
          FROM inventory_transactions t 
          WHERE t.crop_cycle_id = c.id AND t.transaction_type = 'usage'
        ), 0.0) as input_costs,
        COALESCE((
          SELECT SUM(s.total_amount) 
          FROM harvest_records h 
          JOIN sales_records s ON s.harvest_id = h.id 
          WHERE h.crop_cycle_id = c.id
        ), 0.0) as sales_revenue
      FROM crop_cycles c
      JOIN plots p ON c.plot_id = p.id
      JOIN farms f ON p.farm_id = f.id
      JOIN crop_varieties cv ON c.crop_variety_id = cv.id
      JOIN crops cr ON cv.crop_id = cr.id
    `;
    const params = [];
    if (farm_id) {
      query += ' WHERE f.id = ?';
      params.push(farm_id);
    }
    query += ' ORDER BY c.sowing_date DESC';

    const cycles = db.prepare(query).all(...params);

    const enriched = cycles.map(c => {
      const profit = Number((c.sales_revenue - c.input_costs).toFixed(2));
      const roi = c.input_costs > 0 ? Number(((profit / c.input_costs) * 100).toFixed(1)) : 0;
      const profit_per_acre = Number((profit / c.area_acres).toFixed(2));
      return {
        ...c,
        profit,
        roi,
        profit_per_acre
      };
    });

    const total_revenue = enriched.reduce((sum, c) => sum + c.sales_revenue, 0);
    const total_costs = enriched.reduce((sum, c) => sum + c.input_costs, 0);
    const net_profit = total_revenue - total_costs;
    const overall_roi = total_costs > 0 ? Number(((net_profit / total_costs) * 100).toFixed(1)) : 0;

    res.json({
      summary: {
        total_revenue: Number(total_revenue.toFixed(2)),
        total_costs: Number(total_costs.toFixed(2)),
        net_profit: Number(net_profit.toFixed(2)),
        overall_roi
      },
      cycles: enriched
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/operations - Operations Tab Data (Plots, active schedules, calendar events)
router.get('/operations', async (req, res) => {
  try {
    const { farm_id } = req.query;
    const db = await getDb();

    let plotsQuery = `
      SELECT p.*, f.name as farm_name,
        (SELECT c.id FROM crop_cycles c WHERE c.plot_id = p.id AND c.status IN ('Planned', 'Sown', 'Growing') ORDER BY c.sowing_date DESC LIMIT 1) as active_cycle_id,
        (SELECT cr.name FROM crop_cycles c JOIN crop_varieties cv ON c.crop_variety_id = cv.id JOIN crops cr ON cv.crop_id = cr.id WHERE c.plot_id = p.id AND c.status IN ('Planned', 'Sown', 'Growing') ORDER BY c.sowing_date DESC LIMIT 1) as active_crop,
        (SELECT cv.name FROM crop_cycles c JOIN crop_varieties cv ON c.crop_variety_id = cv.id WHERE c.plot_id = p.id AND c.status IN ('Planned', 'Sown', 'Growing') ORDER BY c.sowing_date DESC LIMIT 1) as active_variety,
        (SELECT c.status FROM crop_cycles c WHERE c.plot_id = p.id AND c.status IN ('Planned', 'Sown', 'Growing') ORDER BY c.sowing_date DESC LIMIT 1) as cycle_status,
        (SELECT c.sowing_date FROM crop_cycles c WHERE c.plot_id = p.id AND c.status IN ('Planned', 'Sown', 'Growing') ORDER BY c.sowing_date DESC LIMIT 1) as sowing_date,
        (SELECT c.expected_harvest_date FROM crop_cycles c WHERE c.plot_id = p.id AND c.status IN ('Planned', 'Sown', 'Growing') ORDER BY c.sowing_date DESC LIMIT 1) as expected_harvest_date
      FROM plots p
      JOIN farms f ON p.farm_id = f.id
    `;
    const params = [];
    if (farm_id) {
      plotsQuery += ' WHERE p.farm_id = ?';
      params.push(farm_id);
    }
    plotsQuery += ' ORDER BY p.plot_code ASC';

    const plots = db.prepare(plotsQuery).all(...params);

    // Timeline calendar events (sowing and harvest dates)
    const calendarEvents = db.prepare(`
      SELECT 
        c.id as cycle_id,
        p.plot_code,
        p.name as plot_name,
        cr.name as crop_name,
        cv.name as variety_name,
        c.season,
        c.sowing_date,
        c.expected_harvest_date,
        c.actual_harvest_date,
        c.status
      FROM crop_cycles c
      JOIN plots p ON c.plot_id = p.id
      JOIN crop_varieties cv ON c.crop_variety_id = cv.id
      JOIN crops cr ON cv.crop_id = cr.id
      ORDER BY c.sowing_date DESC
    `).all();

    res.json({ plots, calendarEvents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

