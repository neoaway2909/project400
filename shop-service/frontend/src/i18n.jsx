import { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'phoneshop_lang_v1';

const LangContext = createContext({
  lang: 'th',
  setLang: () => {},
  t: (th, en) => th,
});

const EN_DICTIONARY = {
  // Navigation & Page titles
  'ภาพรวม': 'Overview',
  'จัดการสต็อก': 'Inventory Control',
  'ขาย & บริการหลังการขาย': 'Sales & After-Sales',
  'ค้นหา': 'Search & Lookup',
  'แดชบอร์ดสรุปสต็อก': 'Inventory Dashboard',
  'รับเครื่องเข้าคลัง': 'Receive Stock',
  'สินค้าพร้อมขาย': 'Available Stock',
  'ขายหน้าร้าน (ชำระเงิน)': 'Point of Sale (POS)',
  'ประวัติการซื้อขาย': 'Sales History',
  'แจ้งเคลม / ส่งซ่อม': 'Warranty Claim & Repair',
  'ค้นหาเลขประจำเครื่อง': 'IMEI Lookup',

  // Common buttons & table headers
  'รีเฟรชข้อมูล': 'Refresh Data',
  'ล้างทั้งหมด': 'Clear All',
  'ยกเลิก': 'Cancel',
  'ปิดหน้าต่าง': 'Close Window',
  'ใบเสร็จ': 'Receipt',
  'แจ้งเคลม': 'File Claim',
  'แก้ไขราคาขาย': 'Edit Selling Price',
  'เลือกรุ่นนี้': 'Select Model',
  '+ เพิ่มยี่ห้อใหม่': '+ Add New Brand',
  '+ เพิ่มรุ่นโทรศัพท์ใหม่': '+ Add New Model',
  '+ เพิ่มยี่ห้อ': '+ Add Brand',
  '+ เพิ่มรุ่นใหม่': '+ Add Model',
  'บันทึกยี่ห้อใหม่': 'Save Brand',
  'บันทึกรุ่นโทรศัพท์ใหม่': 'Save New Model',
  'บันทึกราคาขายใหม่': 'Save Selling Price',
  'กำลังบันทึก...': 'Saving...',
  'เครื่องทั้งหมด': 'Total Units',
  'ทุกยี่ห้อ': 'All Brands',
  'ยี่ห้อ / รุ่น': 'Brand / Model',
  'ความจุ / สี': 'Storage / Color',
  'ราคา': 'Price',
  'มีในคลัง': 'In Stock',
  'ขายแล้ว': 'Sold',
  'ซ่อม': 'In Repair',
  'ส่งซ่อม': 'In Repair',
  'ส่งซ่อม / เคลม': 'In Repair / Claim',
  'รวม': 'Total',
  'พร้อมขาย': 'In Stock',
};

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'th';
    } catch {
      return 'th';
    }
  });

  const setLang = (next) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  const t = (thText, enText) => (lang === 'en' ? (enText ?? EN_DICTIONARY[thText] ?? thText) : thText);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

export function PhoneShopLogo() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '11px',
        padding: '11px 12px',
        borderRadius: '14px',
        background: 'linear-gradient(145deg, #0b0d10 0%, #171a21 100%)',
        border: '1.5px solid rgba(255, 224, 0, 0.4)',
        boxShadow: '0 8px 20px rgba(15, 23, 42, 0.16)',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Exact VOLT MOBILE Chamfered Phone + Lightning Bolt Vector Icon */}
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          background: 'rgba(255, 224, 0, 0.12)',
          border: '1px solid rgba(255, 224, 0, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="24" height="30" viewBox="0 0 56 68" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 2H20L23 6H33L36 2H46L54 10V58L46 66H10L2 58V10L10 2Z"
            fill="#FFE000"
          />
          <path
            d="M30.5 14L14 38H26.5L22.5 55L41 31H28.5L35 14H30.5Z"
            fill="#0b0d10"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: '1.12rem',
            fontWeight: 900,
            letterSpacing: '0.02em',
            lineHeight: 1.1,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <strong style={{ color: '#FFE000', WebkitTextFillColor: '#FFE000', fontWeight: 900 }}>VOLT</strong>
          <strong style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF', fontWeight: 900 }}>MOBILE</strong>
        </div>
        <div
          style={{
            fontSize: '0.55rem',
            fontWeight: 700,
            color: '#cbd5e1',
            WebkitTextFillColor: '#cbd5e1',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginTop: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          NEXT-GEN MOBILE STORE
        </div>
      </div>
    </div>
  );
}

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--clr-surface-2)',
        border: '1.5px solid var(--clr-border)',
        borderRadius: '999px',
        padding: '3px',
        gap: '2px',
      }}
      title="สลับภาษา / Switch Language"
    >
      <button
        type="button"
        onClick={() => setLang('th')}
        style={{
          padding: '5px 12px',
          borderRadius: '999px',
          border: 'none',
          fontSize: '.76rem',
          fontWeight: 800,
          cursor: 'pointer',
          background: lang === 'th' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
          color: lang === 'th' ? '#ffffff' : 'var(--clr-text-muted)',
          transition: 'all 0.2s ease',
        }}
      >
        TH ภาษาไทย
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        style={{
          padding: '5px 12px',
          borderRadius: '999px',
          border: 'none',
          fontSize: '.76rem',
          fontWeight: 800,
          cursor: 'pointer',
          background: lang === 'en' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
          color: lang === 'en' ? '#ffffff' : 'var(--clr-text-muted)',
          transition: 'all 0.2s ease',
        }}
      >
        EN English
      </button>
    </div>
  );
}
