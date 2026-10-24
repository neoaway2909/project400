-- ============================================================
-- shop_db - Inventory & IMEI Management Schema
-- PostgreSQL Compatible
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: brands
-- ============================================================
CREATE TABLE IF NOT EXISTS brands (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    logo_url    VARCHAR(500),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: device_models
-- ============================================================
CREATE TABLE IF NOT EXISTS device_models (
    id              SERIAL PRIMARY KEY,
    brand_id        INT NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
    model_name      VARCHAR(200) NOT NULL,
    storage         VARCHAR(50)  NOT NULL,   -- e.g. '128GB', '256GB'
    color           VARCHAR(100) NOT NULL,
    selling_price   NUMERIC(12, 2) NOT NULL CHECK (selling_price >= 0),
    cost_price      NUMERIC(12, 2) NOT NULL CHECK (cost_price >= 0),
    sku             VARCHAR(100) UNIQUE,
    description     TEXT,
    image_url       VARCHAR(500),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_device_models_brand_id ON device_models(brand_id);

-- ============================================================
-- TABLE: suppliers
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    contact     VARCHAR(200),
    phone       VARCHAR(50),
    email       VARCHAR(200),
    address     TEXT,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: stock_lots
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_lots (
    id              SERIAL PRIMARY KEY,
    lot_number      VARCHAR(50) NOT NULL UNIQUE,
    supplier_id     INT REFERENCES suppliers(id) ON DELETE SET NULL,
    received_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    note            TEXT,
    created_by      VARCHAR(100),
    total_units     INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_lots_received_date ON stock_lots(received_date);

-- ============================================================
-- TABLE: device_imeis  (Core table of this module)
-- ============================================================
CREATE TYPE imei_status AS ENUM (
    'IN_STOCK',
    'RESERVED',
    'SOLD',
    'CLAIM_REPAIR',
    'DEFECTIVE'
);

CREATE TABLE IF NOT EXISTS device_imeis (
    imei            VARCHAR(15) PRIMARY KEY,
    model_id        INT NOT NULL REFERENCES device_models(id) ON DELETE RESTRICT,
    lot_id          INT REFERENCES stock_lots(id) ON DELETE SET NULL,
    status          imei_status NOT NULL DEFAULT 'IN_STOCK',
    purchase_price  NUMERIC(12, 2),          -- ราคาที่รับเข้าจากล็อตนั้น
    note            TEXT,
    received_at     TIMESTAMPTZ DEFAULT NOW(),
    sold_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_imei_format CHECK (imei ~ '^[0-9]{15}$')
);

CREATE INDEX idx_device_imeis_model_id ON device_imeis(model_id);
CREATE INDEX idx_device_imeis_lot_id   ON device_imeis(lot_id);
CREATE INDEX idx_device_imeis_status   ON device_imeis(status);

-- ============================================================
-- TABLE: imei_status_logs  (Audit trail ทุกการเปลี่ยนสถานะ)
-- ============================================================
CREATE TABLE IF NOT EXISTS imei_status_logs (
    id          BIGSERIAL PRIMARY KEY,
    imei        VARCHAR(15) NOT NULL REFERENCES device_imeis(imei) ON DELETE CASCADE,
    old_status  imei_status,
    new_status  imei_status NOT NULL,
    changed_by  VARCHAR(100),
    reason      TEXT,
    changed_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_imei_status_logs_imei ON imei_status_logs(imei);

-- ============================================================
-- TRIGGER: auto-update updated_at columns
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_device_models_updated_at
    BEFORE UPDATE ON device_models
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_stock_lots_updated_at
    BEFORE UPDATE ON stock_lots
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_device_imeis_updated_at
    BEFORE UPDATE ON device_imeis
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TRIGGER: auto-log imei status changes
-- ============================================================
CREATE OR REPLACE FUNCTION log_imei_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO imei_status_logs(imei, old_status, new_status, changed_by)
        VALUES (NEW.imei, OLD.status, NEW.status, current_user);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_imei_status_log
    AFTER UPDATE ON device_imeis
    FOR EACH ROW EXECUTE FUNCTION log_imei_status_change();

-- ============================================================
-- POS MODULE TABLES
-- ============================================================

-- customers table
CREATE TABLE IF NOT EXISTS customers (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name     VARCHAR(100) NOT NULL,
    phone_number  VARCHAR(20) NOT NULL,
    email         VARCHAR(100),
    id_card_no    VARCHAR(20),
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone_number);

-- orders table
CREATE TABLE IF NOT EXISTS orders (
    order_id        VARCHAR(30) PRIMARY KEY, -- e.g. ORD-20261024-001
    customer_id     UUID REFERENCES customers(id),
    total_amount    NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    payment_method  VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH','CREDIT_CARD','QR_PROMPT_PAY')),
    payment_status  VARCHAR(20) NOT NULL CHECK (payment_status IN ('PAID','PENDING','FAILED')),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);

-- order_items table
CREATE TABLE IF NOT EXISTS order_items (
    order_id        VARCHAR(30) REFERENCES orders(order_id) ON DELETE CASCADE,
    line_no         INT NOT NULL,
    model_name      VARCHAR(100) NOT NULL,
    imei            VARCHAR(15) NOT NULL,
    price           NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    package_code    VARCHAR(30),
    package_price   NUMERIC(12,2),
    PRIMARY KEY (order_id, line_no)
);

CREATE INDEX idx_order_items_imei ON order_items(imei);

-- warranty_logs table
CREATE TABLE IF NOT EXISTS warranty_logs (
    log_id          SERIAL PRIMARY KEY,
    order_id        VARCHAR(30) REFERENCES orders(order_id) ON DELETE CASCADE,
    imei            VARCHAR(15) NOT NULL,
    policy_no       VARCHAR(30),
    sync_status     VARCHAR(20) NOT NULL CHECK (sync_status IN ('SUCCESS','FAILED','RETRY_PENDING')),
    response_payload JSONB,
    synced_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_warranty_logs_policy ON warranty_logs(policy_no);

-- End of schema
