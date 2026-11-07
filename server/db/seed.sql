-- ==============================================================================
-- FarmLedger Seed Data
-- 2 Years of Chronological Crop Cycles, Transactions, Harvests, and Sales (2024 - 2026)
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
(5, 'Cotton', 'Cash Crop', 'quintals', 'Commercial cash crop requiring regulated irrigation'),
(6, 'Chickpea', 'Legume', 'quintals', 'Deep-rooted cool-season pulse crop');

INSERT INTO crop_varieties (id, crop_id, name, days_to_maturity, expected_yield_per_acre, optimal_season) VALUES
(1, 1, 'HD-2967 Golden', 135, 22.5, 'Rabi'),
(2, 1, 'Sharbati Premium', 125, 19.0, 'Rabi'),
(3, 2, 'JS-335 Early', 100, 11.5, 'Kharif'),
(4, 3, 'Abhinav F1 Hybrid', 90, 320.0, 'Year-Round'),
(5, 3, 'Saaho-3251 Heat-Tolerant', 85, 350.0, 'Summer'),
(6, 4, 'Pioneer P3396', 110, 32.0, 'Kharif'),
(7, 5, 'Bollgard II Hybrid', 160, 14.0, 'Kharif'),
(8, 6, 'JG-11 Desi Pulse', 105, 9.5, 'Rabi');

-- 4. Suppliers
INSERT INTO suppliers (id, name, contact_person, phone, email, address, rating) VALUES
(1, 'AgriCorp Agro Chemicals', 'Ramesh Patil', '+91 98220 11234', 'orders@agricorp.in', 'Plot 44, MIDC Industrial Area, Pune', 4.8),
(2, 'Kisan Bio Seed Labs', 'Anjali Deshmukh', '+91 94231 88765', 'seeds@kisanbio.com', 'Market Yard Gate 3, Nashik', 4.6),
(3, 'GreenEarth Fertilizers Ltd', 'Sanjay Verma', '+91 91580 44321', 'sales@greenearthagro.com', 'Fertilizer Complex, Vadodara', 4.9),
(4, 'Deccan Irrigation & Spares', 'Kavita Rao', '+91 97640 55678', 'supplies@deccanirrigation.com', 'Station Road, Hubballi', 4.3);

-- 5. Inventory Items (Around 10 items, starting at 0 and updated automatically by transactions)
INSERT INTO inventory_items (id, farm_id, name, category, unit, unit_cost, reorder_level, current_stock, supplier_id) VALUES
(1, 1, 'Urea Granular (46% N)', 'Fertiliser', 'bags', 280.00, 20.0, 0.0, 3),
(2, 1, 'DAP Diammonium Phosphate', 'Fertiliser', 'bags', 1350.00, 15.0, 0.0, 3),
(3, 1, 'MOP Muriate of Potash', 'Fertiliser', 'bags', 1650.00, 10.0, 0.0, 3), -- Will result in LOW STOCK (6.0 <= 10.0)
(4, 1, 'Neem Oil Biopesticide 10000 PPM', 'Pesticide', 'liters', 450.00, 10.0, 0.0, 1), -- Will result in OUT OF STOCK (0.0)
(5, 1, 'Chlorantraniliprole 18.5% SC', 'Pesticide', 'bottles', 1850.00, 5.0, 0.0, 1),
(6, 1, 'Trichoderma Viride Bio-Fungicide', 'Pesticide', 'packets', 180.00, 12.0, 0.0, 1),
(7, 1, 'HD-2967 Certified Wheat Seed', 'Seed', 'bags', 950.00, 10.0, 0.0, 2),
(8, 1, 'Abhinav Tomato F1 Hybrid Seed', 'Seed', 'packets', 720.00, 8.0, 0.0, 2),
(9, 1, 'JS-335 Certified Soybean Seed', 'Seed', 'bags', 2400.00, 10.0, 0.0, 2),
(10, 1, 'Drip Irrigation Inline Lateral 16mm', 'Other', 'units', 1200.00, 5.0, 0.0, 4);

