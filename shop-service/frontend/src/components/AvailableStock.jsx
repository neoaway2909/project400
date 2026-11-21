import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { mockAvailableStock } from '../data/mockData';
import { formatPrice, LoadingBox, EmptyState } from './shared';
import { useLang } from '../i18n';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const BRAND_COLORS = {
  Apple:   '#6366f1',
  Samsung: '#3b82f6',
  Xiaomi:  '#f59e0b',
  OPPO:    '#10b981',
  vivo:    '#8b5cf6',
};

function resolvePhoneColorTheme(colorName = '') {
  const c = String(colorName).toLowerCase();

  if (c.includes('black') || c.includes('midnight') || c.includes('ดำ') || c.includes('graphite')) {
    return {
      swatch: 'linear-gradient(135deg, #334155, #0f172a)',
      accent: '#1e293b',
      border: '#94a3b8',
      cardBg: 'linear-gradient(180deg, #f1f5f9 0%, #ffffff 55%)',
      pillBg: '#1e293b',
      pillText: '#f8fafc',
    };
  }
  if (c.includes('natural') || c.includes('stone') || c.includes('sand')) {
    return {
      swatch: 'linear-gradient(135deg, #d6d3d1, #78716c)',
      accent: '#78716c',
      border: '#d6d3d1',
      cardBg: 'linear-gradient(180deg, #f5f5f4 0%, #ffffff 55%)',
      pillBg: '#e7e5e4',
      pillText: '#44403c',
    };
  }
  if (c.includes('desert') || c.includes('gold') || c.includes('bronze') || c.includes('ทอง')) {
    return {
      swatch: 'linear-gradient(135deg, #fcd34d, #b45309)',
      accent: '#d97706',
      border: '#fde68a',
      cardBg: 'linear-gradient(180deg, #fffbeb 0%, #ffffff 55%)',
      pillBg: '#fef3c7',
      pillText: '#92400e',
    };
  }
  if (c.includes('white') || c.includes('silver') || c.includes('starlight') || c.includes('ขาว') || c.includes('เงิน')) {
    return {
      swatch: 'linear-gradient(135deg, #ffffff, #cbd5e1)',
      accent: '#64748b',
      border: '#cbd5e1',
      cardBg: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 60%)',
      pillBg: '#f1f5f9',
      pillText: '#334155',
    };
  }
  if (c.includes('violet') || c.includes('purple') || c.includes('lavender') || c.includes('ม่วง')) {
    return {
      swatch: 'linear-gradient(135deg, #a78bfa, #6d28d9)',
      accent: '#7c3aed',
      border: '#ddd6fe',
      cardBg: 'linear-gradient(180deg, #f5f3ff 0%, #ffffff 55%)',
      pillBg: '#ede9fe',
      pillText: '#5b21b6',
    };
  }
  if (c.includes('blue') || c.includes('navy') || c.includes('cyan') || c.includes('ฟ้า') || c.includes('น้ำเงิน')) {
    return {
      swatch: 'linear-gradient(135deg, #60a5fa, #1d4ed8)',
      accent: '#2563eb',
      border: '#bfdbfe',
      cardBg: 'linear-gradient(180deg, #eff6ff 0%, #ffffff 55%)',
      pillBg: '#dbeafe',
      pillText: '#1e40af',
    };
  }
  if (c.includes('green') || c.includes('emerald') || c.includes('mint') || c.includes('เขียว')) {
    return {
      swatch: 'linear-gradient(135deg, #34d399, #047857)',
      accent: '#059669',
      border: '#a7f3d0',
      cardBg: 'linear-gradient(180deg, #ecfdf5 0%, #ffffff 55%)',
      pillBg: '#d1fae5',
      pillText: '#065f46',
    };
  }
  if (c.includes('yellow') || c.includes('amber') || c.includes('เหลือง')) {
    return {
      swatch: 'linear-gradient(135deg, #fde047, #ca8a04)',
      accent: '#ca8a04',
      border: '#fef08a',
      cardBg: 'linear-gradient(180deg, #fefce8 0%, #ffffff 55%)',
      pillBg: '#fef9c3',
      pillText: '#854d0e',
    };
  }
  if (c.includes('pink') || c.includes('rose') || c.includes('ชมพู')) {
    return {
      swatch: 'linear-gradient(135deg, #f472b6, #be185d)',
      accent: '#db2777',
      border: '#fbcfe8',
      cardBg: 'linear-gradient(180deg, #fdf2f8 0%, #ffffff 55%)',
      pillBg: '#fce7f3',
      pillText: '#9d174d',
    };
  }
  if (c.includes('red') || c.includes('crimson') || c.includes('แดง')) {
    return {
      swatch: 'linear-gradient(135deg, #f87171, #b91c1c)',
      accent: '#dc2626',
      border: '#fecaca',
      cardBg: 'linear-gradient(180deg, #fef2f2 0%, #ffffff 55%)',
      pillBg: '#fee2e2',
      pillText: '#991b1b',
    };
  }
  if (c.includes('gray') || c.includes('grey') || c.includes('titanium') || c.includes('เทา')) {
    return {
      swatch: 'linear-gradient(135deg, #94a3b8, #475569)',
      accent: '#475569',
      border: '#cbd5e1',
      cardBg: 'linear-gradient(180deg, #f1f5f9 0%, #ffffff 55%)',
      pillBg: '#e2e8f0',
      pillText: '#1e293b',
    };
  }

  return {
    swatch: 'linear-gradient(135deg, #fbbf24, #d97706)',
    accent: '#d97706',
    border: '#fde68a',
    cardBg: 'linear-gradient(180deg, #fffdf5 0%, #ffffff 55%)',
    pillBg: '#fef3c7',
    pillText: '#92400e',
  };
}

