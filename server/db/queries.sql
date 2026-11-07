-- ==============================================================================
-- FarmLedger: Analytical SQL Queries
-- Demonstrates Advanced DBMS Concepts: Aggregations, Window Functions,
-- Multi-Table Joins, CTEs, Case Statements, and Relational Division
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Query 1: Input Cost Per Acre per Crop Cycle
-- Question Answered:
-- "What is the total expenditure on seeds, fertilisers, and pesticides for
-- each completed or active crop cycle, normalized per cultivated acre?"
-- DBMS Concepts: INNER JOIN, LEFT JOIN, SUM with NULL coalescence, Computed Metric
-- ------------------------------------------------------------------------------
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
ORDER BY c.sowing_date DESC;


-- ------------------------------------------------------------------------------
-- Query 2: Yield Per Acre and Estimate vs. Actual Variance Analysis
-- Question Answered:
-- "How productive was each crop cycle per acre, and what percentage did the
-- actual harvested yield deviate from the agronomist estimate?"
-- DBMS Concepts: Mathematical Projection, Conditional CASE logic, Threshold Flagging
-- ------------------------------------------------------------------------------
SELECT
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
ORDER BY c.sowing_date DESC;


-- ------------------------------------------------------------------------------
-- Query 3: Crop Economic Profitability & Return on Investment (ROI)
-- Question Answered:
-- "Which crop generated the highest gross revenue, net profit, and profit margin
-- after deducting all direct input usage expenses?"
-- DBMS Concepts: Common Table Expressions (CTEs), Outer Aggregations, Financial Modeling
-- ------------------------------------------------------------------------------
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
ORDER BY net_profit DESC;


-- ------------------------------------------------------------------------------
-- Query 4: Seasonal Year-over-Year Performance Comparison
-- Question Answered:
-- "How do yields and input expenditures compare across major agrarian seasons
-- (e.g. Kharif 2024 vs Kharif 2025)?"
-- DBMS Concepts: Season grouping, Comparative Metrics, Multi-year Trend
-- ------------------------------------------------------------------------------
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
ORDER BY MIN(c.sowing_date) ASC;


-- ------------------------------------------------------------------------------
-- Query 5: Plot Cropping History & Rotation Sequence
-- Question Answered:
-- "What is the historical chronological succession of crops grown on each plot,
-- helping detect monoculture risk or nitrogen depletion?"
-- DBMS Concepts: Window Functions (LAG, OVER), Date Arithmetic, Historical Tracking
-- ------------------------------------------------------------------------------
SELECT
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
ORDER BY p.plot_code, c.sowing_date ASC;


-- ------------------------------------------------------------------------------
-- Query 6: Underperforming Crop Cycles Alert (Deficit > 15%)
-- Question Answered:
-- "Which crop cycles produced harvest yields more than 15% below estimate,
-- requiring agronomical investigation or insurance review?"
-- DBMS Concepts: Filtering with WHERE on Computed Expressions, Alert Generation
-- ------------------------------------------------------------------------------
SELECT
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
ORDER BY deficit_percentage ASC;


-- ------------------------------------------------------------------------------
-- Query 7: Monthly Inventory Movement and Valuation Trends
-- Question Answered:
-- "How does inventory expenditure fluctuate month-by-month between bulk purchases,
-- field applications (usage), and wastage?"
-- DBMS Concepts: Date Formatting, Pivot Aggregations, Rolling Cash Flow
-- ------------------------------------------------------------------------------
SELECT
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
ORDER BY month ASC;


-- ------------------------------------------------------------------------------
-- Query 8: Inventory Stock Health Classification
-- Question Answered:
-- "Which inventory items require immediate supplier reordering or are critical stockouts?"
-- DBMS Concepts: CASE Expressions, Domain Categorization, Supplier Joins
-- ------------------------------------------------------------------------------
SELECT
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
ORDER BY (i.current_stock <= i.reorder_level) DESC, i.current_stock ASC;

