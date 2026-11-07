-- ==============================================================================
-- FarmLedger: Farmer Crop Planning & Agricultural Inventory System
-- Normalized Relational Database Schema (3NF Compliance)
-- Engine: SQLite 3 / Portable SQL (PostgreSQL & MySQL Compatible Syntax)
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------------------------
-- 1. Farms Entity
-- Represents operational farm units owned or managed by the farmer
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS farms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    total_area_acres REAL NOT NULL CHECK (total_area_acres > 0),
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- ------------------------------------------------------------------------------
-- 2. Plots Entity (Weak entity dependent on Farm)
-- Subdivisions of a farm with specific soil and micro-climatic properties
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    plot_code TEXT NOT NULL,
    name TEXT NOT NULL,
    area_acres REAL NOT NULL CHECK (area_acres > 0),
    soil_type TEXT NOT NULL CHECK (soil_type IN ('Clay', 'Sandy Loam', 'Silt Loam', 'Clay Loam', 'Sandy', 'Black Soil', 'Red Soil', 'Alluvial')),
    irrigation_type TEXT NOT NULL CHECK (irrigation_type IN ('Drip', 'Sprinkler', 'Flood', 'Rainfed')),
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Fallow', 'Resting', 'Maintenance')),
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    UNIQUE (farm_id, plot_code)
);

-- ------------------------------------------------------------------------------
-- 3. Crops & Crop Varieties (2NF / 3NF Normalization)
-- Separates crop genus/species from cultivar characteristics
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN ('Cereal', 'Legume', 'Vegetable', 'Fruit', 'Oilseed', 'Cash Crop')),
    standard_yield_unit TEXT NOT NULL DEFAULT 'kg' CHECK (standard_yield_unit IN ('kg', 'tons', 'bushels', 'quintals', 'crates')),
    description TEXT
);

CREATE TABLE IF NOT EXISTS crop_varieties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_id INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    days_to_maturity INTEGER NOT NULL CHECK (days_to_maturity > 0),
    expected_yield_per_acre REAL NOT NULL CHECK (expected_yield_per_acre >= 0),
    optimal_season TEXT NOT NULL CHECK (optimal_season IN ('Kharif', 'Rabi', 'Zaid', 'Spring', 'Summer', 'Autumn', 'Winter', 'Year-Round')),
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    UNIQUE (crop_id, name)
);

-- ------------------------------------------------------------------------------
-- 4. Suppliers Entity
-- Agricultural input vendors and seed distributors
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    rating REAL CHECK (rating IS NULL OR (rating >= 1.0 AND rating <= 5.0)),
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- ------------------------------------------------------------------------------
-- 5. Crop Cycles Entity
-- Tracks lifecycle of a crop variety cultivated on a specific plot
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crop_cycles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plot_id INTEGER NOT NULL REFERENCES plots(id) ON DELETE RESTRICT,
    crop_variety_id INTEGER NOT NULL REFERENCES crop_varieties(id) ON DELETE RESTRICT,
    season TEXT NOT NULL,
    sowing_date TEXT NOT NULL,
    expected_harvest_date TEXT NOT NULL,
    actual_harvest_date TEXT,
    estimated_yield REAL NOT NULL CHECK (estimated_yield >= 0),
    actual_yield REAL DEFAULT 0.0 CHECK (actual_yield IS NULL OR actual_yield >= 0),
    status TEXT NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'Sown', 'Growing', 'Harvested', 'Terminated', 'Archived')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CHECK (expected_harvest_date >= sowing_date),
    CHECK (actual_harvest_date IS NULL OR actual_harvest_date >= sowing_date)
);

-- ------------------------------------------------------------------------------
-- 6. Inventory Items Entity
-- Seeds, fertilisers, pesticides, and other farming inputs
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Seed', 'Fertiliser', 'Pesticide', 'Other')),
    unit TEXT NOT NULL CHECK (unit IN ('kg', 'liters', 'bags', 'packets', 'bottles', 'grams', 'units')),
    unit_cost REAL NOT NULL CHECK (unit_cost >= 0),
    reorder_level REAL NOT NULL DEFAULT 10.0 CHECK (reorder_level >= 0),
    current_stock REAL NOT NULL DEFAULT 0.0 CHECK (current_stock >= 0),
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    UNIQUE (farm_id, name)
);

