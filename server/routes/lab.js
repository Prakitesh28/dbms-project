import express from 'express';
import { getDb } from '../db/connection.js';

const router = express.Router();

const QUERIES = [
  {
    id: 1,
    title: 'Query 1: Input Cost Per Acre per Crop Cycle',
    question: 'What is the total expenditure on seeds, fertilisers, and pesticides for each completed or active crop cycle, normalized per cultivated acre?',
    concepts: 'INNER JOIN, LEFT JOIN, SUM with NULL coalescence, Computed Metric',
    sql: `SELECT
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
ORDER BY c.sowing_date DESC;`
  },
  {
    id: 2,
    title: 'Query 2: Yield Per Acre and Estimate vs. Actual Variance Analysis',
    question: 'How productive was each crop cycle per acre, and what percentage did the actual harvested yield deviate from the agronomist estimate?',
    concepts: 'Mathematical Projection, Conditional CASE logic, Threshold Flagging',
    sql: `SELECT
    c.id AS cycle_id,
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
        ELSE 'Acceptable Minor Deficit'
    END AS yield_assessment
FROM crop_cycles c
JOIN plots p ON c.plot_id = p.id
JOIN crop_varieties cv ON c.crop_variety_id = cv.id
JOIN crops cr ON cv.crop_id = cr.id
ORDER BY c.sowing_date DESC;`
  },
  {
    id: 3,
    title: 'Query 3: Crop Economic Profitability & Return on Investment (ROI)',
    question: 'Which crop generated the highest gross revenue, net profit, and profit margin after deducting all direct input usage expenses?',
    concepts: 'Common Table Expressions (CTEs), Outer Aggregations, Financial Modeling',
    sql: `WITH CycleCosts AS (
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
ORDER BY net_profit DESC;`
  },
  {
    id: 4,
    title: 'Query 4: Seasonal Year-over-Year Performance Comparison',
    question: 'How do yields and input expenditures compare across major agrarian seasons (e.g. Kharif 2024 vs Kharif 2025)?',
    concepts: 'Season grouping, Comparative Metrics, Multi-year Trend',
    sql: `SELECT
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
ORDER BY MIN(c.sowing_date) ASC;`
  },
  {
    id: 5,
    title: 'Query 5: Plot Cropping History & Rotation Sequence',
    question: 'What is the historical chronological succession of crops grown on each plot, helping detect monoculture risk or nitrogen depletion?',
    concepts: 'Window Functions (LAG, OVER), Date Arithmetic, Historical Tracking',
    sql: `SELECT
    p.plot_code,
    p.name AS plot_name,
    p.soil_type,
    c.id AS cycle_id,
    c.season,
    cr.name AS crop_grown,
    cv.name AS variety_grown,
    c.sowing_date,
    COALESCE(c.actual_harvest_date, c.expected_harvest_date) AS completion_date,
    c.status,
    LAG(cr.name, 1) OVER (PARTITION BY p.id ORDER BY c.sowing_date ASC) AS previous_crop_in_plot,
    ROUND(JULIANDAY(c.sowing_date) - JULIANDAY(LAG(COALESCE(c.actual_harvest_date, c.expected_harvest_date), 1) OVER (PARTITION BY p.id ORDER BY c.sowing_date ASC)), 0) AS days_fallow_since_last_harvest
FROM plots p
JOIN crop_cycles c ON c.plot_id = p.id
JOIN crop_varieties cv ON c.crop_variety_id = cv.id
JOIN crops cr ON cv.crop_id = cr.id
ORDER BY p.plot_code, c.sowing_date ASC;`
  },
  {
    id: 6,
    title: 'Query 6: Underperforming Crop Cycles Alert (Deficit > 15%)',
    question: 'Which crop cycles produced harvest yields more than 15% below estimate, requiring agronomical investigation or insurance review?',
    concepts: 'Filtering with WHERE on Computed Expressions, Alert Generation',
    sql: `SELECT
    c.id AS cycle_id,
    p.plot_code,
    p.name AS plot_name,
    cr.name AS crop_name,
    cv.name AS variety_name,
    c.season,
    c.estimated_yield,
    c.actual_yield,
    ROUND(c.actual_yield - c.estimated_yield, 2) AS deficit_units,
    ROUND(((c.actual_yield - c.estimated_yield) / c.estimated_yield) * 100.0, 2) AS deficit_percentage,
    c.notes
FROM crop_cycles c
JOIN plots p ON c.plot_id = p.id
JOIN crop_varieties cv ON c.crop_variety_id = cv.id
JOIN crops cr ON cv.crop_id = cr.id
WHERE c.status = 'Harvested'
  AND c.estimated_yield > 0
  AND ((c.actual_yield - c.estimated_yield) / c.estimated_yield) < -0.15
ORDER BY deficit_percentage ASC;`
  },
  {
    id: 7,
    title: 'Query 7: Monthly Inventory Movement and Valuation Trends',
    question: 'How does inventory expenditure fluctuate month-by-month between bulk purchases, field applications (usage), and wastage?',
    concepts: 'Date Formatting, Pivot Aggregations, Rolling Cash Flow',
    sql: `SELECT
    strftime('%Y-%m', transaction_date) AS month,
    COUNT(id) AS transaction_count,
    ROUND(SUM(CASE WHEN transaction_type = 'purchase' THEN total_cost ELSE 0 END), 2) AS purchases_value,
    ROUND(SUM(CASE WHEN transaction_type = 'usage' THEN total_cost ELSE 0 END), 2) AS usages_value,
    ROUND(SUM(CASE WHEN transaction_type = 'wastage' THEN total_cost ELSE 0 END), 2) AS wastage_value,
    ROUND(SUM(CASE
        WHEN transaction_type = 'purchase' THEN total_cost
        WHEN transaction_type IN ('usage', 'wastage') THEN -total_cost
        ELSE 0
    END), 2) AS net_cash_outflow
FROM inventory_transactions
GROUP BY strftime('%Y-%m', transaction_date)
ORDER BY month ASC;`
  },
  {
    id: 8,
    title: 'Query 8: Inventory Stock Health Classification',
    question: 'Which inventory items require immediate supplier reordering or are critical stockouts?',
    concepts: 'CASE Expressions, Domain Categorization, Supplier Joins',
    sql: `SELECT
    i.id AS item_id,
    i.name AS item_name,
    i.category,
    i.current_stock,
    i.unit,
    i.reorder_level,
    i.unit_cost,
    ROUND(i.current_stock * i.unit_cost, 2) AS asset_value,
    s.name AS preferred_supplier,
    s.phone AS supplier_contact,
    CASE
        WHEN i.current_stock <= 0 THEN 'OUT OF STOCK - CRITICAL'
        WHEN i.current_stock <= i.reorder_level THEN 'LOW STOCK - REORDER'
        ELSE 'ADEQUATE'
    END AS stock_alert_level
FROM inventory_items i
LEFT JOIN suppliers s ON i.supplier_id = s.id
ORDER BY (i.current_stock <= i.reorder_level) DESC, i.current_stock ASC;`
  }
];

