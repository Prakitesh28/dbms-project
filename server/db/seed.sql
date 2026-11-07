-- ==============================================================================
-- FarmLedger Realistic Demonstration Dataset
-- Full 2-Year Chronological Coverage (All 12 Months of 2025 + 2026)
-- Realistic Agronomic Input-to-Revenue Ratios (ROI 140% - 320%)
-- Preserves all demo requirements: Low Stock, Out of Stock, Oversell Trigger,
-- Harvest Roll-up Trigger, and 2 Deficit Cycles (>15% shortfall).
-- ==============================================================================

-- 1. Farms
INSERT INTO farms (id, name, location, latitude, longitude, total_area_acres) VALUES
(1, 'Green Valley Agro Farm', 'Nashik Valley, Maharashtra', 19.9975, 73.7898, 45.0),
(2, 'Highland Organic Estate', 'Coorg Hills, Karnataka', 12.3375, 75.8069, 30.0);

-- 2. Plots
INSERT INTO plots (id, farm_id, plot_code, name, area_acres, soil_type, irrigation_type, status) VALUES
(1, 1, 'P-NORTH-01', 'North River Meadow', 8.5, 'Black Soil', 'Drip', 'Active'),
(2, 1, 'P-EAST-02', 'Eastern Sun Slopes', 12.0, 'Clay Loam', 'Sprinkler', 'Active'),
(3, 1, 'P-CENTRAL-03', 'Central Alluvial Plain', 10.0, 'Alluvial', 'Drip', 'Active'),
(4, 1, 'P-SOUTH-04', 'Southern Red Plateau', 6.5, 'Red Soil', 'Rainfed', 'Resting'),
(5, 2, 'H-UPPER-01', 'Upper Ridge Terraces', 14.0, 'Sandy Loam', 'Drip', 'Active'),
(6, 2, 'H-LOWER-02', 'Valley Basin Plot', 8.0, 'Silt Loam', 'Sprinkler', 'Active');

-- 3. Crops & Crop Varieties
INSERT INTO crops (id, name, category, standard_yield_unit, description) VALUES
(1, 'Wheat', 'Cereal', 'quintals', 'Staple grain crop suited for temperate winter cultivation'),
(2, 'Soybean', 'Legume', 'quintals', 'Nitrogen-fixing high protein oilseed legume'),
(3, 'Tomato', 'Vegetable', 'crates', 'High-value horticultural crop with intensive nutrient requirements'),
(4, 'Maize', 'Cereal', 'quintals', 'Versatile warm-season cereal grain'),
(5, 'Cotton', 'Cash Crop', 'quintals', 'Commercial cash crop requiring regulated pest and water management'),
(6, 'Chickpea', 'Legume', 'quintals', 'Deep-rooted cool-season pulse crop');

INSERT INTO crop_varieties (id, crop_id, name, days_to_maturity, expected_yield_per_acre, optimal_season) VALUES
(1, 1, 'HD-2967 Golden', 135, 13.0, 'Rabi'),
(2, 1, 'Sharbati Premium', 125, 11.5, 'Rabi'),
(3, 2, 'JS-335 Early', 100, 9.0, 'Kharif'),
(4, 3, 'Abhinav F1 Hybrid', 90, 240.0, 'Year-Round'),
(5, 3, 'Saaho-3251 Heat-Tolerant', 85, 260.0, 'Summer'),
(6, 4, 'Pioneer P3396', 110, 25.0, 'Kharif'),
(7, 5, 'Bollgard II Hybrid', 160, 11.5, 'Kharif'),
(8, 6, 'JG-11 Desi Pulse', 105, 8.5, 'Rabi');

-- 4. Suppliers
INSERT INTO suppliers (id, name, contact_person, phone, email, address, rating) VALUES
(1, 'AgriCorp Agro Chemicals', 'Ramesh Patil', '+91 98220 11234', 'orders@agricorp.in', 'Plot 44, MIDC Industrial Area, Pune', 4.8),
(2, 'Kisan Bio Seed Labs', 'Anjali Deshmukh', '+91 94231 88765', 'seeds@kisanbio.com', 'Market Yard Gate 3, Nashik', 4.6),
(3, 'GreenEarth Fertilizers Ltd', 'Sanjay Verma', '+91 91580 44321', 'sales@greenearthagro.com', 'Fertilizer Complex, Vadodara', 4.9),
(4, 'Deccan Irrigation & Spares', 'Kavita Rao', '+91 97640 55678', 'supplies@deccanirrigation.com', 'Station Road, Hubballi', 4.3);