-- ------------------------------------------------------------------------------
-- 7. Inventory Transactions Entity (Append-Only Ledger)
-- Immutable audit log recording every inventory movement
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    crop_cycle_id INTEGER REFERENCES crop_cycles(id) ON DELETE SET NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'adjustment', 'wastage')),
    quantity REAL NOT NULL CHECK (quantity > 0),
    unit_cost REAL NOT NULL CHECK (unit_cost >= 0),
    total_cost REAL GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    transaction_date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- ------------------------------------------------------------------------------
-- 8. Harvest Records Entity
-- Quantities gathered at harvest time per crop cycle
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS harvest_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_cycle_id INTEGER NOT NULL REFERENCES crop_cycles(id) ON DELETE CASCADE,
    harvest_date TEXT NOT NULL,
    quantity_harvested REAL NOT NULL CHECK (quantity_harvested > 0),
    unit TEXT NOT NULL DEFAULT 'kg',
    quality_grade TEXT NOT NULL DEFAULT 'Grade A' CHECK (quality_grade IN ('Grade A', 'Grade B', 'Grade C', 'Reject')),
    storage_location TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- ------------------------------------------------------------------------------
-- 9. Sales Records Entity
-- Produce sold from recorded harvests
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    harvest_id INTEGER NOT NULL REFERENCES harvest_records(id) ON DELETE RESTRICT,
    sale_date TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    quantity_sold REAL NOT NULL CHECK (quantity_sold > 0),
    unit_price REAL NOT NULL CHECK (unit_price >= 0),
    total_amount REAL GENERATED ALWAYS AS (quantity_sold * unit_price) STORED,
    payment_status TEXT NOT NULL DEFAULT 'Paid' CHECK (payment_status IN ('Paid', 'Pending', 'Partial', 'Overdue')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- ==============================================================================
-- INDEXES FOR QUERY OPTIMIZATION
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_plots_farm_id ON plots(farm_id);
CREATE INDEX IF NOT EXISTS idx_crop_cycles_plot_id ON crop_cycles(plot_id);
CREATE INDEX IF NOT EXISTS idx_crop_cycles_sowing_date ON crop_cycles(sowing_date);
CREATE INDEX IF NOT EXISTS idx_crop_cycles_expected_harvest_date ON crop_cycles(expected_harvest_date);
CREATE INDEX IF NOT EXISTS idx_crop_cycles_status ON crop_cycles(status);
CREATE INDEX IF NOT EXISTS idx_crop_varieties_crop_id ON crop_varieties(crop_id);
CREATE INDEX IF NOT EXISTS idx_inv_items_farm_id ON inventory_items(farm_id);
CREATE INDEX IF NOT EXISTS idx_inv_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inv_trans_item_id ON inventory_transactions(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inv_trans_date ON inventory_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_inv_trans_cycle_id ON inventory_transactions(crop_cycle_id);
CREATE INDEX IF NOT EXISTS idx_inv_trans_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_harvest_cycle_id ON harvest_records(crop_cycle_id);
CREATE INDEX IF NOT EXISTS idx_harvest_date ON harvest_records(harvest_date);
CREATE INDEX IF NOT EXISTS idx_sales_harvest_id ON sales_records(harvest_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_records(sale_date);

-- ==============================================================================
-- TRIGGERS: INTEGRITY ENFORCEMENT & AUTOMATED LEDGER UPDATES
-- ==============================================================================

-- Trigger 1: Guard against inventory underflow before insertion
CREATE TRIGGER IF NOT EXISTS trg_prevent_negative_inventory
BEFORE INSERT ON inventory_transactions
FOR EACH ROW
WHEN NEW.transaction_type IN ('usage', 'wastage')
BEGIN
    SELECT CASE
        WHEN (SELECT current_stock FROM inventory_items WHERE id = NEW.inventory_item_id) < NEW.quantity
        THEN RAISE(ABORT, 'DBMS Constraint Violation: Insufficient stock. Requested quantity exceeds available inventory.')
    END;
END;

-- Trigger 2: Automatically update current stock upon inserting a transaction
CREATE TRIGGER IF NOT EXISTS trg_update_inventory_stock_after_insert
AFTER INSERT ON inventory_transactions
FOR EACH ROW
BEGIN
    UPDATE inventory_items
    SET current_stock = CASE
        WHEN NEW.transaction_type = 'purchase' THEN current_stock + NEW.quantity
        WHEN NEW.transaction_type IN ('usage', 'wastage') THEN current_stock - NEW.quantity
        WHEN NEW.transaction_type = 'adjustment' THEN current_stock + NEW.quantity
        ELSE current_stock
    END,
    unit_cost = CASE
        WHEN NEW.transaction_type = 'purchase' THEN NEW.unit_cost
        ELSE unit_cost
    END
    WHERE id = NEW.inventory_item_id;
END;

-- Trigger 3: Prevent overselling of harvested quantity
CREATE TRIGGER IF NOT EXISTS trg_prevent_overselling_harvest
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
END;

-- Trigger 4: Roll up actual yield to crop_cycles when a harvest is recorded
CREATE TRIGGER IF NOT EXISTS trg_update_crop_cycle_actual_yield_insert
AFTER INSERT ON harvest_records
FOR EACH ROW
BEGIN
    UPDATE crop_cycles
    SET actual_yield = (
        SELECT COALESCE(SUM(quantity_harvested), 0)
        FROM harvest_records
        WHERE crop_cycle_id = NEW.crop_cycle_id
    ),
    actual_harvest_date = CASE
        WHEN actual_harvest_date IS NULL OR NEW.harvest_date > actual_harvest_date THEN NEW.harvest_date
        ELSE actual_harvest_date
    END,
    status = CASE
        WHEN status IN ('Planned', 'Sown', 'Growing') THEN 'Harvested'
        ELSE status
    END
    WHERE id = NEW.crop_cycle_id;
END;

-- Trigger 5: Roll up actual yield to crop_cycles when a harvest is updated
CREATE TRIGGER IF NOT EXISTS trg_update_crop_cycle_actual_yield_update
AFTER UPDATE ON harvest_records
FOR EACH ROW
BEGIN
    UPDATE crop_cycles
    SET actual_yield = (
        SELECT COALESCE(SUM(quantity_harvested), 0)
        FROM harvest_records
        WHERE crop_cycle_id = NEW.crop_cycle_id
    )
    WHERE id = NEW.crop_cycle_id;

    -- Also update old crop cycle if ID changed
    UPDATE crop_cycles
    SET actual_yield = (
        SELECT COALESCE(SUM(quantity_harvested), 0)
        FROM harvest_records
        WHERE crop_cycle_id = OLD.crop_cycle_id
    )
    WHERE id = OLD.crop_cycle_id AND OLD.crop_cycle_id <> NEW.crop_cycle_id;
END;

-- Trigger 6: Roll up actual yield to crop_cycles when a harvest is deleted
CREATE TRIGGER IF NOT EXISTS trg_update_crop_cycle_actual_yield_delete
AFTER DELETE ON harvest_records
FOR EACH ROW
BEGIN
    UPDATE crop_cycles
    SET actual_yield = (
        SELECT COALESCE(SUM(quantity_harvested), 0)
        FROM harvest_records
        WHERE crop_cycle_id = OLD.crop_cycle_id
    )
    WHERE id = OLD.crop_cycle_id;
END;

-- ==============================================================================
-- SQL VIEWS: ANALYTICAL & OPERATIONAL ABSTRACTIONS
-- ==============================================================================

-- View 1: Current Stock Levels with computed valuations and health status
CREATE VIEW IF NOT EXISTS v_current_stock_levels AS
SELECT
    i.id AS item_id,
    i.farm_id,
    f.name AS farm_name,
    i.name AS item_name,
    i.category,
    i.unit,
    i.unit_cost,
    i.current_stock,
    ROUND(i.current_stock * i.unit_cost, 2) AS total_valuation,
    i.reorder_level,
    s.name AS supplier_name,
    s.phone AS supplier_phone,
    CASE
        WHEN i.current_stock <= 0 THEN 'Out of Stock'
        WHEN i.current_stock <= i.reorder_level THEN 'Low Stock'
        ELSE 'In Stock'
    END AS stock_status,
    i.created_at
FROM inventory_items i
JOIN farms f ON i.farm_id = f.id
LEFT JOIN suppliers s ON i.supplier_id = s.id;

-- View 2: Low Stock Items (Threshold: current_stock <= 10 or current_stock <= reorder_level)
CREATE VIEW IF NOT EXISTS v_low_stock_items AS
SELECT
    item_id,
    farm_id,
    farm_name,
    item_name,
    category,
    unit,
    unit_cost,
    current_stock,
    reorder_level,
    supplier_name,
    supplier_phone,
    total_valuation
FROM v_current_stock_levels
WHERE current_stock > 0 AND (current_stock <= 10.0 OR current_stock <= reorder_level);

-- View 3: Out of Stock Items (Zero units available)
CREATE VIEW IF NOT EXISTS v_out_of_stock_items AS
SELECT
    item_id,
    farm_id,
    farm_name,
    item_name,
    category,
    unit,
    unit_cost,
    current_stock,
    reorder_level,
    supplier_name,
    supplier_phone,
    total_valuation
FROM v_current_stock_levels
WHERE current_stock <= 0;

-- View 4: Monthly Inventory Value & Movement Trends
CREATE VIEW IF NOT EXISTS v_monthly_inventory_value AS
SELECT
    strftime('%Y-%m', t.transaction_date) AS month_year,
    COUNT(t.id) AS transaction_count,
    ROUND(SUM(CASE WHEN t.transaction_type = 'purchase' THEN t.total_cost ELSE 0 END), 2) AS total_purchased_value,
    ROUND(SUM(CASE WHEN t.transaction_type = 'usage' THEN t.total_cost ELSE 0 END), 2) AS total_usage_value,
    ROUND(SUM(CASE WHEN t.transaction_type = 'wastage' THEN t.total_cost ELSE 0 END), 2) AS total_wastage_value,
    ROUND(SUM(CASE
        WHEN t.transaction_type = 'purchase' THEN t.total_cost
        WHEN t.transaction_type IN ('usage', 'wastage') THEN -t.total_cost
        ELSE 0
    END), 2) AS net_cash_flow
FROM inventory_transactions t
GROUP BY strftime('%Y-%m', t.transaction_date)
ORDER BY month_year ASC;

-- View 5: Estimated vs Actual Yield per Cycle with Variance Percentage
CREATE VIEW IF NOT EXISTS v_estimated_vs_actual_yield AS
SELECT
    c.id AS cycle_id,
    f.id AS farm_id,
    f.name AS farm_name,
    p.id AS plot_id,
    p.plot_code,
    p.name AS plot_name,
    p.area_acres,
    cr.name AS crop_name,
    cv.name AS variety_name,
    cr.category AS crop_category,
    c.season,
    c.sowing_date,
    c.expected_harvest_date,
    c.actual_harvest_date,
    c.status,
    c.estimated_yield,
    COALESCE(c.actual_yield, 0.0) AS actual_yield,
    ROUND(COALESCE(c.actual_yield, 0.0) - c.estimated_yield, 2) AS yield_variance_absolute,
    ROUND(
        CASE
            WHEN c.estimated_yield > 0
            THEN ((COALESCE(c.actual_yield, 0.0) - c.estimated_yield) / c.estimated_yield) * 100.0
            ELSE 0.0
        END,
        2
    ) AS yield_variance_percentage,
    CASE
        WHEN c.actual_yield IS NULL OR c.status NOT IN ('Harvested', 'Archived') THEN 'In Progress'
        WHEN c.actual_yield >= c.estimated_yield THEN 'Exceeded / Target Met'
        WHEN ((c.actual_yield - c.estimated_yield) / c.estimated_yield) < -0.15 THEN 'Deficit (>15% Under)'
        ELSE 'Minor Shortfall'
    END AS performance_status
FROM crop_cycles c
JOIN plots p ON c.plot_id = p.id
JOIN farms f ON p.farm_id = f.id
JOIN crop_varieties cv ON c.crop_variety_id = cv.id
JOIN crops cr ON cv.crop_id = cr.id;