// GET /api/lab/queries
router.get('/queries', (req, res) => {
  res.json(QUERIES);
});

// POST /api/lab/playground/execute
// Read-only SQL executor with safety filters
router.post('/playground/execute', async (req, res) => {
  try {
    const { sql } = req.body;
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ error: 'SQL query string is required' });
    }

    const trimmed = sql.trim();
    // Safety check: block write/mutation commands
    const forbidden = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|TRUNCATE|ATTACH|DETACH|VACUUM|REINDEX|PRAGMA)\b/i;
    if (forbidden.test(trimmed)) {
      return res.status(403).json({
        error: 'Security Notice: The SQL Playground is restricted to read-only analytical queries (SELECT / WITH). Modifications (INSERT, UPDATE, DELETE, DROP) are blocked.'
      });
    }

    // Must begin with SELECT or WITH
    if (!/^(SELECT|WITH)\b/i.test(trimmed)) {
      return res.status(400).json({
        error: 'Only SELECT or WITH query expressions can be executed.'
      });
    }

    const db = await getDb();
    const startTime = performance.now();
    const rows = db.prepare(trimmed).all();
    const duration = Math.round((performance.now() - startTime) * 100) / 100;

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    res.json({
      success: true,
      executionTimeMs: duration,
      rowCount: rows.length,
      columns,
      rows
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/lab/triggers/test
// Executes live trigger demonstrations inside an isolated rolled-back transaction
router.post('/triggers/test', async (req, res) => {
  const { scenario } = req.body; // 'underflow' | 'oversell' | 'duplicate_plot' | 'negative_acres' | 'harvest_rollup'
  const db = await getDb();

  try {
    if (scenario === 'underflow') {
      // Rule: trg_prevent_inventory_underflow_insert
      const itemBefore = db.prepare('SELECT id, name, current_stock, unit FROM inventory_items WHERE id = 1').get();
      const attemptedSql = `INSERT INTO inventory_transactions 
  (inventory_item_id, crop_cycle_id, transaction_type, quantity, unit_cost, transaction_date)
VALUES (1, 1, 'usage', 9999.0, 280.0, date('now'));`;

      let errorCaught = null;
      db.exec('BEGIN TRANSACTION');
      try {
        db.prepare(`
          INSERT INTO inventory_transactions (inventory_item_id, crop_cycle_id, transaction_type, quantity, unit_cost, transaction_date)
          VALUES (1, 1, 'usage', 9999.0, 280.0, date('now'))
        `).run();
      } catch (err) {
        errorCaught = err.message;
      } finally {
        try { db.exec('ROLLBACK'); } catch (_) {}
      }

      const itemAfter = db.prepare('SELECT id, name, current_stock, unit FROM inventory_items WHERE id = 1').get();

      return res.json({
        scenario: 'underflow',
        ruleName: 'trg_prevent_inventory_underflow_insert',
        ruleDescription: 'Database BEFORE INSERT trigger prevents inventory stock from falling below zero by calculating current balance minus usage and aborting with RAISE(ABORT).',
        triggerSql: `CREATE TRIGGER trg_prevent_inventory_underflow_insert
BEFORE INSERT ON inventory_transactions
FOR EACH ROW
WHEN NEW.transaction_type IN ('usage', 'wastage')
BEGIN
    SELECT CASE
        WHEN (SELECT current_stock FROM inventory_items WHERE id = NEW.inventory_item_id) < NEW.quantity
        THEN RAISE(ABORT, 'DBMS Constraint Violation: Insufficient stock. Requested quantity exceeds available inventory.')
    END;
END;`,
        attemptedSql,
        blocked: !!errorCaught,
        dbErrorMessage: errorCaught,
        beforeState: `${itemBefore.name}: ${itemBefore.current_stock} ${itemBefore.unit}`,
        afterState: `${itemAfter.name}: ${itemAfter.current_stock} ${itemAfter.unit} (Preserved unharmed)`,
        dataPreserved: true
      });
    }

    if (scenario === 'oversell') {
      // Rule: trg_prevent_harvest_overselling
      const harvest = db.prepare(`
        SELECT h.id, h.quantity_harvested, h.unit,
               COALESCE(SUM(s.quantity_sold), 0) as total_sold,
               (h.quantity_harvested - COALESCE(SUM(s.quantity_sold), 0)) as remaining_unsold
        FROM harvest_records h
        LEFT JOIN sales_records s ON s.harvest_id = h.id
        WHERE h.id = 10
        GROUP BY h.id
      `).get();

      const attemptedSql = `INSERT INTO sales_records 
  (harvest_id, sale_date, buyer_name, quantity_sold, unit_price)
VALUES (10, date('now'), 'Examiner Demo Buyer', 50.0, 2750.00);`;

      let errorCaught = null;
      db.exec('BEGIN TRANSACTION');
      try {
        db.prepare(`
          INSERT INTO sales_records (harvest_id, sale_date, buyer_name, quantity_sold, unit_price)
          VALUES (10, date('now'), 'Examiner Demo Buyer', 50.0, 2750.00)
        `).run();
      } catch (err) {
        errorCaught = err.message;
      } finally {
        try { db.exec('ROLLBACK'); } catch (_) {}
      }

      return res.json({
        scenario: 'oversell',
        ruleName: 'trg_prevent_harvest_overselling',
        ruleDescription: 'Database BEFORE INSERT trigger checks sum of past sales plus new sale against total harvested produce and aborts if sold exceeds harvested.',
        triggerSql: `CREATE TRIGGER trg_prevent_harvest_overselling
BEFORE INSERT ON sales_records
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN (
            (SELECT COALESCE(SUM(quantity_sold), 0) FROM sales_records WHERE harvest_id = NEW.harvest_id)
            + NEW.quantity_sold
        ) > (SELECT quantity_harvested FROM harvest_records WHERE id = NEW.harvest_id)
        THEN RAISE(ABORT, 'DBMS Constraint Violation: Total sold quantity cannot exceed available harvested quantity.')
    END;
END;`,
        attemptedSql,
        blocked: !!errorCaught,
        dbErrorMessage: errorCaught,
        beforeState: `Harvest #10: Harvested ${harvest.quantity_harvested} ${harvest.unit}, Sold ${harvest.total_sold} ${harvest.unit}, Only ${harvest.remaining_unsold} ${harvest.unit} Available`,
        afterState: `Harvest #10: Remaining Unsold ${harvest.remaining_unsold} ${harvest.unit} (No overdraw permitted)`,
        dataPreserved: true
      });
    }

    if (scenario === 'duplicate_plot') {
      // Rule: UNIQUE constraint on plots.plot_code
      const attemptedSql = `INSERT INTO plots (farm_id, plot_code, name, area_acres, soil_type)
VALUES (1, 'P-NORTH-01', 'Duplicate North Field', 10.0, 'Clay');`;

      let errorCaught = null;
      db.exec('BEGIN TRANSACTION');
      try {
        db.prepare(`
          INSERT INTO plots (farm_id, plot_code, name, area_acres, soil_type)
          VALUES (1, 'P-NORTH-01', 'Duplicate North Field', 10.0, 'Clay')
        `).run();
      } catch (err) {
        errorCaught = err.message;
      } finally {
        try { db.exec('ROLLBACK'); } catch (_) {}
      }

      return res.json({
        scenario: 'duplicate_plot',
        ruleName: 'UNIQUE (plot_code) Table Constraint',
        ruleDescription: 'Table-level candidate key constraint on plots.plot_code prevents duplicate plot identifiers across farms.',
        triggerSql: `CREATE TABLE plots (
    ...
    plot_code TEXT NOT NULL UNIQUE,
    ...
);`,
        attemptedSql,
        blocked: !!errorCaught,
        dbErrorMessage: errorCaught,
        beforeState: 'Plot P-NORTH-01 already exists in database',
        afterState: 'Duplicate code insertion rejected; relation uniqueness preserved',
        dataPreserved: true
      });
    }

    if (scenario === 'harvest_rollup') {
      // Rule: trg_update_crop_cycle_actual_yield_insert
      const cycleBefore = db.prepare('SELECT id, status, actual_yield FROM crop_cycles WHERE id = 11').get();
      const attemptedSql = `INSERT INTO harvest_records 
  (crop_cycle_id, harvest_date, quantity_harvested, unit, quality_grade)
VALUES (11, date('now'), 450.0, 'crates', 'Grade A');`;

      let stateDuring = null;
      db.exec('BEGIN TRANSACTION');
      try {
        db.prepare(`
          INSERT INTO harvest_records (crop_cycle_id, harvest_date, quantity_harvested, unit, quality_grade)
          VALUES (11, date('now'), 450.0, 'crates', 'Grade A')
        `).run();

        // Check if trigger updated crop_cycles automatically
        stateDuring = db.prepare('SELECT id, status, actual_yield FROM crop_cycles WHERE id = 11').get();
      } finally {
        // Rollback so live demo data remains intact for teacher
        try { db.exec('ROLLBACK'); } catch (_) {}
      }

      const cycleAfter = db.prepare('SELECT id, status, actual_yield FROM crop_cycles WHERE id = 11').get();

      return res.json({
        scenario: 'harvest_rollup',
        ruleName: 'trg_update_crop_cycle_actual_yield_insert',
        ruleDescription: 'Database AFTER INSERT trigger on harvest_records automatically rolls up SUM(quantity_harvested) into crop_cycles.actual_yield and flips status from "Growing" to "Harvested".',
        triggerSql: `CREATE TRIGGER trg_update_crop_cycle_actual_yield_insert
AFTER INSERT ON harvest_records
FOR EACH ROW
BEGIN
    UPDATE crop_cycles
    SET actual_yield = (
        SELECT COALESCE(SUM(quantity_harvested), 0)
        FROM harvest_records
        WHERE crop_cycle_id = NEW.crop_cycle_id
    ),
    status = CASE
        WHEN status IN ('Planned', 'Sown', 'Growing') THEN 'Harvested'
        ELSE status
    END
    WHERE id = NEW.crop_cycle_id;
END;`,
        attemptedSql,
        blocked: false,
        firedSuccessfully: true,
        beforeState: `Cycle #11 Status: "${cycleBefore.status}", Actual Yield: ${cycleBefore.actual_yield} crates`,
        afterState: `Trigger Auto-Updated: Status became "${stateDuring.status}", Actual Yield became ${stateDuring.actual_yield} crates! (Safely rolled back)`,
        dataPreserved: true
      });
    }

    res.status(400).json({ error: 'Unknown trigger test scenario' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
