import React, { useState, useEffect, useCallback } from 'react';

// ============================================================
// Sidebar Component
// ============================================================
export function Sidebar({ activePage, onNavigate }) {
  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard ภาพรวม', group: 'หลัก' },
    { id: 'policies', icon: '📋', label: 'รายการกรมธรรม์', group: 'หลัก' },
    { id: 'verify', icon: '🔍', label: 'ตรวจสอบสิทธิ์ IMEI', group: 'หลัก' },
    { id: 'packages', icon: '🛡️', label: 'จัดการแพ็กเกจ', group: 'ตั้งค่า' },
  ];

  const groups = [...new Set(navItems.map(i => i.group))];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🛡️</div>
        <div className="logo-text">
          <span className="logo-title">InsureCore™</span>
          <span className="logo-sub">Policy Engine v1.0</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {groups.map(group => (
          <div key={group}>
            <div className="nav-group-label">{group}</div>
            {navItems.filter(i => i.group === group).map(item => (
              <button
                key={item.id}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">A</div>
          <div className="user-info">
            <div className="user-name">Admin System</div>
            <div className="user-role">Insurance Manager</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ============================================================
// Topbar Component
// ============================================================
export function Topbar({ title }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-badge">
        <span className="dot" />
        API Live
      </div>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
        {time.toLocaleTimeString('th-TH')}
      </span>
    </header>
  );
}

// ============================================================
// Status Badge
// ============================================================
export function StatusBadge({ status }) {
  const map = {
    ACTIVE:      { cls: 'badge-active',  label: '● ACTIVE' },
    EXPIRED:     { cls: 'badge-expired', label: '● EXPIRED' },
    VOID:        { cls: 'badge-void',    label: '● VOID' },
    CLAIMED_OUT: { cls: 'badge-claimed', label: '● CLAIMED OUT' },
  };
  const { cls, label } = map[status] || { cls: 'badge-void', label: status };
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ============================================================
// Toast Notifications
// ============================================================
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  return { toasts, addToast };
}

export function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Modal Component
// ============================================================
export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-in">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// Format helpers
// ============================================================
export function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

export function formatMoney(n) {
  if (n == null) return '-';
  return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2 });
}

export function daysLeft(isoEnd) {
  const diff = new Date(isoEnd) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