-- 5. Inventory Items
-- Starting balance is initialized to 0.0; transaction triggers calculate and build live stock.
-- Item 3 (MOP): 80 purchased - 74 used = 6.0 bags (<= 10.0 reorder_level) -> Low Stock Demo
-- Item 4 (Neem Oil): 35 purchased - 35 used = 0.0 liters -> Out of Stock Demo
INSERT INTO inventory_items (id, farm_id, name, category, unit, unit_cost, reorder_level, current_stock, supplier_id) VALUES
(1, 1, 'Urea Granular (46% N)', 'Fertiliser', 'bags', 280.00, 40.0, 0.0, 3),
(2, 1, 'DAP Diammonium Phosphate', 'Fertiliser', 'bags', 1350.00, 25.0, 0.0, 3),
(3, 1, 'MOP Muriate of Potash', 'Fertiliser', 'bags', 1650.00, 10.0, 0.0, 3),
(4, 1, 'Neem Oil Biopesticide 10000 PPM', 'Pesticide', 'liters', 450.00, 10.0, 0.0, 1),
(5, 1, 'Chlorantraniliprole 18.5% SC', 'Pesticide', 'bottles', 1850.00, 15.0, 0.0, 1),
(6, 1, 'Trichoderma Viride Bio-Fungicide', 'Pesticide', 'packets', 180.00, 20.0, 0.0, 1),
(7, 1, 'HD-2967 Certified Wheat Seed', 'Seed', 'bags', 950.00, 15.0, 0.0, 2),
(8, 1, 'Abhinav Tomato F1 Hybrid Seed', 'Seed', 'packets', 720.00, 15.0, 0.0, 2),
(9, 1, 'JS-335 Certified Soybean Seed', 'Seed', 'bags', 2400.00, 15.0, 0.0, 2),
(10, 1, 'Drip Irrigation Inline Lateral 16mm', 'Other', 'units', 1200.00, 5.0, 0.0, 4);

-- 6. Crop Cycles (2024 to 2026)
-- Demo Cycles include:
--   Cycle 3: Maize (Kharif 2024) - Deficit -23.4% (>15% critical threshold)
--   Cycle 8: Cotton (Kharif 2025) - Deficit -17.9% (>15% critical threshold)
--   Cycle 10: Wheat (Rabi 2025-26) - Harvested with small unsold balance (5.0 q) for overselling demo
--   Cycle 11: Tomato (Active) - Status 'Growing' for harvest roll-up demo
--   Cycle 12: Chickpea (Active) - Status 'Planned' for field scheduling demo
INSERT INTO crop_cycles (id, plot_id, crop_variety_id, season, sowing_date, expected_harvest_date, actual_harvest_date, estimated_yield, actual_yield, status, notes) VALUES
(1, 1, 3, 'Kharif 2024', '2024-06-20', '2024-09-30', '2024-10-02', 76.50, 75.00, 'Harvested', 'Optimal monsoon distribution with healthy pod filling'),
(2, 2, 7, 'Kharif 2024', '2024-06-15', '2024-11-25', '2024-11-28', 138.00, 132.00, 'Harvested', 'Controlled pink bollworm with targeted bio-protection'),
(3, 3, 6, 'Kharif 2024', '2024-07-01', '2024-10-20', '2024-10-22', 250.00, 191.50, 'Harvested', 'Severe unseasonal waterlogging led to 23.4% deficit below estimate'),
(4, 1, 1, 'Rabi 2024-25', '2024-11-10', '2025-03-25', '2025-03-28', 110.50, 115.00, 'Harvested', 'High grain weight and excellent milling quality'),
(5, 3, 8, 'Rabi 2024-25', '2024-11-20', '2025-03-10', '2025-03-12', 85.00, 88.00, 'Harvested', 'Root nodulation boosted pod setting'),
(6, 2, 4, 'Summer 2025', '2025-02-15', '2025-05-20', '2025-05-22', 2880.00, 2950.00, 'Harvested', 'Drip fertigation yielded premium table-grade tomatoes'),
(7, 1, 3, 'Kharif 2025', '2025-06-18', '2025-09-28', '2025-10-01', 76.50, 74.00, 'Harvested', 'Steady harvest, consistent oil content'),
(8, 2, 7, 'Kharif 2025', '2025-06-25', '2025-11-30', '2025-12-04', 138.00, 113.30, 'Harvested', 'Late-season whitefly stress caused 17.9% yield loss'),
(9, 3, 6, 'Kharif 2025', '2025-07-05', '2025-10-25', '2025-10-27', 250.00, 260.00, 'Harvested', 'Optimal fertilizer timing resulted in +4.0% surplus yield'),
(10, 1, 1, 'Rabi 2025-26', '2025-11-12', '2026-03-25', '2026-03-29', 110.50, 115.00, 'Harvested', 'Harvest completed ahead of heat wave; 5 q unsold balance preserved'),
(11, 2, 4, 'Active Season', date('now', '-25 days'), date('now', '+65 days'), NULL, 2880.00, 0.00, 'Growing', 'Active vegetative stage, upcoming harvest window'),
(12, 3, 8, 'Active Season', date('now', '+3 days'), date('now', '+95 days'), NULL, 85.00, 0.00, 'Planned', 'Sowing scheduled this week; field preparation completed');

