-- ============================================================
-- Insurance Domain Database Schema (PostgreSQL)
-- Project: Phone Shop & Repair Center Insurance System
-- Module: Policy Engine & Verification Module
-- ============================================================

CREATE DATABASE insurance_db;
\c insurance_db;

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE policy_status_enum AS ENUM ('ACTIVE', 'EXPIRED', 'VOID', 'CLAIMED_OUT');
CREATE TYPE coverage_type_enum AS ENUM ('SCREEN_CRACK', 'WATER_DAMAGE', 'ACCIDENTAL', 'FULL_COVERAGE', 'THEFT');
CREATE TYPE repair_event_enum AS ENUM (
  'REPAIR_RECEIVED',
  'REPAIR_IN_PROGRESS',
  'WAITING_SPARE_PARTS',
  'REPAIR_COMPLETED',
  'DEVICE_DELIVERED'
);

-- ============================================================
-- TABLE: insurance_packages
-- ============================================================
CREATE TABLE insurance_packages (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_code    VARCHAR(50)   UNIQUE NOT NULL,           -- e.g. PKG_ACCIDENT_1Y
  package_name    VARCHAR(200)  NOT NULL,
  description     TEXT,
  premium_price   NUMERIC(12,2) NOT NULL,                  -- ราคาเบี้ยประกัน (บาท)
  coverage_months INT           NOT NULL,                  -- ระยะเวลาคุ้มครอง (เดือน)
  max_coverage_amount NUMERIC(12,2) NOT NULL,              -- วงเงินคุ้มครองสูงสุด
  max_claim_count INT           NOT NULL DEFAULT 1,        -- จำนวนครั้งที่เคลมได้สูงสุด
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE insurance_packages IS 'ตารางแพ็กเกจประกันภัย';
COMMENT ON COLUMN insurance_packages.package_code IS 'รหัสแพ็กเกจ เช่น PKG_ACCIDENT_1Y';

-- ============================================================
-- TABLE: coverage_rules
-- ============================================================
CREATE TABLE coverage_rules (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id      UUID          NOT NULL REFERENCES insurance_packages(id) ON DELETE CASCADE,
  rule_name       VARCHAR(200)  NOT NULL,                  -- ชื่อเงื่อนไข
  coverage_type   coverage_type_enum NOT NULL,
  max_amount      NUMERIC(12,2),                           -- วงเงินสูงสุดสำหรับกฎนี้
  max_times       INT           DEFAULT 1,                 -- จำนวนครั้งที่ใช้ได้
  excess_amount   NUMERIC(12,2) DEFAULT 0,                 -- ค่า Excess ที่ลูกค้าต้องจ่ายเอง
  conditions      JSONB,                                   -- เงื่อนไขเพิ่มเติม (JSON)
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE coverage_rules IS 'เงื่อนไขความคุ้มครองย่อยของแต่ละแพ็กเกจ';
COMMENT ON COLUMN coverage_rules.excess_amount IS 'ค่า Excess ที่ลูกค้าต้องจ่ายเอง เช่น 500 บาท';

-- ============================================================
-- TABLE: policies
-- ============================================================
CREATE TABLE policies (
  policy_no               VARCHAR(30)   PRIMARY KEY,       -- e.g. POL-2026-008921
  package_id              UUID          NOT NULL REFERENCES insurance_packages(id),
  store_id                VARCHAR(50)   NOT NULL,
  order_id                VARCHAR(100)  NOT NULL,
  imei                    VARCHAR(15)   NOT NULL,
  device_model            VARCHAR(200)  NOT NULL,
  device_price            NUMERIC(12,2),
  customer_name           VARCHAR(200)  NOT NULL,
  customer_phone          VARCHAR(20)   NOT NULL,
  customer_email          VARCHAR(200),
  coverage_start          TIMESTAMPTZ   NOT NULL,
  coverage_end            TIMESTAMPTZ   NOT NULL,
  max_coverage_amount     NUMERIC(12,2) NOT NULL,
  remaining_claim_amount  NUMERIC(12,2) NOT NULL,
  claim_count             INT           NOT NULL DEFAULT 0,
  max_claim_count         INT           NOT NULL DEFAULT 1,
  status                  policy_status_enum NOT NULL DEFAULT 'ACTIVE',
  e_warranty_url          VARCHAR(500),
  purchased_at            TIMESTAMPTZ   NOT NULL,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_by              VARCHAR(100)
);

-- Index สำหรับค้นหาด้วย IMEI (Real-time Verification)
CREATE INDEX idx_policies_imei ON policies(imei);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_policies_store_id ON policies(store_id);
CREATE INDEX idx_policies_coverage_end ON policies(coverage_end);
CREATE INDEX idx_policies_imei_status ON policies(imei, status);

COMMENT ON TABLE policies IS 'ตารางกรมธรรม์ประกันภัย';
COMMENT ON COLUMN policies.policy_no IS 'เลขกรมธรรม์ เช่น POL-2026-008921';
COMMENT ON COLUMN policies.imei IS 'เลขอีมี่ 15 หลัก (Indexed สำหรับ Real-time Query)';
COMMENT ON COLUMN policies.remaining_claim_amount IS 'วงเงินเคลมคงเหลือ';

-- ============================================================
-- TABLE: repair_tickets
-- ============================================================
CREATE TABLE repair_tickets (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id       VARCHAR(30)   UNIQUE NOT NULL,            -- e.g. REP-2026-1004
  policy_no       VARCHAR(30)   NOT NULL REFERENCES policies(policy_no),
  imei            VARCHAR(15)   NOT NULL,
  center_id       VARCHAR(50)   NOT NULL,
  center_name     VARCHAR(200),
  technician_id   VARCHAR(50),
  defect_symptom  TEXT          NOT NULL,
  estimated_cost  NUMERIC(12,2),
  cost_covered    NUMERIC(12,2) DEFAULT 0,                  -- ค่าซ่อมที่บริษัทประกันจ่าย
  customer_excess NUMERIC(12,2) DEFAULT 0,                  -- ส่วนที่ลูกค้าจ่ายเอง
  photos          JSONB,                                    -- รายการ URL รูปถ่าย
  current_status  repair_event_enum NOT NULL DEFAULT 'REPAIR_RECEIVED',
  repair_summary  TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_repair_tickets_policy ON repair_tickets(policy_no);
CREATE INDEX idx_repair_tickets_imei ON repair_tickets(imei);

-- ============================================================
-- TABLE: repair_status_logs
-- ============================================================
CREATE TABLE repair_status_logs (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id       VARCHAR(30)   NOT NULL REFERENCES repair_tickets(ticket_id),
  event_id        VARCHAR(100)  NOT NULL,
  event_type      repair_event_enum NOT NULL,
  details         JSONB,
  status_updated_at TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: api_keys (Authentication สำหรับร้านค้า/ศูนย์ซ่อม)
-- ============================================================
CREATE TABLE api_keys (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_hash        VARCHAR(256)  UNIQUE NOT NULL,            -- bcrypt hash ของ API Key
  client_id       VARCHAR(50)   UNIQUE NOT NULL,            -- เช่น SHOP-BKK-01
  client_name     VARCHAR(200)  NOT NULL,
  client_type     VARCHAR(20)   NOT NULL CHECK (client_type IN ('SHOP','REPAIR_CENTER','ADMIN')),
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  last_used_at    TIMESTAMPTZ
);

-- ============================================================
-- SEQUENCE: Auto-increment สำหรับ policy_no
-- ============================================================
CREATE SEQUENCE policy_seq START WITH 1 INCREMENT BY 1;

-- ============================================================
-- FUNCTION: สร้าง Policy No อัตโนมัติ
-- ============================================================
CREATE OR REPLACE FUNCTION generate_policy_no()
RETURNS VARCHAR AS $$
DECLARE
  year_part VARCHAR(4);
  seq_num   INT;
  policy    VARCHAR(30);
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  seq_num   := NEXTVAL('policy_seq');
  policy    := 'POL-' || year_part || '-' || LPAD(seq_num::TEXT, 6, '0');
  RETURN policy;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: อัปเดต updated_at อัตโนมัติ
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_policies_updated_at
  BEFORE UPDATE ON policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_packages_updated_at
  BEFORE UPDATE ON insurance_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_repair_tickets_updated_at
  BEFORE UPDATE ON repair_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED DATA: Insurance Packages
-- ============================================================
INSERT INTO insurance_packages (package_code, package_name, description, premium_price, coverage_months, max_coverage_amount, max_claim_count)
VALUES
  ('PKG_SCREEN_1Y', 'ประกันจอแตก 1 ปี',
   'คุ้มครองหน้าจอแตกร้าวจากอุบัติเหตุ คุ้มครอง 1 ครั้งต่อปี',
   990.00, 12, 15000.00, 1),

  ('PKG_ACCIDENT_1Y', 'ประกันอุบัติเหตุและจอแตก 1 ปี',
   'คุ้มครองอุบัติเหตุรอบด้าน ทั้งจอแตก เครื่องตกน้ำ และความเสียหายจากอุบัติเหตุ คุ้มครองสูงสุด 2 ครั้ง',
   1990.00, 12, 41900.00, 2),

  ('PKG_FULL_2Y', 'ประกันครอบจักรวาล 2 ปี',
   'คุ้มครองครบทุกความเสี่ยง รวมถึงการสูญหาย ตลอด 2 ปี คุ้มครองสูงสุด 3 ครั้ง',
   4990.00, 24, 50000.00, 3);

-- ============================================================
-- SEED DATA: Coverage Rules
-- ============================================================
INSERT INTO coverage_rules (package_id, rule_name, coverage_type, max_amount, max_times, excess_amount)
SELECT id, 'คุ้มครองจอแตก (Accidental Screen Damage)', 'SCREEN_CRACK', 15000.00, 1, 0.00
FROM insurance_packages WHERE package_code = 'PKG_SCREEN_1Y';

INSERT INTO coverage_rules (package_id, rule_name, coverage_type, max_amount, max_times, excess_amount)
SELECT id, 'คุ้มครองจอแตก', 'SCREEN_CRACK', 25000.00, 1, 0.00
FROM insurance_packages WHERE package_code = 'PKG_ACCIDENT_1Y';

INSERT INTO coverage_rules (package_id, rule_name, coverage_type, max_amount, max_times, excess_amount)
SELECT id, 'คุ้มครองเครื่องตกน้ำ (มีค่า Excess)', 'WATER_DAMAGE', 20000.00, 1, 500.00
FROM insurance_packages WHERE package_code = 'PKG_ACCIDENT_1Y';

INSERT INTO coverage_rules (package_id, rule_name, coverage_type, max_amount, max_times, excess_amount)
SELECT id, 'คุ้มครองอุบัติเหตุทุกประเภท', 'ACCIDENTAL', 50000.00, 3, 0.00
FROM insurance_packages WHERE package_code = 'PKG_FULL_2Y';

INSERT INTO coverage_rules (package_id, rule_name, coverage_type, max_amount, max_times, excess_amount)
SELECT id, 'คุ้มครองการสูญหาย', 'THEFT', 50000.00, 1, 1000.00
FROM insurance_packages WHERE package_code = 'PKG_FULL_2Y';

-- ============================================================
-- SEED DATA: Mock Policies
-- ============================================================
INSERT INTO policies (
  policy_no, package_id, store_id, order_id, imei,
  device_model, device_price, customer_name, customer_phone, customer_email,
  coverage_start, coverage_end, max_coverage_amount, remaining_claim_amount,
  claim_count, max_claim_count, status, e_warranty_url, purchased_at
)
SELECT
  'POL-2026-000001',
  p.id,
  'SHOP-BKK-01',
  'ORD-20261001-0001',
  '358941091234567',
  'iPhone 15 Pro 256GB Black Titanium',
  41900.00,
  'สมชาย ใจดี',
  '0812345678',
  'somchai@example.com',
  '2026-10-01T10:00:00Z',
  '2027-10-01T23:59:59Z',
  41900.00,
  41900.00,
  0,
  2,
  'ACTIVE',
  'https://warranty.example.com/card/POL-2026-000001',
  '2026-10-01T10:00:00Z'
FROM insurance_packages p WHERE p.package_code = 'PKG_ACCIDENT_1Y';

INSERT INTO policies (
  policy_no, package_id, store_id, order_id, imei,
  device_model, device_price, customer_name, customer_phone, customer_email,
  coverage_start, coverage_end, max_coverage_amount, remaining_claim_amount,
  claim_count, max_claim_count, status, e_warranty_url, purchased_at
)
SELECT
  'POL-2026-000002',
  p.id,
  'SHOP-CNX-02',
  'ORD-20261015-0042',
  '490154203237518',
  'Samsung Galaxy S24 Ultra 512GB',
  45900.00,
  'สมหญิง รักดี',
  '0898765432',
  'somying@example.com',
  '2026-10-15T09:00:00Z',
  '2028-10-15T23:59:59Z',
  50000.00,
  50000.00,
  0,
  3,
  'ACTIVE',
  'https://warranty.example.com/card/POL-2026-000002',
  '2026-10-15T09:00:00Z'
FROM insurance_packages p WHERE p.package_code = 'PKG_FULL_2Y';

-- ============================================================
-- SEED DATA: Mock API Keys (hash ของ key จริงจะ generate ที่ application)
-- ============================================================
INSERT INTO api_keys (key_hash, client_id, client_name, client_type)
VALUES
  (encode(digest('SHOP-BKK-01-SECRET-KEY-2026', 'sha256'), 'hex'), 'SHOP-BKK-01', 'ร้านมือถือ BKK สาขา 01', 'SHOP'),
  (encode(digest('CTR-SIAM-01-SECRET-KEY-2026', 'sha256'), 'hex'), 'CTR-SIAM-01', 'ศูนย์ซ่อม สยามสแควร์', 'REPAIR_CENTER'),
  (encode(digest('ADMIN-MASTER-KEY-2026', 'sha256'), 'hex'), 'ADMIN-001', 'Insurance Admin System', 'ADMIN');
