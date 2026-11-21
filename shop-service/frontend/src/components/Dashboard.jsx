import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { mockSummary } from '../data/mockData';
import { StatusBadge, formatPrice, LoadingBox, EmptyState } from './shared';
import { useLang } from '../i18n';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/* ── KPI Card ──────────────────────────────────────────── */
function KpiCard({ value, label, colorClass }) {
  return (
    <div className={`kpi-card ${colorClass}`}>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

/* ── Brand summary mini chart (No stock limit cap) ─────── */
function BrandBar({ brand, items, maxBrandStock, t }) {
  const totalInStock = items.reduce((s, r) => s + Number(r.in_stock || 0), 0);
  const totalSold    = items.reduce((s, r) => s + Number(r.sold || 0), 0);
  const stockValue   = items.reduce((s, r) => s + Number(r.in_stock || 0) * Number(r.selling_price || 0), 0);
  const pct          = maxBrandStock > 0 ? Math.max(8, Math.round((totalInStock / maxBrandStock) * 100)) : 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="flex items-center justify-between mb-2" style={{ gap: 8, flexWrap: 'nowrap' }}>
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <span style={{ fontWeight: 700, fontSize: '.86rem', color: 'var(--clr-text)' }}>{brand}</span>
          <span style={{ fontSize: '.72rem', color: 'var(--clr-text-muted)', marginLeft: 6 }}>
            ({t(`ขายแล้ว ${totalSold}`, `Sold: ${totalSold}`)})
          </span>
        </div>
        <span style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--clr-success-400)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {t(`พร้อมขาย ${totalInStock} เครื่อง`, `In Stock: ${totalInStock}`)}
        </span>
      </div>
      <div style={{ height: 8, background: 'var(--clr-surface-3)', borderRadius: 4, overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`, height: '100%',
            background: 'linear-gradient(90deg, var(--clr-primary-500), var(--clr-accent-500))',
            borderRadius: 4,
            transition: 'width 0.8s ease',
          }}
        />
      </div>
      <div style={{ fontSize: '.72rem', color: 'var(--clr-text-muted)', marginTop: 4, textAlign: 'right' }}>
        {t('มูลค่าสต็อกพร้อมขาย:', 'Available Stock Value:')} {formatPrice(stockValue)}
      </div>
    </div>
  );
}

/* ── SVG Donut Chart for Inventory Status ──────────────── */
function InventoryDonutChart({ inStock, sold, claimRepair, t }) {
  const total = Math.max(1, inStock + sold + claimRepair);
  const segments = [
    { label: t('มีในคลัง (พร้อมขาย)', 'In Stock (Ready for Sale)'), count: inStock,     color: '#10b981', pct: Math.round((inStock / total) * 100) },
    { label: t('ขายแล้ว', 'Sold'),                                   count: sold,        color: '#6366f1', pct: Math.round((sold / total) * 100) },
    { label: t('ส่งซ่อม / เคลม', 'In Repair / Warranty Claim'),      count: claimRepair, color: '#f59e0b', pct: Math.round((claimRepair / total) * 100) },
  ];

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', justifyContent: 'center', padding: '8px 0' }}>
      <div style={{ position: 'relative', width: 156, height: 156 }}>
        <svg width="156" height="156" viewBox="0 0 156 156" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="78" cy="78" r={radius} fill="none" stroke="var(--clr-surface-3)" strokeWidth="18" />
          {segments.map((seg, i) => {
            const frac = seg.count / total;
            const dash = frac * circumference;
            const offset = accumulatedAngle * circumference;
            accumulatedAngle += frac;
            return (
              <circle
                key={i}
                cx="78"
                cy="78"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="18"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--clr-text)', lineHeight: 1.1 }}>
            {inStock + sold + claimRepair}
          </div>
          <div style={{ fontSize: '.72rem', color: 'var(--clr-text-muted)' }}>
            {t('เครื่องทั้งหมด', 'Total Units')}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', borderRadius: 8, background: 'var(--clr-surface-2)',
            border: '1px solid var(--clr-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: seg.color, display: 'inline-block' }} />
              <span style={{ fontSize: '.8rem', fontWeight: 600 }}>{seg.label}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--clr-text)' }}>
                {seg.count} {t('เครื่อง', 'units')}
              </span>
              <span style={{ fontSize: '.72rem', color: 'var(--clr-text-muted)', marginLeft: 6 }}>({seg.pct}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Grouped Vertical Bar Chart by Brand ───────────────── */
function BrandComparisonChart({ byBrand, t }) {
  const entries = Object.entries(byBrand).map(([brand, items]) => {
    const inStock = items.reduce((s, r) => s + Number(r.in_stock || 0), 0);
    const sold    = items.reduce((s, r) => s + Number(r.sold || 0), 0);
    const repair  = items.reduce((s, r) => s + Number(r.claim_repair || 0), 0);
    return { brand, inStock, sold, repair };
  });
  const maxVal = Math.max(...entries.flatMap(e => [e.inStock, e.sold, e.repair]), 1);

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginBottom: 12, fontSize: '.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981', display: 'inline-block' }} />
          <span>{t('พร้อมขาย', 'In Stock')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#6366f1', display: 'inline-block' }} />
          <span>{t('ขายแล้ว', 'Sold')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }} />
          <span>{t('ส่งซ่อม', 'In Repair')}</span>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.max(entries.length, 1)}, 1fr)`,
        gap: 16,
        alignItems: 'end',
        height: 170,
        padding: '16px 12px 8px',
        background: 'var(--clr-surface-2)',
        borderRadius: 10,
        border: '1px solid var(--clr-border)',
      }}>
        {entries.map((e) => {
          const hStock  = Math.max(6, Math.round((e.inStock / maxVal) * 110));
          const hSold   = Math.max(6, Math.round((e.sold / maxVal) * 110));
          const hRepair = Math.max(6, Math.round((e.repair / maxVal) * 110));
          return (
            <div key={e.brand} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 125 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontSize: '.68rem', fontWeight: 700, color: '#10b981' }}>{e.inStock}</span>
                  <div style={{ width: 16, height: hStock, background: '#10b981', borderRadius: '4px 4px 0 0' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontSize: '.68rem', fontWeight: 700, color: '#6366f1' }}>{e.sold}</span>
                  <div style={{ width: 16, height: hSold, background: '#6366f1', borderRadius: '4px 4px 0 0' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontSize: '.68rem', fontWeight: 700, color: '#f59e0b' }}>{e.repair}</span>
                  <div style={{ width: 16, height: hRepair, background: '#f59e0b', borderRadius: '4px 4px 0 0' }} />
                </div>
              </div>
              <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--clr-text)' }}>{e.brand}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useLang();
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

  const maxBrandStock = Math.max(
    ...Object.values(byBrand).map(items => items.reduce((s, r) => s + Number(r.in_stock || 0), 0)),
    1
  );

  const totalInventoryValue = breakdown.reduce(
    (s, r) => s + Number(r.in_stock || 0) * Number(r.selling_price || 0),
    0
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>{t('สรุปภาพรวมสต็อกและสถานะคลังสินค้า', 'Inventory Stock & Status Overview')}</h2>
          <p>{t('ภาพรวมสินค้าคงคลัง ยอดขาย และสัดส่วนสต็อกตามยี่ห้อ (ไม่จำกัดเพดานสต็อก)', 'Real-time overview of in-stock devices, sales volume, and brand distribution (no stock cap)')}</p>
        </div>
        <div style={{
          padding: '8px 16px',
          borderRadius: 10,
          background: 'var(--clr-surface)',
          border: '1px solid var(--clr-border)',
          textAlign: 'right',
        }}>
          <div style={{ fontSize: '.72rem', color: 'var(--clr-text-muted)' }}>
            {t('มูลค่าสินค้าพร้อมขายรวม', 'Total Available Stock Value')}
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--clr-success-400)' }}>
            {formatPrice(totalInventoryValue)}
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning mb-4">
          {error}
        </div>
      )}

      {/* KPI Grid */}
      <div className="kpi-grid">
        <KpiCard value={kpis.in_stock}     label={t('มีในคลัง (ไม่จำกัดจำนวน)', 'In Stock (Unlimited Cap)')} colorClass="green"  />
        <KpiCard
          value={kpis.sold}
          label={
            kpis.insured_sold != null
              ? t(
                  `ขายแล้ว (ผูกประกัน ${kpis.insured_sold} · เครื่องเปล่า ${kpis.uninsured_sold || 0})`,
                  `Sold (Insured: ${kpis.insured_sold} · Device Only: ${kpis.uninsured_sold || 0})`
                )
              : t('ขายแล้ว', 'Sold Units')
          }
          colorClass="purple"
        />
        <KpiCard value={kpis.claim_repair} label={t('ส่งซ่อมและเคลม', 'In Repair / Claim')}                 colorClass="yellow" />
        <KpiCard
          value={Number(kpis.in_stock || 0) + Number(kpis.sold || 0) + Number(kpis.claim_repair || 0)}
          label={t('เครื่องในระบบทั้งหมด', 'Total Devices in System')}
          colorClass="blue"
        />
      </div>

      {/* Visual Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">{t('สัดส่วนสถานะโทรศัพท์ในระบบ', 'Device Status Distribution')}</span>
          </div>
          <div className="card-body">
            <InventoryDonutChart
              inStock={Number(kpis.in_stock || 0)}
              sold={Number(kpis.sold || 0)}
              claimRepair={Number(kpis.claim_repair || 0)}
              t={t}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">{t('กราฟเปรียบเทียบสต็อกและยอดขายตามยี่ห้อ', 'Stock vs Sales Comparison by Brand')}</span>
          </div>
          <div className="card-body">
            <BrandComparisonChart byBrand={byBrand} t={t} />
          </div>
        </div>
      </div>

      <div className="flex gap-4" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Brand Summary */}
        <div className="card" style={{ flex: '0 0 310px' }}>
          <div className="card-header">
            <span className="card-title">{t('สต็อกพร้อมขายตามยี่ห้อ', 'Available Stock by Brand')}</span>
          </div>
          <div className="card-body">
            {Object.entries(byBrand).map(([brand, items]) => (
              <BrandBar key={brand} brand={brand} items={items} maxBrandStock={maxBrandStock} t={t} />
            ))}
          </div>
        </div>

        {/* Inventory Table */}
        <div className="card" style={{ flex: 1, minWidth: 0 }}>
          <div className="card-header">
            <span className="card-title">{t('รายละเอียดสินค้าทุกรุ่น', 'All Product Models Breakdown')}</span>
            <span className="text-sm text-muted">{breakdown.length} {t('รุ่น', 'models')}</span>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('ยี่ห้อ / รุ่น', 'Brand / Model')}</th>
                  <th>{t('ความจุ / สี', 'Storage / Color')}</th>
                  <th>{t('ราคาขาย', 'Selling Price')}</th>
                  <th>{t('มีในคลัง', 'In Stock')}</th>
                  <th>{t('ขายแล้ว', 'Sold')}</th>
                  <th>{t('ส่งซ่อม', 'In Repair')}</th>
                  <th>{t('รวมทั้งหมด', 'Total')}</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.length === 0
                  ? <tr><td colSpan={7}><EmptyState text="ไม่มีข้อมูลสินค้า" /></td></tr>
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
                      <td><span style={{ color: 'var(--clr-text-muted)' }}>{row.sold}</span></td>
                      <td><span style={{ color: 'var(--clr-warning-400)' }}>{row.claim_repair}</span></td>
                      <td style={{ fontWeight: 600 }}>
                        {Number(row.in_stock || 0) + Number(row.sold || 0) + Number(row.claim_repair || 0)}
                      </td>
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