-- 6. Crop Cycles (Spanning 2024 to early 2026 across seasons)
-- Note: Cycle 3 has actual yield far below estimate (-23.3%) to test the yield deficit alert!
INSERT INTO crop_cycles (id, plot_id, crop_variety_id, season, sowing_date, expected_harvest_date, actual_harvest_date, estimated_yield, actual_yield, status, notes) VALUES
(1, 1, 3, 'Kharif 2024', '2024-06-20', '2024-09-30', '2024-10-02', 97.75, 102.50, 'Harvested', 'Bumper harvest with optimal monsoon distribution'),
(2, 2, 7, 'Kharif 2024', '2024-06-15', '2024-11-25', '2024-11-28', 168.00, 162.00, 'Harvested', 'Slight pink bollworm incidence managed promptly'),
(3, 3, 6, 'Kharif 2024', '2024-07-01', '2024-10-20', '2024-10-22', 320.00, 245.00, 'Harvested', 'Severe unseasonal waterlogging led to 23.4% deficit below estimate'),
(4, 1, 1, 'Rabi 2024-25', '2024-11-10', '2025-03-25', '2025-03-28', 191.25, 204.00, 'Harvested', 'High grain weight and good milling quality achieved'),
(5, 3, 8, 'Rabi 2024-25', '2024-11-20', '2025-03-10', '2025-03-12', 95.00, 98.00, 'Harvested', 'Excellent nodulation and pod formation'),
(6, 2, 4, 'Summer 2025', '2025-02-15', '2025-05-20', '2025-05-22', 3840.00, 3950.00, 'Harvested', 'Drip fertigation yielded premium table-grade tomatoes'),
(7, 1, 3, 'Kharif 2025', '2025-06-18', '2025-09-28', '2025-10-01', 97.75, 96.00, 'Harvested', 'Steady harvest, consistent oil content'),
(8, 2, 7, 'Kharif 2025', '2025-06-25', '2025-11-30', '2025-12-04', 168.00, 138.00, 'Harvested', 'Late-season whitefly stress caused 17.8% yield loss'),
(9, 3, 6, 'Kharif 2025', '2025-07-05', '2025-10-25', '2025-10-27', 320.00, 335.00, 'Harvested', 'Optimal fertilizer timing resulted in +4.7% surplus yield'),
(10, 1, 1, 'Rabi 2025-26', '2025-11-12', '2026-03-25', '2026-03-29', 191.25, 195.00, 'Harvested', 'Harvest completed ahead of heat wave'),
(11, 2, 4, 'Active Season', date('now', '-20 days'), date('now', '+3 days'), NULL, 3840.00, 0.00, 'Growing', 'Active vegetative stage, upcoming harvest window'),
(12, 3, 8, 'Active Season', date('now', '+1 day'), date('now', '+90 days'), NULL, 95.00, 0.00, 'Planned', 'Sowing scheduled this week; field preparation completed');

-- 7. Inventory Transactions (Purchases, Usages tied to Cycles, Adjustments, Wastage)
INSERT INTO inventory_transactions (id, inventory_item_id, crop_cycle_id, supplier_id, transaction_type, quantity, unit_cost, transaction_date, notes) VALUES
-- 2024 Initial Stock Purchases
(1, 1, NULL, 3, 'purchase', 80.0, 275.00, '2024-05-10', 'Bulk kharif fertilizer procurement'),
(2, 2, NULL, 3, 'purchase', 50.0, 1320.00, '2024-05-10', 'DAP stock for basal dressing'),
(3, 9, NULL, 2, 'purchase', 30.0, 2350.00, '2024-06-01', 'Certified soybean seed bags'),
(4, 5, NULL, 1, 'purchase', 20.0, 1800.00, '2024-06-05', 'Insecticide stock for bollworm control'),
-- Kharif 2024 Usages
(5, 9, 1, NULL, 'usage', 15.0, 2350.00, '2024-06-20', 'Sowing plot P-NORTH-01 with JS-335'),
(6, 1, 1, NULL, 'usage', 10.0, 275.00, '2024-07-05', 'First top dressing nitrogen application'),
(7, 2, 1, NULL, 'usage', 8.0, 1320.00, '2024-06-19', 'Basal application DAP on plot 1'),
(8, 5, 2, NULL, 'usage', 4.0, 1800.00, '2024-08-15', 'Foliar spray for cotton pest protection'),
-- Rabi 2024 Purchases & Usages
(9, 7, NULL, 2, 'purchase', 40.0, 920.00, '2024-10-25', 'Wheat seed procurement for Rabi'),
(10, 7, 4, NULL, 'usage', 18.0, 920.00, '2024-11-10', 'Sowing Wheat on North River Meadow'),
(11, 1, 4, NULL, 'usage', 12.0, 275.00, '2024-12-05', 'First crown-root irrigation top dressing'),
-- 2025 Summer & Kharif Transactions
(12, 8, NULL, 2, 'purchase', 25.0, 700.00, '2025-01-20', 'Tomato hybrid seeds purchase'),
(13, 8, 6, NULL, 'usage', 11.0, 700.00, '2025-02-15', 'Nursery transplanting seeds on plot 2'),
(14, 1, 6, NULL, 'usage', 15.0, 280.00, '2025-03-10', 'Fertigation schedule week 4'),
(15, 3, NULL, 3, 'purchase', 20.0, 1600.00, '2025-04-05', 'Potash procurement for fruit setting'),
(16, 3, 6, NULL, 'usage', 14.0, 1600.00, '2025-04-20', 'Foliar potash application during fruiting'),
(17, 4, NULL, 1, 'purchase', 10.0, 450.00, '2025-05-02', 'Neem oil batch for organic repellent'),
(18, 4, 6, NULL, 'usage', 10.0, 450.00, '2025-05-18', 'Pre-harvest repellent spray - stock depleted to 0'),
-- 2025 Late Season & Wastage/Adjustment
(19, 1, NULL, NULL, 'wastage', 2.0, 280.00, '2025-08-12', 'Bag puncture during monsoon storage'),
(20, 2, 7, NULL, 'usage', 14.0, 1350.00, '2025-06-18', 'Basal DAP application on soybean plot'),
(21, 6, NULL, 1, 'purchase', 25.0, 175.00, '2025-09-10', 'Bio-fungicide preventative supply'),
(22, 6, 10, NULL, 'usage', 7.0, 175.00, '2025-11-12', 'Seed treatment for wheat sowing'),
(23, 1, 10, NULL, 'usage', 10.0, 280.00, '2025-12-01', 'Vegetative growth booster'),
-- 2026 Dynamic Transactions (relative to current date for dynamic evaluation)
(24, 1, NULL, 3, 'purchase', 25.0, 280.00, date('now', 'start of month', '-10 days'), 'Monthly stocking bulk urea delivery'),
(25, 1, 11, NULL, 'usage', 8.0, 280.00, date('now', '-5 days'), 'Transplant booster on tomato plot 2'),
(26, 5, 11, NULL, 'usage', 2.0, 1850.00, date('now', '-3 days'), 'Preventative sucking pest spray'),
(27, 10, NULL, 4, 'purchase', 10.0, 1200.00, date('now', '-1 day'), 'Replacement drip laterals line 4'),
(28, 10, NULL, NULL, 'usage', 2.0, 1200.00, date('now'), 'Fitted to tomato nursery beds');

