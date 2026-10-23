# 📱 PhoneShop – Inventory & IMEI Management System

ระบบจัดการสต็อกและ IMEI โทรศัพท์มือถือ สำหรับร้านขายโทรศัพท์  
สร้างตาม Clean Architecture แบบ Controller → Service → Repository

---

## 🗂️ โครงสร้างโปรเจกต์

```
P400/
├── database/
│   ├── schema.sql          # PostgreSQL schema (brands, models, imeis, logs)
│   └── seed.sql            # Mock data สำหรับทดสอบ
│
├── backend/                # Node.js + Express API
│   ├── src/
│   │   ├── app.js          # Express setup + middleware
│   │   ├── server.js       # Entry point
│   │   ├── database/
│   │   │   └── db.js       # PostgreSQL connection pool
│   │   ├── utils/
│   │   │   └── imei.validator.js   # Luhn + Regex validation
│   │   ├── repositories/
│   │   │   └── inventory.repository.js
│   │   ├── services/
│   │   │   └── inventory.service.js
│   │   ├── controllers/
│   │   │   └── inventory.controller.js
│   │   └── routes/
│   │       ├── inventory.routes.js
│   │       ├── brand.routes.js
│   │       └── model.routes.js
│   └── package.json
│
└── frontend/               # React + Vite Dashboard
    └── src/
        ├── api/client.js           # Fetch wrapper
        ├── data/mockData.js        # Mock data (ใช้เมื่อไม่มี backend)
        ├── components/
        │   ├── shared.jsx          # StatusBadge, formatters, etc.
        │   ├── Dashboard.jsx       # หน้า Dashboard สรุปสต็อก
        │   ├── ReceiveStock.jsx    # หน้าสแกนรับเครื่อง
        │   ├── ImeiSearch.jsx      # หน้าค้นหา IMEI
        │   └── AvailableStock.jsx  # หน้าสินค้าพร้อมขาย
        └── App.jsx                 # Root + Sidebar navigation
```

---

## 🚀 วิธีรันระบบ

### 1. ติดตั้ง Database (PostgreSQL)

```bash
# สร้าง database
createdb shop_db

# สร้าง schema
psql -U postgres -d shop_db -f database/schema.sql

# ใส่ mock data
psql -U postgres -d shop_db -f database/seed.sql
```

### 2. รัน Backend API

```bash
cd backend

# copy .env
copy .env.example .env
# แก้ไข DB_PASSWORD ใน .env

npm install
npm run dev
# → http://localhost:4000
```

### 3. รัน Frontend (React)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### 4. ทดสอบแบบ Frontend-only (ไม่ต้องมี database)

```bash
# ใน frontend/.env เพิ่ม:
VITE_USE_MOCK=true

npm run dev
```

---

## 📡 API Endpoints

| Method | Endpoint | คำอธิบาย |
|--------|----------|-----------|
| `GET`  | `/health` | Health check |
| `POST` | `/api/v1/inventory/receive` | รับเครื่องเข้าสต็อก (single/batch) |
| `GET`  | `/api/v1/inventory/summary` | Dashboard KPI + breakdown |
| `GET`  | `/api/v1/inventory/available-stock` | เครื่อง IN_STOCK สำหรับ POS |
| `GET`  | `/api/v1/inventory/imei/:imei` | ค้นหา IMEI + ประวัติ |
| `PUT`  | `/api/v1/inventory/imei/:imei/status` | อัปเดตสถานะ IMEI |
| `GET`  | `/api/v1/brands` | รายการยี่ห้อ |
| `POST` | `/api/v1/brands` | เพิ่มยี่ห้อ |
| `GET`  | `/api/v1/models` | รายการรุ่น |
| `POST` | `/api/v1/models` | เพิ่มรุ่น |

---

## 📋 IMEI Status Flow

```
              ┌──────────────┐
              │   IN_STOCK   │ ← รับเข้าคลัง (receive)
              └──────┬───────┘
          ┌──────────┼──────────┐
          ▼          ▼          ▼
      RESERVED     SOLD    CLAIM_REPAIR
          │                    │
          │                    ├──→ IN_STOCK (ซ่อมเสร็จ)
          └──→ IN_STOCK         └──→ DEFECTIVE (เสียถาวร)
              or SOLD
```

---

## 🧪 ตัวอย่าง API Request

### รับเครื่องเข้าสต็อก (Batch)
```json
POST /api/v1/inventory/receive
{
  "imeis": ["351234567890006", "351234567890007"],
  "modelId": 1,
  "lotNumber": "LOT-2025-005",
  "purchasePrice": 38000,
  "receivedDate": "2026-10-23"
}
```

### ค้นหา IMEI
```
GET /api/v1/inventory/imei/351234567890001
```

### อัปเดตสถานะ
```json
PUT /api/v1/inventory/imei/351234567890001/status
{
  "status": "SOLD",
  "changedBy": "pos_cashier",
  "reason": "ขายหน้าร้าน TXN-20261023-001"
}
```

---

## 🔒 IMEI Validation

- **Regex**: ตัวเลข 15 หลักเท่านั้น `^[0-9]{15}$`
- **Luhn Algorithm**: ตรวจสอบ checksum ตามมาตรฐาน ISO/IEC 7812
- **Duplicate Check**: ตรวจสอบทั้งใน payload และ database
- **DB Constraint**: `CHECK (imei ~ '^[0-9]{15}$')` ระดับ database
