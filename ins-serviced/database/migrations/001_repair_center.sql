BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'repair_status_enum') THEN
    CREATE TYPE repair_status_enum AS ENUM (
      'RECEIVED',
      'DIAGNOSING',
      'WAITING_PARTS',
      'IN_PROGRESS',
      'REPAIR_COMPLETED',
      'DELIVERED',
      'CANCELLED'
    );
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS repair_centers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_code VARCHAR(50) UNIQUE NOT NULL,
  name        VARCHAR(200) NOT NULL,
  location    TEXT NOT NULL,
  phone       VARCHAR(20) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS technicians (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id  UUID NOT NULL REFERENCES repair_centers(id),
  full_name  VARCHAR(200) NOT NULL,
  email      VARCHAR(200) UNIQUE NOT NULL,
  phone      VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO repair_centers (center_code, name, location, phone)
SELECT DISTINCT center_id, COALESCE(center_name, center_id), 'Migrated repair center', 'Not provided'
  FROM repair_tickets
ON CONFLICT (center_code) DO NOTHING;

ALTER TABLE repair_tickets
  ADD COLUMN center_id_new UUID REFERENCES repair_centers(id);
UPDATE repair_tickets t
   SET center_id_new = c.id
  FROM repair_centers c
 WHERE c.center_code = t.center_id;
ALTER TABLE repair_tickets ALTER COLUMN center_id_new SET NOT NULL;
ALTER TABLE repair_tickets DROP COLUMN center_id;
ALTER TABLE repair_tickets RENAME COLUMN center_id_new TO center_id;

ALTER TABLE repair_tickets RENAME COLUMN technician_id TO technician_id_legacy;
ALTER TABLE repair_tickets ADD COLUMN technician_id UUID REFERENCES technicians(id);

CREATE TABLE IF NOT EXISTS repair_photos (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id  VARCHAR(30) NOT NULL REFERENCES repair_tickets(ticket_id) ON DELETE CASCADE,
  photo_url  VARCHAR(1000) NOT NULL,
  photo_type VARCHAR(20) NOT NULL CHECK (photo_type IN ('BEFORE', 'AFTER', 'DAMAGED_PART')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO repair_photos (ticket_id, photo_url, photo_type)
SELECT t.ticket_id, photo.url, 'BEFORE'
  FROM repair_tickets t
 CROSS JOIN LATERAL jsonb_array_elements_text(
   CASE WHEN jsonb_typeof(t.photos) = 'array' THEN t.photos ELSE '[]'::JSONB END
 ) AS photo(url)
ON CONFLICT DO NOTHING;

ALTER TABLE repair_tickets DROP CONSTRAINT IF EXISTS repair_tickets_policy_no_fkey;
ALTER TABLE repair_tickets RENAME COLUMN cost_covered TO cost_covered_by_insurance;
ALTER TABLE repair_tickets RENAME COLUMN customer_excess TO customer_excess_paid;
ALTER TABLE repair_tickets ADD COLUMN actual_cost NUMERIC(12,2) CHECK (actual_cost >= 0);
ALTER TABLE repair_tickets ADD COLUMN coverage_limit_at_intake NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE repair_tickets ADD COLUMN fixed_excess_at_intake NUMERIC(12,2) NOT NULL DEFAULT 0;
UPDATE repair_tickets
   SET estimated_cost = COALESCE(estimated_cost, 0),
       cost_covered_by_insurance = COALESCE(cost_covered_by_insurance, 0),
       customer_excess_paid = COALESCE(customer_excess_paid, 0),
       coverage_limit_at_intake = COALESCE(
         cost_covered_by_insurance + customer_excess_paid,
         estimated_cost,
         0
       );
ALTER TABLE repair_tickets ALTER COLUMN estimated_cost SET DEFAULT 0;
ALTER TABLE repair_tickets ALTER COLUMN estimated_cost SET NOT NULL;
ALTER TABLE repair_tickets ALTER COLUMN cost_covered_by_insurance SET DEFAULT 0;
ALTER TABLE repair_tickets ALTER COLUMN cost_covered_by_insurance SET NOT NULL;
ALTER TABLE repair_tickets ALTER COLUMN customer_excess_paid SET DEFAULT 0;
ALTER TABLE repair_tickets ALTER COLUMN customer_excess_paid SET NOT NULL;

ALTER TABLE repair_tickets RENAME COLUMN current_status TO repair_status_legacy;
ALTER TABLE repair_tickets ADD COLUMN repair_status repair_status_enum NOT NULL DEFAULT 'RECEIVED';
UPDATE repair_tickets
   SET repair_status = CASE repair_status_legacy::TEXT
     WHEN 'REPAIR_RECEIVED' THEN 'RECEIVED'::repair_status_enum
     WHEN 'REPAIR_IN_PROGRESS' THEN 'IN_PROGRESS'::repair_status_enum
     WHEN 'WAITING_SPARE_PARTS' THEN 'WAITING_PARTS'::repair_status_enum
     WHEN 'REPAIR_COMPLETED' THEN 'REPAIR_COMPLETED'::repair_status_enum
     WHEN 'DEVICE_DELIVERED' THEN 'DELIVERED'::repair_status_enum
   END;
ALTER TABLE repair_tickets DROP COLUMN repair_status_legacy;

ALTER TABLE repair_status_logs
  ALTER COLUMN event_type TYPE repair_status_enum
  USING (
    CASE event_type::TEXT
      WHEN 'REPAIR_RECEIVED' THEN 'RECEIVED'
      WHEN 'REPAIR_IN_PROGRESS' THEN 'IN_PROGRESS'
      WHEN 'WAITING_SPARE_PARTS' THEN 'WAITING_PARTS'
      WHEN 'REPAIR_COMPLETED' THEN 'REPAIR_COMPLETED'
      WHEN 'DEVICE_DELIVERED' THEN 'DELIVERED'
    END
  )::repair_status_enum;

ALTER TABLE repair_status_logs DROP CONSTRAINT IF EXISTS repair_status_logs_ticket_id_fkey;
ALTER TABLE repair_tickets DROP CONSTRAINT IF EXISTS repair_tickets_pkey;
ALTER TABLE repair_tickets DROP COLUMN IF EXISTS id;
ALTER TABLE repair_tickets ADD PRIMARY KEY (ticket_id);
ALTER TABLE repair_status_logs
  ADD CONSTRAINT repair_status_logs_ticket_id_fkey
  FOREIGN KEY (ticket_id) REFERENCES repair_tickets(ticket_id);

CREATE TABLE IF NOT EXISTS spare_parts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  part_code  VARCHAR(50) UNIQUE NOT NULL,
  part_name  VARCHAR(200) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  stock_qty  INT NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_parts (
  ticket_id  VARCHAR(30) NOT NULL REFERENCES repair_tickets(ticket_id) ON DELETE CASCADE,
  part_id    UUID NOT NULL REFERENCES spare_parts(id),
  quantity   INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  PRIMARY KEY (ticket_id, part_id)
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id       VARCHAR(30) NOT NULL REFERENCES repair_tickets(ticket_id),
  event_type      repair_status_enum NOT NULL,
  target_url      VARCHAR(1000) NOT NULL,
  payload         JSONB NOT NULL,
  response_status INT,
  error_message   TEXT,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repair_tickets_status ON repair_tickets(repair_status);
CREATE INDEX IF NOT EXISTS idx_repair_tickets_policy ON repair_tickets(policy_no);
CREATE INDEX IF NOT EXISTS idx_repair_tickets_imei ON repair_tickets(imei);

CREATE SEQUENCE IF NOT EXISTS repair_ticket_seq START WITH 1001 INCREMENT BY 1;

INSERT INTO repair_centers (id, center_code, name, location, phone)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'CTR-SIAM-01',
  'ศูนย์ซ่อม สยามสแควร์',
  'สยามสแควร์ กรุงเทพฯ',
  '021234567'
)
ON CONFLICT (center_code) DO NOTHING;

INSERT INTO technicians (id, center_id, full_name, email, phone)
SELECT
  '00000000-0000-4000-8000-000000000002',
  id,
  'ช่างประจำศูนย์',
  'technician@repair-center.local',
  '0812345678'
FROM repair_centers
WHERE center_code = 'CTR-SIAM-01'
ON CONFLICT (email) DO NOTHING;

COMMIT;