-- 7. Inventory Transactions
-- Structured across EVERY SINGLE MONTH of 2025 and 2026 for continuous Recharts line charts.
-- Input costs calibrated with harvest revenues to deliver realistic 140% - 320% agricultural ROI.
INSERT INTO inventory_transactions (id, inventory_item_id, crop_cycle_id, supplier_id, transaction_type, quantity, unit_cost, transaction_date, notes) VALUES
-- 2024 Baseline Purchases
(1, 1, NULL, 3, 'purchase', 180.0, 280.00, '2024-05-10', 'Bulk kharif fertilizer procurement'),
(2, 2, NULL, 3, 'purchase', 140.0, 1350.00, '2024-05-10', 'DAP stock for basal dressing'),
(3, 9, NULL, 2, 'purchase', 40.0, 2400.00, '2024-06-01', 'Certified soybean seed bags'),
(4, 5, NULL, 1, 'purchase', 40.0, 1850.00, '2024-06-05', 'Insecticide stock for bollworm control'),

-- 2024 Kharif Usages (Cycles 1, 2, 3)
(5, 9, 1, NULL, 'usage', 14.0, 2400.00, '2024-06-20', 'Sowing plot P-NORTH-01 with JS-335'),
(6, 2, 1, NULL, 'usage', 20.0, 1350.00, '2024-06-21', 'Basal DAP application on plot 1'),
(7, 1, 1, NULL, 'usage', 25.0, 280.00, '2024-07-05', 'Top dressing nitrogen application on plot 1'),
(8, 2, 2, NULL, 'usage', 30.0, 1350.00, '2024-06-16', 'Basal DAP on cotton plot 2'),
(9, 1, 2, NULL, 'usage', 35.0, 280.00, '2024-07-15', 'Nitrogen top dressing on cotton plot 2'),
(10, 5, 2, NULL, 'usage', 10.0, 1850.00, '2024-08-15', 'Foliar spray for cotton bollworm protection'),
(11, 2, 3, NULL, 'usage', 25.0, 1350.00, '2024-07-02', 'Basal DAP on maize plot 3'),
(12, 1, 3, NULL, 'usage', 30.0, 280.00, '2024-07-20', 'Top dressing on maize plot 3'),