-- 8. Harvest Records (Linked to Harvested Cycles)
INSERT INTO harvest_records (id, crop_cycle_id, harvest_date, quantity_harvested, unit, quality_grade, storage_location, notes) VALUES
(1, 1, '2024-10-02', 102.50, 'quintals', 'Grade A', 'Warehouse Bay 1', 'Clean, golden beans with 11% moisture'),
(2, 2, '2024-11-28', 162.00, 'quintals', 'Grade A', 'Shed 3 Cotton Bales', 'Long staple fiber quality'),
(3, 3, '2024-10-22', 245.00, 'quintals', 'Grade B', 'Grain Silo 2', 'Lower test weight due to flooding stress'),
(4, 4, '2025-03-28', 204.00, 'quintals', 'Grade A', 'Dry Storage Room A', 'High gluten index wheat lot'),
(5, 5, '2025-03-12', 98.00, 'quintals', 'Grade A', 'Warehouse Bay 2', 'Uniform seed size'),
(6, 6, '2025-05-22', 3950.00, 'crates', 'Grade A', 'Cold Storage Packhouse', 'Firm fruit texture, excellent shelf life'),
(7, 7, '2025-10-01', 96.00, 'quintals', 'Grade A', 'Warehouse Bay 1', 'Standard export grade seed quality'),
(8, 8, '2025-12-04', 138.00, 'quintals', 'Grade B', 'Shed 3 Cotton Bales', 'Color grading impacted by whitefly'),
(9, 9, '2025-10-27', 335.00, 'quintals', 'Grade A', 'Grain Silo 1', 'Heavy ear-heads, minimal cob damage'),
(10, 10, '2026-03-29', 195.00, 'quintals', 'Grade A', 'Dry Storage Room A', 'Clean harvested grain, 10.5% moisture');

-- 9. Sales Records (Tied to Harvests)
INSERT INTO sales_records (id, harvest_id, sale_date, buyer_name, quantity_sold, unit_price, payment_status, notes) VALUES
(1, 1, '2024-10-15', 'Maharashtra Agro Processing Ltd', 100.0, 4850.00, 'Paid', 'Direct mill gate supply at premium price'),
(2, 2, '2024-12-05', 'Vardhman Textiles Consortium', 160.0, 6800.00, 'Paid', 'Full lot purchased for spinning mills'),
(3, 3, '2024-11-01', 'Kisan Starch & Feeds Co', 240.0, 2100.00, 'Paid', 'Sold for poultry feed processing'),
(4, 4, '2025-04-10', 'Patanjali Agro Flour Mills', 200.0, 2650.00, 'Paid', 'Premium whole grain wheat contract'),
(5, 5, '2025-03-25', 'Shree Ganesh Pulse Traders', 95.0, 5600.00, 'Paid', 'Sold at APMC market yard auction'),
(6, 6, '2025-05-25', 'Reliance Fresh Supermarkets', 2500.0, 420.00, 'Paid', 'First pick A-grade lot in refrigerated vans'),
(7, 6, '2025-05-30', 'BigBasket Wholesale Hub', 1400.0, 380.00, 'Paid', 'Second pick crates supply'),
(8, 7, '2025-10-15', 'Maharashtra Agro Processing Ltd', 95.0, 5100.00, 'Paid', 'Second season soybean bulk contract'),
(9, 8, '2025-12-15', 'Coats India Textiles', 135.0, 6400.00, 'Paid', 'B-grade cotton fiber settlement'),
(10, 9, '2025-11-10', 'Godrej Agrovet Animal Feeds', 330.0, 2250.00, 'Paid', 'Bulk maize supply truckload'),
(11, 10, '2026-04-05', 'Patanjali Agro Flour Mills', 190.0, 2750.00, 'Paid', 'Latest wheat batch delivery');
