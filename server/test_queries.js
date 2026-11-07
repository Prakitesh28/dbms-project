import { getDb } from './db/connection.js';

async function test() {
  const db = await getDb();
  console.log('\n--- Test 1: v_current_stock_levels ---');
  const stocks = db.prepare('SELECT item_name, category, current_stock, unit, stock_status, total_valuation FROM v_current_stock_levels').all();
  console.table(stocks);

  console.log('\n--- Test 2: v_low_stock_items (Threshold: strictly current_stock <= reorder_level) ---');
  const low = db.prepare('SELECT item_name, current_stock, reorder_level FROM v_low_stock_items').all();
  console.table(low);

  console.log('\n--- Test 3: v_out_of_stock_items ---');
  const oos = db.prepare('SELECT item_name, current_stock, reorder_level FROM v_out_of_stock_items').all();
  console.table(oos);

  console.log('\n--- Test 4: v_estimated_vs_actual_yield ---');
  const yields = db.prepare('SELECT cycle_id, plot_name, crop_name, estimated_yield, actual_yield, yield_variance_percentage, performance_status FROM v_estimated_vs_actual_yield LIMIT 6').all();
  console.table(yields);

  console.log('\n--- Test 5: Trigger Verification (Underflow Prevention) ---');
  try {
    // Attempt to use 999 units of Urea
    db.prepare(`
      INSERT INTO inventory_transactions (inventory_item_id, crop_cycle_id, transaction_type, quantity, unit_cost, transaction_date)
      VALUES (1, 1, 'usage', 9999.0, 280.0, '2026-03-15')
    `).run();
    console.error('Trigger failed: Overdraw was allowed!');
  } catch (err) {
    console.log('Trigger success! Caught expected DBMS exception:\n ', err.message);
  }

  console.log('\n--- Test 6: Trigger Verification (Overselling Prevention) ---');
  try {
    // Harvest 10 has 195.0 q, 190.0 q sold, only 5.0 q remaining. Attempting to sell 20.0 q should fail:
    db.prepare(`
      INSERT INTO sales_records (harvest_id, sale_date, buyer_name, quantity_sold, unit_price)
      VALUES (10, '2026-04-10', 'Demo Oversell Buyer', 20.0, 2750.00)
    `).run();
    console.error('Trigger failed: Overselling was allowed!');
  } catch (err) {
    console.log('Trigger success! Caught expected DBMS oversell exception:\n ', err.message);
  }

  console.log('\n--- Test 7: Query 3 - Crop Economic Profitability & ROI ---');
  const query3Sql = `
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
  `;
  const roiResults = db.prepare(query3Sql).all();
  console.table(roiResults);
}

test().catch(console.error);