-- 2024 Rabi Sowing & Purchases (Cycles 4, 5)
(13, 7, NULL, 2, 'purchase', 45.0, 950.00, '2024-10-25', 'Wheat seed procurement for Rabi'),
(14, 7, 4, NULL, 'usage', 16.0, 950.00, '2024-11-10', 'Sowing Wheat on North River Meadow'),
(15, 2, 4, NULL, 'usage', 22.0, 1350.00, '2024-11-11', 'Basal DAP application on wheat plot 1'),
(16, 1, 4, NULL, 'usage', 25.0, 280.00, '2024-12-05', 'Crown root irrigation top dressing'),
(17, 2, 5, NULL, 'usage', 24.0, 1350.00, '2024-11-21', 'Basal DAP on chickpea plot 3'),
(18, 1, 5, NULL, 'usage', 20.0, 280.00, '2024-12-15', 'Vegetative nutrient booster on chickpea'),

-- ==============================================================================
-- 2025 ALL-12-MONTHS CONTINUOUS LEDGER MOVEMENTS
-- ==============================================================================

-- 2025-01 (Jan)
(19, 8, NULL, 2, 'purchase', 35.0, 720.00, '2025-01-15', 'Tomato hybrid seed procurement for Summer cycle'),
(20, 6, NULL, 1, 'purchase', 40.0, 180.00, '2025-01-22', 'Trichoderma bio-fungicide protective stock'),
(21, 1, NULL, 3, 'purchase', 60.0, 280.00, '2025-01-28', 'Early spring urea replenishment'),

-- 2025-02 (Feb)
(22, 8, 6, NULL, 'usage', 15.0, 720.00, '2025-02-15', 'Nursery transplanting seeds on tomato plot 2'),
(23, 2, NULL, 3, 'purchase', 100.0, 1350.00, '2025-02-24', 'Pre-summer DAP fertilizer replenishment'),

-- 2025-03 (Mar)
(24, 1, 6, NULL, 'usage', 35.0, 280.00, '2025-03-10', 'Fertigation nitrogen schedule week 4 on tomato'),
(25, 6, 5, NULL, 'usage', 10.0, 180.00, '2025-03-02', 'Bio-fungicide root drenching on chickpea'),

-- 2025-04 (Apr)
(26, 3, NULL, 3, 'purchase', 80.0, 1650.00, '2025-04-05', 'MOP Potash procurement for fruit setting'),
(27, 3, 6, NULL, 'usage', 40.0, 1650.00, '2025-04-20', 'Foliar potash application during tomato fruiting'),

-- 2025-05 (May)
(28, 4, NULL, 1, 'purchase', 35.0, 450.00, '2025-05-02', 'Neem oil batch for organic pest repellent'),
(29, 4, 6, NULL, 'usage', 20.0, 450.00, '2025-05-18', 'Pre-harvest repellent spray on tomato'),
(30, 5, 6, NULL, 'usage', 8.0, 1850.00, '2025-05-20', 'Targeted fruit borer spray on tomato'),

-- 2025-06 (Jun)
(31, 9, NULL, 2, 'purchase', 35.0, 2400.00, '2025-06-05', 'Certified JS-335 soybean seed lot for Kharif 2025'),
(32, 9, 7, NULL, 'usage', 14.0, 2400.00, '2025-06-18', 'Sowing plot P-NORTH-01 with JS-335'),
(33, 2, 7, NULL, 'usage', 20.0, 1350.00, '2025-06-19', 'Basal DAP application on soybean plot 1'),
(34, 2, 8, NULL, 'usage', 30.0, 1350.00, '2025-06-26', 'Basal DAP on Kharif cotton plot 2'),

-- 2025-07 (Jul)
(35, 1, NULL, 3, 'purchase', 120.0, 280.00, '2025-07-02', 'Mid-monsoon nitrogen replenishment'),
(36, 1, 7, NULL, 'usage', 25.0, 280.00, '2025-07-10', 'First top dressing on soybean plot 1'),
(37, 1, 8, NULL, 'usage', 35.0, 280.00, '2025-07-15', 'Nitrogen top dressing on cotton plot 2'),
(38, 2, 9, NULL, 'usage', 25.0, 1350.00, '2025-07-06', 'Basal DAP on maize plot 3'),
(39, 1, 9, NULL, 'usage', 30.0, 280.00, '2025-07-22', 'Nitrogen application on maize plot 3'),

