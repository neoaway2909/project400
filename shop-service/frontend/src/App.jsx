import { useState } from 'react';
import Dashboard      from './components/Dashboard';
import ReceiveStock   from './components/ReceiveStock';
import ImeiSearch     from './components/ImeiSearch';
import AvailableStock from './components/AvailableStock';
import SalesHistory   from './components/SalesHistory';
import ClaimRequest   from './components/ClaimRequest';
import Checkout       from './pages/Checkout';
import { LangProvider, useLang, PhoneShopLogo, LanguageSwitcher } from './i18n';

const NAV = [
  {
    sectionTh: 'ภาพรวมระบบ',
    sectionEn: 'Overview',
    items: [
      { id: 'dashboard', labelTh: 'สรุปภาพรวมคลังสินค้า', labelEn: 'Inventory Dashboard' },
    ],
  },
  {
    sectionTh: 'จัดการสต็อก',
    sectionEn: 'Inventory Control',
    items: [
      { id: 'receive',   labelTh: 'รับเครื่องเข้าคลัง', labelEn: 'Receive Stock' },
      { id: 'available', labelTh: 'สินค้าพร้อมขาย',     labelEn: 'Available Stock' },
    ],
  },
  {
    sectionTh: 'ขายและบริการหลังการขาย',
    sectionEn: 'Sales & After-Sales',
    items: [
      { id: 'checkout',      labelTh: 'ขายหน้าร้านและผูกประกัน', labelEn: 'Point of Sale (POS)' },
      { id: 'sales-history', labelTh: 'ประวัติการซื้อขาย',      labelEn: 'Sales History' },
      { id: 'claim-request', labelTh: 'แจ้งเคลมและส่งซ่อม',     labelEn: 'Warranty Claim & Repair' },
    ],
  },
  {
    sectionTh: 'ค้นหาข้อมูล',
    sectionEn: 'Search & Lookup',
    items: [
      { id: 'imei-search', labelTh: 'ค้นหาเลขประจำเครื่อง', labelEn: 'IMEI Lookup' },
    ],
  },
];

const PAGE_TITLES = {
  dashboard: {
    titleTh: 'สรุปภาพรวมคลังสินค้า',
    subTh:   'ข้อมูลสถิติสต็อกโทรศัพท์มือถือและยอดขายทั้งหมดในระบบ',
    titleEn: 'Inventory Dashboard',
    subEn:   'Complete overview of smartphone stock levels and sales',
  },
  receive: {
    titleTh: 'รับเครื่องเข้าคลังและจัดการรุ่นสินค้า',
    subTh:   'สแกนเลขประจำเครื่องเพื่อเพิ่มสต็อกและจัดการรุ่นโทรศัพท์',
    titleEn: 'Receive Stock & Model Catalog',
    subEn:   'Scan device IMEIs to receive inventory and manage product models',
  },
  available: {
    titleTh: 'รายการสินค้าพร้อมขาย',
    subTh:   'โทรศัพท์มือถือในคลังที่พร้อมจำหน่ายหน้าร้าน',
    titleEn: 'Available Stock',
    subEn:   'In-stock smartphones ready for retail sale',
  },
  checkout: {
    titleTh: 'ชำระเงินหน้าร้านและสมัครประกันภัย',
    subTh:   'คิดเงิน เลือกแผนผ่อนชำระ และส่งข้อมูลออกใบรับประกันดิจิทัล',
    titleEn: 'Point of Sale & Warranty Enrollment',
    subEn:   'Process checkout, installment plans, and instant e-warranty registration',
  },
  'sales-history': {
    titleTh: 'ประวัติการซื้อขายหน้าร้าน',
    subTh:   'รายการใบเสร็จ ข้อมูลผู้ซื้อ และเลขกรมธรรม์ประกันภัย',
    titleEn: 'Retail Sales History',
    subEn:   'Sales orders, customer records, and linked insurance policies',
  },
  'claim-request': {
    titleTh: 'แจ้งเคลมประกันและส่งซ่อม',
    subTh:   'ตรวจสอบสิทธิ์ความคุ้มครองและเปิดใบงานส่งศูนย์บริการ',
    titleEn: 'Warranty Claim & Repair Intake',
    subEn:   'Verify policy coverage and submit repair tickets to partner centers',
  },
  'imei-search': {
    titleTh: 'ค้นหาประวัติเลขประจำเครื่อง',
    subTh:   'ตรวจสอบสถานะปัจจุบันและประวัติการเปลี่ยนสถานะย้อนหลัง',
    titleEn: 'Device IMEI Lookup',
    subEn:   'Inspect current device status and historical audit logs',
  },
};

function AppShell() {
  const { lang, t } = useLang();
  const [page, setPage] = useState('dashboard');
  const [claimImei, setClaimImei] = useState('');
  const pt = PAGE_TITLES[page] || PAGE_TITLES.dashboard;

  const handleOpenClaimForImei = (imei) => {
    setClaimImei(imei);
    setPage('claim-request');
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':     return <Dashboard />;
      case 'receive':       return <ReceiveStock />;
      case 'available':     return <AvailableStock />;
      case 'checkout':      return <Checkout />;
      case 'sales-history': return <SalesHistory onOpenClaimForImei={handleOpenClaimForImei} />;
      case 'claim-request': return <ClaimRequest initialImei={claimImei} />;
      case 'imei-search':   return <ImeiSearch />;
      default:              return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ padding: '16px 12px 14px' }}>
          <PhoneShopLogo />
        </div>
        <nav className="sidebar-nav">
          {NAV.map(section => (
            <div key={section.sectionEn}>
              <div className="nav-section-label">
                {lang === 'th' ? section.sectionTh : section.sectionEn}
              </div>
              {section.items.map(item => (
                <button
                  key={item.id}
                  className={`nav-item ${page === item.id ? 'active' : ''}`}
                  onClick={() => {
                    if (item.id !== 'claim-request') setClaimImei('');
                    setPage(item.id);
                  }}
                >
                  {lang === 'th' ? item.labelTh : item.labelEn}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--clr-border)',
          fontSize: '.72rem',
          color: 'var(--clr-text-subtle)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>
            {t('รุ่นระบบ 1.0.0', 'Version 1.0.0')}
          </div>
          <div>
            {t('ระบบบริหารจัดการร้านโทรศัพท์', 'PhoneShop Management')}
          </div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="main-content">
        {/* Topbar */}
        <div className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <div className="topbar-title">{lang === 'th' ? pt.titleTh : pt.titleEn}</div>
            <div className="topbar-subtitle">{lang === 'th' ? pt.subTh : pt.subEn}</div>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Page Body */}
        <div className="page-body">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AppShell />
    </LangProvider>
  );
}
