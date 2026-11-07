import { getDb } from './db/connection.js';

async function test() {
  const db = await getDb();
  console.log('\n--- Test 1: v_current_stock_levels ---');
  const stocks = db.prepare('SELECT item_name, category, current_stock, unit, stock_status, total_valuation FROM v_current_stock_levels').all();
  console.table(stocks);

  console.log('\n--- Test 2: v_low_stock_items ---');
  const low = db.prepare('SELECT item_name, current_stock, reorder_level FROM v_low_stock_items').all();
  console.table(low);

  console.log('\n--- Test 3: v_out_of_stock_items ---');
  const oos = db.prepare('SELECT item_name, current_stock, reorder_level FROM v_out_of_stock_items').all();
  console.table(oos);

  console.log('\n--- Test 4: v_estimated_vs_actual_yield ---');
  const yields = db.prepare('SELECT cycle_id, plot_name, crop_name, estimated_yield, actual_yield, yield_variance_percentage, performance_status FROM v_estimated_vs_actual_yield LIMIT 5').all();
  console.table(yields);

  console.log('\n--- Test 5: Trigger Verification (Underflow Prevention) ---');
  try {
    // Attempt to use 999 units of Urea (we only have 45)
    db.prepare(`
      INSERT INTO inventory_transactions (inventory_item_id, crop_cycle_id, transaction_type, quantity, unit_cost, transaction_date)
      VALUES (1, 1, 'usage', 999.0, 280.0, '2026-03-15')
    `).run();
    console.error('Trigger failed: Overdraw was allowed!');
  } catch (err) {
    console.log('Trigger success! Caught expected DBMS exception:', err.message);
  }
}

test().catch(console.error);