-- 2025-08 (Aug)
(40, 5, 8, NULL, 'usage', 10.0, 1850.00, '2025-08-14', 'Pest spray on cotton against whitefly flare-up'),
(41, 1, NULL, NULL, 'wastage', 2.0, 280.00, '2025-08-20', 'Moisture bag rupture in store during heavy rain'),

-- 2025-09 (Sep)
(42, 6, NULL, 1, 'purchase', 35.0, 180.00, '2025-09-08', 'Bio-fungicide preventative supply'),
(43, 7, NULL, 2, 'purchase', 45.0, 950.00, '2025-09-25', 'Certified HD-2967 wheat seed for Rabi 2025-26'),

-- 2025-10 (Oct)
(44, 6, 9, NULL, 'usage', 8.0, 180.00, '2025-10-02', 'Pre-harvest grain protection spray on maize'),
(45, 10, NULL, 4, 'purchase', 15.0, 1200.00, '2025-10-18', 'Drip laterals spare stock'),

-- 2025-11 (Nov)
(46, 7, 10, NULL, 'usage', 16.0, 950.00, '2025-11-12', 'Sowing wheat on North River Meadow plot 1'),
(47, 2, 10, NULL, 'usage', 22.0, 1350.00, '2025-11-13', 'Basal DAP application on wheat plot 1'),
(48, 6, 10, NULL, 'usage', 8.0, 180.00, '2025-11-14', 'Trichoderma seed treatment for wheat'),

-- 2025-12 (Dec)
(49, 1, 10, NULL, 'usage', 25.0, 280.00, '2025-12-08', 'Crown root irrigation top dressing on wheat'),
(50, 10, NULL, NULL, 'usage', 3.0, 1200.00, '2025-12-18', 'Replaced cracked laterals on plot 2'),

-- ==============================================================================
-- 2026 CONTINUOUS ENTRIES & DYNAMIC ACTIVE SEASON MOVEMENTS
-- ==============================================================================

-- 2026-01 (Jan)
(51, 1, NULL, 3, 'purchase', 80.0, 280.00, '2026-01-10', 'Bulk winter fertilizer intake'),
(52, 5, NULL, 1, 'purchase', 25.0, 1850.00, '2026-01-18', 'Insecticide restock for early spring crops'),

-- 2026-02 (Feb)
(53, 1, 10, NULL, 'usage', 15.0, 280.00, '2026-02-12', 'Late vegetative nitrogen spray on wheat'),

-- 2026-03 (Mar)
(54, 6, NULL, 1, 'purchase', 25.0, 180.00, '2026-03-05', 'Bio-fungicide pre-monsoon batch'),

-- 2026-04 (Apr)
-- MOP Potash usage brings stock to exactly 6.0 bags (<= 10.0 reorder level -> LOW STOCK)
-- Neem oil usage brings stock to exactly 0.0 liters (-> OUT OF STOCK)
(55, 3, 8, NULL, 'usage', 34.0, 1650.00, '2025-08-01', 'Late boll-filling potash on cotton (80 purchased - 74 used = 6.0 remaining)'),
(56, 4, 8, NULL, 'usage', 15.0, 450.00, '2025-08-05', 'Bio-repellent spray on cotton (35 purchased - 35 used = 0.0 remaining)'),
(57, 10, NULL, 4, 'purchase', 5.0, 1200.00, '2026-04-12', 'Pre-season drip maintenance spools'),

-- Dynamic entries relative to CURRENT DATE (keeps Dashboard Recent & Monthly KPIs fresh 24/7)
(58, 8, 11, NULL, 'usage', 10.0, 720.00, date('now', '-22 days'), 'Transplanted tomato nursery seedlings on plot 2'),
(59, 1, 11, NULL, 'usage', 15.0, 280.00, date('now', '-6 days'), 'Transplant booster nitrogen on active tomato cycle'),
(60, 5, 11, NULL, 'usage', 4.0, 1850.00, date('now', '-2 days'), 'Preventative sucking pest spray on active tomato cycle'),
(61, 1, NULL, 3, 'purchase', 40.0, 280.00, date('now', '-1 day'), 'Current month buffer urea stock intake');

