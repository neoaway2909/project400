import { useState } from 'react';
import Dashboard      from './components/Dashboard';
import ReceiveStock   from './components/ReceiveStock';
import ImeiSearch     from './components/ImeiSearch';
import AvailableStock from './components/AvailableStock';
import SalesHistory   from './components/SalesHistory';
import ClaimRequest   from './components/ClaimRequest';
import Checkout       from './pages/Checkout';

const NAV = [
  {
    section: 'ภาพรวม',
    items: [
      { id: 'dashboard',  label: 'Dashboard สต็อก' },
    ],
  },
  {
    section: 'จัดการสต็อก',
    items: [
      { id: 'receive',    label: 'รับเครื่องเข้าคลัง' },
      { id: 'available',  label: 'สินค้าพร้อมขาย' },
    ],
  },
  {
    section: 'ขาย & บริการหลังการขาย',
    items: [
      { id: 'checkout',      label: 'POS ขายหน้าร้าน' },
      { id: 'sales-history', label: 'ประวัติการซื้อขาย' },
      { id: 'claim-request', label: 'แจ้งเคลม / ส่งซ่อม' },
    ],
  },
  {
    section: 'ค้นหา',
    items: [
      { id: 'imei-search', label: 'ค้นหา IMEI' },
    ],
  },
];

const PAGE_TITLES = {
  dashboard:       { title: 'Inventory Dashboard',        sub: 'ภาพรวมสต็อกโทรศัพท์ทั้งหมด' },
  receive:         { title: 'รับเครื่องเข้าคลัง',         sub: 'สแกน IMEI เพื่อเพิ่มสต็อก' },
  available:       { title: 'สินค้าพร้อมขาย',             sub: 'โทรศัพท์สถานะ IN_STOCK' },
  checkout:        { title: 'POS Checkout & ผูกประกัน',   sub: 'คิดเงินและส่งข้อมูลออกใบรับประกันดิจิทัล' },
  'sales-history': { title: 'ประวัติการซื้อขายหน้าร้าน',   sub: 'รายการบิลขาย ข้อมูลผู้ซื้อ และเลขกรมธรรม์ประกันภัย' },
  'claim-request': { title: 'แจ้งเคลมประกัน & ส่งซ่อม',    sub: 'ตรวจสอบสิทธิ์ประกันและเปิดใบงานส่งศูนย์ซ่อม' },
  'imei-search':   { title: 'ค้นหาประวัติ IMEI',          sub: 'ตรวจสอบสถานะและประวัติเครื่อง' },
};

export default function App() {
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
        <div className="sidebar-logo">
          <h1>PhoneShop<br />Inventory</h1>
          <span>IMEI Management System</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(section => (
            <div key={section.section}>
              <div className="nav-section-label">{section.section}</div>
              {section.items.map(item => (
                <button
                  key={item.id}
                  className={`nav-item ${page === item.id ? 'active' : ''}`}
                  onClick={() => {
                    if (item.id !== 'claim-request') setClaimImei('');
                    setPage(item.id);
                  }}
                >
                  {item.label}
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
          <div style={{ fontWeight: 600, marginBottom: 4 }}>v1.0.0</div>
          <div>PhoneShop Management</div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="main-content">
        {/* Topbar */}
        <div className="topbar">
          <div>
            <div className="topbar-title">{pt.title}</div>
            <div className="topbar-subtitle">{pt.sub}</div>
          </div>
        </div>

        {/* Page Body */}
        <div className="page-body">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
