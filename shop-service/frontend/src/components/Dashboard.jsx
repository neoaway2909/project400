import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { mockSummary } from '../data/mockData';
import { StatusBadge, formatPrice, LoadingBox, EmptyState } from './shared';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/* ── KPI Card ──────────────────────────────────────────── */
function KpiCard({ icon, value, label, colorClass }) {
  return (
    <div className={`kpi-card ${colorClass}`}>
      <span className="kpi-icon">{icon}</span>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

/* ── Brand summary mini chart ──────────────────────────── */
function BrandBar({ brand, items }) {
  const totalInStock = items.reduce((s, r) => s + Number(r.in_stock || 0), 0);
  const totalAll     = items.reduce((s, r) => s + Number(r.total   || 0), 0);
  const pct          = totalAll > 0 ? Math.round((totalInStock / totalAll) * 100) : 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontWeight: 600, fontSize: '.85rem' }}>{brand}</span>
        <span style={{ fontSize: '.8rem', color: 'var(--clr-text-muted)' }}>
          {totalInStock}/{totalAll} เครื่อง
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--clr-surface-3)', borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`, height: '100%',
            background: 'linear-gradient(90deg, var(--clr-primary-500), var(--clr-accent-500))',
            borderRadius: 3,
            transition: 'width 1s var(--ease-out)',
          }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = USE_MOCK ? { data: mockSummary } : await api.getSummary();
        setData(res.data);
      } catch (e) {
        // Fallback to mock
        setData(mockSummary);
        setError('ไม่สามารถเชื่อมต่อ API – แสดงข้อมูลตัวอย่าง');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingBox text="กำลังโหลดข้อมูล Dashboard..." />;

  const { kpis, breakdown } = data;

  // Group breakdown by brand
  const byBrand = breakdown.reduce((acc, row) => {
    if (!acc[row.brand_name]) acc[row.brand_name] = [];
    acc[row.brand_name].push(row);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>📊 Dashboard สรุปสต็อก</h2>
          <p>ภาพรวมสินค้าคงคลังทั้งหมดในระบบ</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning mb-4">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* KPI Grid */}
      <div className="kpi-grid">
        <KpiCard icon="📱" value={kpis.in_stock}     label="มีในคลัง"   colorClass="green"  />
        <KpiCard icon="🔒" value={kpis.reserved}     label="จองแล้ว"   colorClass="blue"   />
        <KpiCard icon="✅" value={kpis.sold}         label="ขายแล้ว"   colorClass="purple" />
        <KpiCard icon="🔧" value={kpis.claim_repair} label="ส่งซ่อม"   colorClass="yellow" />
        <KpiCard icon="❌" value={kpis.defective}    label="เสียหาย"   colorClass="red"    />
        <KpiCard icon="📦" value={kpis.total}        label="ทั้งหมด"   colorClass="blue"   />
      </div>

      <div className="flex gap-4" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Brand Summary */}
        <div className="card" style={{ flex: '0 0 280px' }}>
          <div className="card-header">
            <span className="card-title">สต็อกตามยี่ห้อ</span>
          </div>
          <div className="card-body">
            {Object.entries(byBrand).map(([brand, items]) => (
              <BrandBar key={brand} brand={brand} items={items} />
            ))}
          </div>
        </div>

        {/* Inventory Table */}
        <div className="card" style={{ flex: 1, minWidth: 0 }}>
          <div className="card-header">
            <span className="card-title">รายละเอียดสินค้าทุกรุ่น</span>
            <span className="text-sm text-muted">{breakdown.length} รุ่น</span>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ยี่ห้อ / รุ่น</th>
                  <th>ความจุ / สี</th>
                  <th>ราคา</th>
                  <th>มีในคลัง</th>
                  <th>จอง</th>
                  <th>ขายแล้ว</th>
                  <th>ซ่อม</th>
                  <th>รวม</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.length === 0
                  ? <tr><td colSpan={8}><EmptyState text="ไม่มีข้อมูลสินค้า" /></td></tr>
                  : breakdown.map((row, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{row.model_name}</div>
                        <div style={{ fontSize: '.75rem', color: 'var(--clr-primary-400)' }}>{row.brand_name}</div>
                      </td>
                      <td>
                        <div className="text-sm">{row.storage}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--clr-text-muted)' }}>{row.color}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--clr-primary-400)' }}>
                        {formatPrice(row.selling_price)}
                      </td>
                      <td>
                        <span style={{ color: 'var(--clr-success-400)', fontWeight: 700 }}>{row.in_stock}</span>
                      </td>
                      <td><span style={{ color: 'var(--clr-info-400)' }}>{row.reserved}</span></td>
                      <td><span style={{ color: 'var(--clr-text-muted)' }}>{row.sold}</span></td>
                      <td><span style={{ color: 'var(--clr-warning-400)' }}>{row.claim_repair}</span></td>
                      <td style={{ fontWeight: 600 }}>{row.total}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
