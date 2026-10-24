import { useState } from 'react';
import Dashboard      from './components/Dashboard';
import ReceiveStock   from './components/ReceiveStock';
import ImeiSearch     from './components/ImeiSearch';
import AvailableStock from './components/AvailableStock';
import Checkout from './pages/Checkout';

const NAV = [
  {
    section: 'ภาพรวม',
    items: [
      { id: 'dashboard',  label: 'Dashboard สต็อก', icon: '📊' },
    ],
  },
  {
    section: 'จัดการสต็อก',
    items: [
      { id: 'receive',    label: 'รับเครื่องเข้าคลัง', icon: '📥' },
      { id: 'available',  label: 'สินค้าพร้อมขาย',    icon: '🏪' },
    ],
  },
  {
    section: 'ค้นหา',
    items: [
      { id: 'imei-search', label: 'ค้นหา IMEI',    icon: '🔍' },
    ],
  },
  { section: 'ขายหน้าร้าน', items: [ { id: 'checkout', label: 'POS Checkout', icon: '🛒' } ] },
];

const PAGE_TITLES = {
  dashboard:   { title: 'Inventory Dashboard',    sub: 'ภาพรวมสต็อกโทรศัพท์ทั้งหมด' },
  receive:     { title: 'รับเครื่องเข้าคลัง',     sub: 'สแกน IMEI เพื่อเพิ่มสต็อก' },
  available:   { title: 'สินค้าพร้อมขาย',         sub: 'โทรศัพท์สถานะ IN_STOCK' },
  'imei-search': { title: 'ค้นหาประวัติ IMEI',  sub: 'ตรวจสอบสถานะและประวัติเครื่อง' },
  checkout:    { title: 'POS Checkout',        sub: 'ขายหน้าร้านและออกใบรับประกัน' },
};

function renderPage(page) {
  switch (page) {
    case 'dashboard':   return <Dashboard />;
    case 'receive':     return <ReceiveStock />;
    case 'available':   return <AvailableStock />;
    case 'imei-search': return <ImeiSearch />;
    case 'checkout':    return <Checkout />;
    default:            return <Dashboard />;
  }
}

export default function App() {
  const [page, setPage] = useState('dashboard');
  const pt = PAGE_TITLES[page] || PAGE_TITLES.dashboard;

  return (
    <div className="app-layout">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>📱 PhoneShop<br />Inventory</h1>
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
                  onClick={() => setPage(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
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
          <div className="topbar-right">
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--clr-primary-600), var(--clr-accent-600))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.8rem', fontWeight: 700,
            }}>
              SA
            </div>
          </div>
        </div>

        {/* Page Body */}
        <div className="page-body">
          {renderPage(page)}
        </div>
      </main>
    </div>
  );
}
