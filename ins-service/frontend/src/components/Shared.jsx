import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

const INS_LANG_KEY = 'careshield_lang_v1';

const InsLangContext = createContext({
  lang: 'th',
  setLang: () => {},
  t: (th, en) => th,
});

export function InsLangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem(INS_LANG_KEY) || 'th';
    } catch {
      return 'th';
    }
  });

  const setLang = (next) => {
    setLangState(next);
    try {
      localStorage.setItem(INS_LANG_KEY, next);
    } catch {
      // ignore
    }
  };

  const t = (thText, enText) => (lang === 'en' ? (enText ?? thText) : thText);

  return (
    <InsLangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </InsLangContext.Provider>
  );
}

export function useInsLang() {
  return useContext(InsLangContext);
}

export function CareShieldLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="csLogoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#csLogoGrad)" />
      <path
        d="M24 9L36 14V23.5C36 31.4 30.85 38.2 24 40.5C17.15 38.2 12 31.4 12 23.5V14L24 9Z"
        fill="#ffffff"
        stroke="#78350f"
        strokeWidth="2"
      />
      <path
        d="M19.5 24.5L22.6 27.6L29 21.2"
        stroke="#d97706"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================
// Sidebar Component
// ============================================================
export function Sidebar({ activePage, onNavigate }) {
  const { lang, t } = useInsLang();

  const navItems = [
    { id: 'dashboard', labelTh: 'สรุปภาพรวมระบบ',        labelEn: 'Overview Dashboard', groupTh: 'เมนูหลัก', groupEn: 'Main Menu' },
    { id: 'policies',  labelTh: 'รายการกรมธรรม์',         labelEn: 'Insurance Policies', groupTh: 'เมนูหลัก', groupEn: 'Main Menu' },
    { id: 'repairs',   labelTh: 'จัดการงานเคลมและซ่อม',    labelEn: 'Claims & Repairs',   groupTh: 'เมนูหลัก', groupEn: 'Main Menu' },
    { id: 'verify',    labelTh: 'ตรวจสอบสิทธิ์ความคุ้มครอง', labelEn: 'Verify Coverage',    groupTh: 'เมนูหลัก', groupEn: 'Main Menu' },
    { id: 'packages',  labelTh: 'จัดการแพ็กเกจประกัน',     labelEn: 'Insurance Packages', groupTh: 'การตั้งค่า', groupEn: 'Configuration' },
  ];

  const groups = [...new Set(navItems.map(i => (lang === 'th' ? i.groupTh : i.groupEn)))];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" style={{ padding: '16px 14px 14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
            borderRadius: '14px',
            background: 'linear-gradient(145deg, #111317 0%, #1c1f26 100%)',
            border: '1.5px solid rgba(250, 204, 21, 0.35)',
            boxShadow: '0 8px 20px rgba(15, 23, 42, 0.14)',
            width: '100%',
          }}
        >
          <CareShieldLogo size={40} />
          <div className="logo-text" style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.02em', lineHeight: 1.1, display: 'flex', gap: '2px' }}>
              <strong style={{ color: '#FFE000', WebkitTextFillColor: '#FFE000', fontWeight: 900 }}>CARE</strong>
              <strong style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF', fontWeight: 900 }}>SHIELD</strong>
            </div>
            <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#cbd5e1', WebkitTextFillColor: '#cbd5e1', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t('ระบบบริหารกรมธรรม์ประกันภัย', 'POLICY & CLAIM ENGINE')}
            </div>
          </div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {groups.map(group => (
          <div key={group}>
            <div className="nav-group-label">{group}</div>
            {navItems
              .filter(i => (lang === 'th' ? i.groupTh : i.groupEn) === group)
              .map(item => (
                <button
                  key={item.id}
                  className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                >
                  {lang === 'th' ? item.labelTh : item.labelEn}
                </button>
              ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">A</div>
          <div className="user-info">
            <div className="user-name">{t('ผู้ดูแลระบบประกันภัย', 'System Administrator')}</div>
            <div className="user-role">{t('ผู้จัดการฝ่ายกรมธรรม์', 'Insurance Manager')}</div>
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
  const { lang, setLang, t } = useInsLang();
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '999px',
            padding: '3px',
            gap: '2px',
          }}
        >
          <button
            type="button"
            onClick={() => setLang('th')}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              border: 'none',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              background: lang === 'th' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
              color: lang === 'th' ? '#ffffff' : '#64748b',
            }}
          >
            TH ภาษาไทย
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              border: 'none',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              background: lang === 'en' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
              color: lang === 'en' ? '#ffffff' : '#64748b',
            }}
          >
            EN English
          </button>
        </div>

        <div className="topbar-badge">
          <span className="dot" />
          {t('ระบบออนไลน์', 'API Live')}
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          {time.toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-US')}
        </span>
      </div>
    </header>
  );
}

// ============================================================
// Status Badge
// ============================================================
export function StatusBadge({ status }) {
  const { t } = useInsLang();
  const map = {
    ACTIVE:      { cls: 'badge-active',  label: t('● กำลังคุ้มครอง', '● ACTIVE') },
    EXPIRED:     { cls: 'badge-expired', label: t('● หมดอายุแล้ว', '● EXPIRED') },
    VOID:        { cls: 'badge-void',    label: t('● ยกเลิกสัญญา', '● VOID') },
    CLAIMED_OUT: { cls: 'badge-claimed', label: t('● ใช้สิทธิ์ครบแล้ว', '● CLAIMED OUT') },
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