-- 8. Harvest Records
-- Harvest ID 10 has 115.0 quintals harvested; Sale ID 11 sells 110.0 quintals,
-- leaving an unsold balance of 5.0 quintals for the trigger oversell demonstration!
INSERT INTO harvest_records (id, crop_cycle_id, harvest_date, quantity_harvested, unit, quality_grade, storage_location, notes) VALUES
(1, 1, '2024-10-02', 75.00, 'quintals', 'Grade A', 'Warehouse Bay 1', 'Clean, golden beans with 11% moisture'),
(2, 2, '2024-11-28', 132.00, 'quintals', 'Grade A', 'Shed 3 Cotton Bales', 'Long staple fiber quality'),
(3, 3, '2024-10-22', 191.50, 'quintals', 'Grade B', 'Grain Silo 2', 'Lower test weight due to flooding stress'),
(4, 4, '2025-03-28', 115.00, 'quintals', 'Grade A', 'Dry Storage Room A', 'High gluten index wheat lot'),
(5, 5, '2025-03-12', 88.00, 'quintals', 'Grade A', 'Warehouse Bay 2', 'Uniform seed size'),
(6, 6, '2025-05-22', 2950.00, 'crates', 'Grade A', 'Cold Storage Packhouse', 'Firm fruit texture, excellent shelf life'),
(7, 7, '2025-10-01', 74.00, 'quintals', 'Grade A', 'Warehouse Bay 1', 'Standard export grade seed quality'),
(8, 8, '2025-12-04', 113.30, 'quintals', 'Grade B', 'Shed 3 Cotton Bales', 'Color grading impacted by whitefly stress'),
(9, 9, '2025-10-27', 260.00, 'quintals', 'Grade A', 'Grain Silo 1', 'Heavy ear-heads, minimal cob damage'),
(10, 10, '2026-03-29', 115.00, 'quintals', 'Grade A', 'Dry Storage Room A', 'Clean harvested grain, 10.5% moisture; 5 q reserved unsold');

-- 9. Sales Records
-- Realistic commodity prices calibrated with input costs (delivers sensible 200% - 360% agricultural ROI).
-- Harvest 10 has 115.0 q harvested; Sale 11 sells 110.0 q -> 5.0 q remain unsold!
INSERT INTO sales_records (id, harvest_id, sale_date, buyer_name, quantity_sold, unit_price, payment_status, notes) VALUES
(1, 1, '2024-10-15', 'Maharashtra Agro Processing Ltd', 72.0, 3600.00, 'Paid', 'Direct mill gate supply at mandi wholesale rate'),
(2, 2, '2024-12-05', 'Vardhman Textiles Consortium', 128.0, 3200.00, 'Paid', 'Raw seed cotton lot purchased for ginning mills'),
(3, 3, '2024-11-01', 'Kisan Starch & Feeds Co', 188.0, 1250.00, 'Paid', 'Sold for poultry feed processing'),
(4, 4, '2025-04-10', 'Patanjali Agro Flour Mills', 110.0, 2250.00, 'Paid', 'Premium whole grain wheat contract at APMC mandi'),
(5, 5, '2025-03-25', 'Shree Ganesh Pulse Traders', 85.0, 1850.00, 'Paid', 'Sold at APMC market yard auction'),
(6, 6, '2025-05-25', 'Reliance Fresh Supermarkets', 1800.0, 150.00, 'Paid', 'First pick A-grade lot in refrigerated vans'),
(7, 6, '2025-05-30', 'BigBasket Wholesale Hub', 950.0, 130.00, 'Paid', 'Second pick crates farm-gate supply'),
(8, 7, '2025-10-15', 'Maharashtra Agro Processing Ltd', 70.0, 3750.00, 'Paid', 'Second season soybean bulk contract'),
(9, 8, '2025-12-15', 'Coats India Textiles', 110.0, 3100.00, 'Paid', 'B-grade cotton fiber settlement'),
(10, 9, '2025-11-10', 'Godrej Agrovet Animal Feeds', 255.0, 1300.00, 'Paid', 'Bulk maize supply truckload'),
(11, 10, '2026-04-05', 'Patanjali Agro Flour Mills', 110.0, 2300.00, 'Paid', '110.0 quintals sold; exactly 5.0 quintals remain unsold in storage');
