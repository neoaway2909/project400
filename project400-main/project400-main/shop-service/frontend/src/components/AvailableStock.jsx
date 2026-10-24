import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { mockAvailableStock } from '../data/mockData';
import { formatPrice, LoadingBox, EmptyState } from './shared';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const BRAND_COLORS = {
  Apple:   '#6366f1',
  Samsung: '#3b82f6',
  Xiaomi:  '#f59e0b',
  OPPO:    '#10b981',
  vivo:    '#8b5cf6',
};

function StockCard({ item }) {
  const accentColor = BRAND_COLORS[item.brand_name] || 'var(--clr-primary-500)';
  return (
    <div className="stock-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="stock-card-brand" style={{ color: accentColor }}>{item.brand_name}</span>
        <span
          className="badge in-stock"
          style={{ fontSize: '.72rem' }}
        >
          {item.in_stock_count} เครื่อง
        </span>
      </div>
      <div className="stock-card-model">{item.model_name}</div>
      <div className="stock-card-spec">{item.storage} · {item.color}</div>
      {item.sku && (
        <div style={{ fontSize: '.68rem', color: 'var(--clr-text-subtle)', fontFamily: "'JetBrains Mono', monospace" }}>
          {item.sku}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8 }}>
        <div className="stock-card-price">{formatPrice(item.selling_price)}</div>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: `${accentColor}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem',
        }}>
          📱
        </div>
      </div>
    </div>
  );
}

export default function AvailableStock() {
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
          <h2>🏪 สินค้าพร้อมขาย (IN_STOCK)</h2>
          <p>รายการโทรศัพท์ที่พร้อมขาย สำหรับระบบ POS</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--clr-success-400)' }}>{totalInStock}</div>
          <div style={{ fontSize: '.75rem', color: 'var(--clr-text-muted)' }}>เครื่องทั้งหมด</div>
        </div>
      </div>

      {error && <div className="alert alert-warning mb-4">⚠️ {error}</div>}

      {/* Filters */}
      <div className="flex gap-3 mb-6" style={{ flexWrap: 'wrap', marginBottom: 24 }}>
        <input
          className="form-control"
          style={{ maxWidth: 280 }}
          placeholder="🔍 ค้นหารุ่น, ยี่ห้อ, สี..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="form-control" style={{ maxWidth: 180 }} value={brand} onChange={e => setBrand(e.target.value)}>
          <option value="">ทุกยี่ห้อ</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <span style={{ fontSize: '.85rem', color: 'var(--clr-text-muted)', alignSelf: 'center' }}>
          {filtered.length} รุ่น
        </span>
      </div>

      {loading && <LoadingBox text="กำลังโหลดสินค้า..." />}

      {!loading && filtered.length === 0 && (
        <EmptyState icon="📱" text="ไม่พบสินค้าที่ตรงกับเงื่อนไข" />
      )}

      {!loading && filtered.length > 0 && (
        <div className="stock-grid">
          {filtered.map(item => <StockCard key={item.model_id} item={item} />)}
        </div>
      )}
    </div>
  );
}