function StockCard({ item, t }) {
  const brandColor = BRAND_COLORS[item.brand_name] || 'var(--clr-primary-500)';
  const theme = resolvePhoneColorTheme(item.color);

  return (
    <div
      className="stock-card"
      style={{
        background: theme.cardBg,
        border: `1.5px solid ${theme.border}`,
        borderTop: `6px solid ${theme.accent}`,
        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="stock-card-brand" style={{ color: brandColor }}>{item.brand_name}</span>
        <span
          className="badge in-stock"
          style={{ fontSize: '.72rem' }}
        >
          {item.in_stock_count} {t('เครื่อง', 'units')}
        </span>
      </div>

      <div className="stock-card-model">{item.model_name}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 2, marginBottom: 4 }}>
        <span style={{
          fontSize: '.76rem',
          fontWeight: 700,
          color: 'var(--clr-text-muted)',
          background: 'rgba(255,255,255,0.8)',
          border: '1px solid var(--clr-border)',
          padding: '2px 8px',
          borderRadius: 6,
        }}>
          {item.storage}
        </span>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 10px',
          borderRadius: 999,
          background: theme.pillBg,
          color: theme.pillText,
          border: `1px solid ${theme.border}`,
          fontSize: '.75rem',
          fontWeight: 700,
        }}>
          <span style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: theme.swatch,
            border: '1.5px solid rgba(15,23,42,0.2)',
            display: 'inline-block',
            flexShrink: 0,
          }} />
          <span>{item.color}</span>
        </span>
      </div>
      { item.sku && (
        <div style={{ fontSize: '.68rem', color: 'var(--clr-text-subtle)', fontFamily: "'JetBrains Mono', monospace" }}>
          {item.sku}
        </div>
      )}
      {Array.isArray(item.available_imeis) && item.available_imeis.length > 0 && (
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: '.68rem', color: 'var(--clr-text-muted)', fontWeight: 600 }}>
            {t('เลขประจำเครื่องพร้อมขาย:', 'Available IMEIs:')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {item.available_imeis.map(imei => (
              <span
                key={imei}
                style={{
                  fontSize: '.68rem',
                  fontFamily: "'JetBrains Mono', monospace",
                  background: 'var(--clr-surface-2)',
                  border: '1px solid var(--clr-border)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  color: 'var(--clr-text)',
                }}
              >
                {imei}
              </span>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8 }}>
        <div className="stock-card-price">{formatPrice(item.selling_price)}</div>
      </div>
    </div>
  );
}

export default function AvailableStock() {
  const { t } = useLang();
  const [stock,   setStock]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [brand,   setBrand]   = useState('');
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = USE_MOCK
          ? { data: mockAvailableStock }
          : await api.getAvailableStock();
        setStock(res.data || []);
      } catch {
        setStock(mockAvailableStock);
        setError('ไม่สามารถเชื่อมต่อ API – แสดงข้อมูลตัวอย่าง');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const brands = [...new Set(stock.map(s => s.brand_name))];

  const filtered = stock.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || s.model_name.toLowerCase().includes(q)
      || s.brand_name.toLowerCase().includes(q)
      || s.color.toLowerCase().includes(q)
      || (s.sku || '').toLowerCase().includes(q);
    const matchBrand = !brand || s.brand_name === brand;
    return matchSearch && matchBrand;
  });

  const totalInStock = filtered.reduce((s, r) => s + r.in_stock_count, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('สินค้าพร้อมขายในคลัง', 'Available Stock')}</h2>
          <p>{t('รายการโทรศัพท์มือถือที่พร้อมจำหน่ายหน้าร้าน', 'Smartphones in stock ready for retail POS checkout')}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--clr-success-400)' }}>{totalInStock}</div>
          <div style={{ fontSize: '.75rem', color: 'var(--clr-text-muted)' }}>{t('เครื่องทั้งหมด', 'Total Units')}</div>
        </div>
      </div>

      {error && <div className="alert alert-warning mb-4">{error}</div>}

      {/* Filters */}
      <div className="flex gap-3 mb-6" style={{ flexWrap: 'wrap', marginBottom: 24 }}>
        <input
          className="form-control"
          style={{ maxWidth: 280 }}
          placeholder={t('ค้นหารุ่น, ยี่ห้อ, สี...', 'Search model, brand, color...')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="form-control" style={{ maxWidth: 180 }} value={brand} onChange={e => setBrand(e.target.value)}>
          <option value="">{t('ทุกยี่ห้อ', 'All Brands')}</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <span style={{ fontSize: '.85rem', color: 'var(--clr-text-muted)', alignSelf: 'center' }}>
          {filtered.length} {t('รุ่น', 'models')}
        </span>
      </div>

      {loading && <LoadingBox text={t('กำลังโหลดสินค้า...', 'Loading inventory...')} />}

      {!loading && filtered.length === 0 && (
        <EmptyState text={t('ไม่พบสินค้าที่ตรงกับเงื่อนไข', 'No matching products found')} />
      )}

      {!loading && filtered.length > 0 && (
        <div className="stock-grid">
          {filtered.map(item => <StockCard key={item.model_id} item={item} t={t} />)}
        </div>
      )}
    </div>
  );
}
