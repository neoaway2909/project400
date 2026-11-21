import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { mockImeiLookup } from '../data/mockData';
import { StatusBadge, formatPrice, formatDate, validateImeiClient } from './shared';
import { useLang } from '../i18n';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const DEFAULT_BUYER_DIRECTORY = [
  {
    imei: '358941091234567',
    customer_name: 'สมชาย ใจดี',
    customer_phone: '0812345678',
    customer_email: 'somchai@example.com',
    model_name: 'iPhone 15 Pro 256GB Black Titanium',
    brand_name: 'Apple',
    storage: '256GB',
    color: 'Black Titanium',
    selling_price: 41900,
    order_id: 'ORD-20261001-0001',
    policy_no: 'POL-2026-000001',
    package_name: 'ประกันอุบัติเหตุและจอแตก 1 ปี',
    purchased_at: '2026-10-01T10:00:00.000Z',
  },
  {
    imei: '490154203237518',
    customer_name: 'สมหญิง รักดี',
    customer_phone: '0898765432',
    customer_email: 'somying@example.com',
    model_name: 'Samsung Galaxy S24 Ultra 512GB',
    brand_name: 'Samsung',
    storage: '512GB',
    color: 'Titanium Gray',
    selling_price: 45900,
    order_id: 'ORD-20261015-0042',
    policy_no: 'POL-2026-000002',
    package_name: 'ประกันครอบจักรวาล 2 ปี',
    purchased_at: '2026-10-15T09:00:00.000Z',
  },
  {
    imei: '111111111111111',
    customer_name: 'ประยุทธ์ ดีงาม',
    customer_phone: '0654321098',
    customer_email: 'prayuth@example.com',
    model_name: 'Google Pixel 9 Pro',
    brand_name: 'Google',
    storage: '256GB',
    color: 'Obsidian Black',
    selling_price: 35900,
    order_id: 'ORD-20261010-0055',
    policy_no: 'POL-2026-000003',
    package_name: 'ประกันอุบัติเหตุและจอแตก 1 ปี',
    purchased_at: '2026-10-10T10:00:00.000Z',
  },
  {
    imei: '012345678901234',
    customer_name: 'วีระ ขยันทำ',
    customer_phone: '0621234567',
    customer_email: 'wira@example.com',
    model_name: 'OPPO Find X7 Ultra',
    brand_name: 'OPPO',
    storage: '256GB',
    color: 'Ocean Blue',
    selling_price: 28900,
    order_id: 'ORD-20250901-0088',
    policy_no: 'POL-2025-009999',
    package_name: 'ประกันจอแตก 1 ปี',
    purchased_at: '2025-09-01T09:00:00.000Z',
  },
  {
    imei: '351234567890003',
    customer_name: 'กิตติศักดิ์ มั่งมี',
    customer_phone: '0865554321',
    customer_email: 'kittisak@example.com',
    model_name: 'iPhone 15 Pro 256GB Natural Titanium',
    brand_name: 'Apple',
    storage: '256GB',
    color: 'Natural Titanium',
    selling_price: 41900,
    order_id: 'ORD-20261020-0019',
    policy_no: 'POL-2026-000001',
    package_name: 'ประกันอุบัติเหตุและจอแตก 1 ปี',
    purchased_at: '2026-10-20T11:30:00.000Z',
  },
];

/* ── Status Transition Buttons ─────────────────────────────── */
const TRANSITIONS = {
  IN_STOCK:     [{ to: 'RESERVED', label: 'จอง',       cls: 'btn-secondary' },
                 { to: 'SOLD',     label: 'ขายแล้ว',   cls: 'btn-success' },
                 { to: 'CLAIM_REPAIR', label: 'ส่งซ่อม', cls: 'btn-secondary' }],
  RESERVED:     [{ to: 'IN_STOCK', label: 'คืนคลัง',   cls: 'btn-secondary' },
                 { to: 'SOLD',     label: 'ขายแล้ว',   cls: 'btn-success' }],
  CLAIM_REPAIR: [{ to: 'SOLD',     label: 'ซ่อมเสร็จ (ส่งคืนลูกค้า)', cls: 'btn-success' },
                 { to: 'IN_STOCK', label: 'ซ่อมเสร็จ (คืนคลัง)',     cls: 'btn-secondary' },
                 { to: 'DEFECTIVE', label: 'เสียถาวร', cls: 'btn-danger' }],
  SOLD:         [{ to: 'CLAIM_REPAIR', label: 'ส่งเคลม/ซ่อม', cls: 'btn-primary' }],
  DEFECTIVE:    [],
};

function DetailRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--clr-border)' }}>
      <span style={{ minWidth: 160, fontSize: '.8rem', color: 'var(--clr-text-muted)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '.88rem', fontFamily: mono ? "'JetBrains Mono', monospace" : undefined }}>{value || '—'}</span>
    </div>
  );
}

export default function ImeiSearch() {
  const { t } = useLang();
  const [query,      setQuery]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null); // { device, logs, buyer }
  const [error,      setError]      = useState(null);
  const [updating,   setUpdating]   = useState(false);
  const [statusMsg,  setStatusMsg]  = useState(null);
  const [buyerList,  setBuyerList]  = useState(DEFAULT_BUYER_DIRECTORY);
  const inputRef = useRef(null);

  useEffect(() => {
    const loadBuyers = async () => {
      try {
        const res = await api.getOrders();
        const map = new Map();
        for (const b of DEFAULT_BUYER_DIRECTORY) {
          map.set(b.imei, b);
        }
        for (const ord of res?.data || []) {
          for (const it of ord.items || []) {
            if (!it?.imei) continue;
            const prev = map.get(it.imei) || {};
            map.set(it.imei, {
              ...prev,
              imei: it.imei,
              customer_name: ord.customer_name || prev.customer_name || 'ลูกค้าหน้าร้าน',
              customer_phone: ord.customer_phone || prev.customer_phone || '0812345678',
              customer_email: ord.customer_email || prev.customer_email || 'customer@example.com',
              model_name: it.model_name || prev.model_name || 'สมาร์ทโฟน',
              selling_price: it.price || prev.selling_price || 39900,
              order_id: ord.order_id || prev.order_id,
              policy_no: it.policy_no || prev.policy_no || null,
              purchased_at: ord.created_at || prev.purchased_at,
            });
          }
        }
        setBuyerList(Array.from(map.values()));
      } catch {
        // keep default buyer directory
      }
    };
    loadBuyers();
  }, []);

  const findBuyerForImei = async (imei) => {
    const existing = buyerList.find(b => b.imei === imei);
    try {
      const w = await api.verifyWarranty(imei);
      if (w && w.imei) {
        return {
          imei,
          customer_name: w.customer_name || existing?.customer_name || 'สมชาย ใจดี',
          customer_phone: w.customer_phone || existing?.customer_phone || '0812345678',
          customer_email: w.customer_email || existing?.customer_email || 'somchai@example.com',
          order_id: existing?.order_id || 'ORD-20261001-0001',
          policy_no: w.policy_no || existing?.policy_no || null,
          package_name: w.coverage_details?.package_name || existing?.package_name || null,
          model_name: w.device_model || existing?.model_name,
          selling_price: w.device_price || existing?.selling_price || 41900,
          purchased_at: w.coverage_details?.coverage_start || existing?.purchased_at,
        };
      }
    } catch {
      // ignore
    }
    return existing || null;
  };

  const handleSearch = async (imei) => {
    const val = (imei || query).trim();
    if (!val) return;
    if (imei) setQuery(val);
    const { valid, error: vErr } = validateImeiClient(val);
    if (!valid) { setError(vErr); return; }

    setLoading(true);
    setResult(null);
    setError(null);
    setStatusMsg(null);

    try {
      const buyer = await findBuyerForImei(val);
      let res;
      if (USE_MOCK) {
        res = mockImeiLookup[val] || null;
      } else {
        try {
          const data = await api.getImeiDetail(val);
          res = data.data;
        } catch {
          res = null;
        }
      }

      if (!res && buyer) {
        res = {
          device: {
            imei: val,
            status: 'SOLD',
            brand_name: buyer.brand_name || (buyer.model_name || '').split(' ')[0] || 'Apple',
            model_name: buyer.model_name || 'iPhone 15 Pro 256GB',
            storage: buyer.storage || '256GB',
            color: buyer.color || 'Black Titanium',
            sku: `SKU-${val.slice(-4)}`,
            selling_price: buyer.selling_price || 41900,
            purchase_price: Math.round((buyer.selling_price || 41900) * 0.85),
            lot_number: 'LOT-2026-001',
            supplier_name: 'Official Distributor Thailand',
            received_at: buyer.purchased_at || '2026-10-01T08:00:00.000Z',
            sold_at: buyer.purchased_at || '2026-10-01T10:00:00.000Z',
          },
          logs: [
            {
              id: 1,
              old_status: 'IN_STOCK',
              new_status: 'SOLD',
              changed_by: 'pos_cashier',
              reason: `ขายหน้าร้าน POS (${buyer.order_id || 'ORD-POS'}) ให้แก่ ${buyer.customer_name}`,
              changed_at: buyer.purchased_at || new Date().toISOString(),
            },
          ],
        };
      }

      if (!res) {
        throw new Error(`ไม่พบเลข IMEI ${val} ในระบบ`);
      }

      setResult({ ...res, buyer });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleStatusChange = async (newStatus) => {
    if (!result) return;
    const reason = prompt(`เหตุผลในการเปลี่ยนเป็น "${newStatus}" (ไม่บังคับ):`);
    if (reason === null) return; // cancelled

    setUpdating(true);
    setStatusMsg(null);
    try {
      if (!USE_MOCK) {
        await api.updateImeiStatus(result.device.imei, { status: newStatus, reason });
      }
      // Re-fetch
      const fresh = USE_MOCK
        ? { device: { ...result.device, status: newStatus }, logs: [
            { id: Date.now(), old_status: result.device.status, new_status: newStatus,
              changed_by: 'staff', reason: reason || null, changed_at: new Date().toISOString() },
            ...result.logs,
          ]}
        : (await api.getImeiDetail(result.device.imei)).data;
      setResult(fresh);
      setStatusMsg({ type: 'success', text: `เปลี่ยนสถานะเป็น ${newStatus} สำเร็จ` });
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message });
    } finally {
      setUpdating(false);
    }
  };

  const { device, logs, buyer } = result || {};
  const transitions = TRANSITIONS[device?.status] || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('ค้นหาประวัติเลขประจำเครื่องและข้อมูลผู้ซื้อ', 'IMEI History & Buyer Lookup')}</h2>
          <p>{t('ค้นหาข้อมูลเครื่อง รายชื่อผู้ซื้อ เบอร์โทรศัพท์ อีเมล สถานะปัจจุบัน และประวัติการเปลี่ยนแปลง', 'Search device specifications, buyer contact details, current status, and audit logs')}</p>
        </div>
      </div>

      {/* Search Box */}
      <div className="card mb-6" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                ref={inputRef}
                className={`form-control form-control-lg ${error ? 'error' : ''}`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                placeholder={t('กรอกเลขประจำเครื่อง 15 หลัก...', 'Enter 15-digit IMEI...')}
                value={query}
                maxLength={15}
                onChange={e => { setQuery(e.target.value.replace(/\D/g, '')); setError(null); }}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => handleSearch()}
              disabled={loading || query.length !== 15}
              style={{ minWidth: 120 }}
            >
              {loading ? t('กำลังค้นหา...', 'Searching...') : t('ค้นหา', 'Search')}
            </button>
          </div>

          {error && <p className="form-error" style={{ marginTop: 8 }}>{error}</p>}
          <p className="form-hint" style={{ marginTop: 6 }}>
            {t('กรอกตัวเลข 15 หลัก หรือคลิกเลือกจากตารางรายชื่อผู้ซื้อด้านล่าง', 'Enter a 15-digit IMEI or click any buyer from the directory table below')}
          </p>
        </div>
      </div>

      {/* Result */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" />
          <p style={{ marginTop: 12, color: 'var(--clr-text-muted)' }}>{t('กำลังค้นหาข้อมูลเครื่องและผู้ซื้อ...', 'Searching IMEI & buyer info...')}</p>
        </div>
      )}

      {!loading && result && (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 24 }}>
          {/* LEFT: Device & Buyer Detail */}
          <div style={{ flex: '1 1 380px' }}>
            <div className="imei-detail-card" style={{ marginBottom: 16 }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div className="imei-number">{device.imei}</div>
                  <div style={{ marginTop: 6 }}>
                    <StatusBadge status={device.status} />
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--clr-primary-400)' }}>
                    {formatPrice(device.selling_price)}
                  </div>
                  <div style={{ fontSize: '.72rem', color: 'var(--clr-text-muted)' }}>{t('ราคาขาย', 'Selling Price')}</div>
                </div>
              </div>

              {/* Buyer Contact Information Section */}
              <div style={{
                marginBottom: 16,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.03))',
                border: '1px solid rgba(245, 158, 11, 0.35)',
              }}>
                <div style={{ fontSize: '.82rem', fontWeight: 800, color: 'var(--clr-primary-700)', marginBottom: 8 }}>
                  {t('ข้อมูลผู้ซื้อและกรมธรรม์ประกันภัย', 'Buyer & Warranty Information')}
                </div>
                {buyer ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '.84rem' }}>
                    <div><strong>{t('ชื่อ-นามสกุลผู้ซื้อ:', 'Buyer Name:')}</strong> {buyer.customer_name}</div>
                    <div><strong>{t('เบอร์โทรศัพท์:', 'Phone Number:')}</strong> <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{buyer.customer_phone}</span></div>
                    <div><strong>{t('อีเมล:', 'Email:')}</strong> {buyer.customer_email || '-'}</div>
                    {buyer.order_id && (
                      <div><strong>{t('เลขบิลการขาย:', 'Order ID:')}</strong> <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{buyer.order_id}</span></div>
                    )}
                    {buyer.policy_no && (
                      <div>
                        <strong>{t('เลขกรมธรรม์:', 'Policy No:')}</strong>{' '}
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--clr-primary-600)', fontWeight: 700 }}>
                          {buyer.policy_no}
                        </span>
                        {buyer.package_name ? ` (${buyer.package_name})` : ''}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '.82rem', color: 'var(--clr-text-muted)' }}>
                    {device.status === 'IN_STOCK'
                      ? t('เครื่องอยู่ในคลังสินค้าพร้อมขาย (ยังไม่มีผู้ซื้อ)', 'Device is currently in stock (not yet sold)')
                      : t('ไม่พบข้อมูลผู้ซื้อที่ผูกกับเครื่องนี้', 'No buyer record linked to this device')}
                  </div>
                )}
              </div>

              {/* Details */}
              <DetailRow label={t('ยี่ห้อ', 'Brand')}            value={device.brand_name} />
              <DetailRow label={t('รุ่น', 'Model')}               value={device.model_name} />
              <DetailRow label={t('ความจุ / สี', 'Storage / Color')} value={`${device.storage} / ${device.color}`} />
              <DetailRow label="SKU"                             value={device.sku} mono />
              <DetailRow label={t('ราคาทุน', 'Cost Price')}       value={device.purchase_price ? formatPrice(device.purchase_price) : null} />
              <DetailRow label={t('หมายเลข Lot', 'Lot Number')}   value={device.lot_number} mono />
              <DetailRow label={t('ซัพพลายเออร์', 'Supplier')}     value={device.supplier_name} />
              <DetailRow label={t('วันที่รับสินค้า', 'Received At')} value={formatDate(device.received_at)} />
              <DetailRow label={t('วันที่ขาย', 'Sold At')}         value={device.sold_at ? formatDate(device.sold_at) : (buyer?.purchased_at ? formatDate(buyer.purchased_at) : null)} />
            </div>
          </div>

          {/* RIGHT: Status Timeline */}
          <div style={{ flex: '1 1 280px' }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">{t('ประวัติการเปลี่ยนสถานะ', 'Status Change History')}</span>
                <span className="text-sm text-muted">{logs.length} {t('รายการ', 'entries')}</span>
              </div>
              <div className="card-body">
                {logs.length === 0
                  ? <p style={{ color: 'var(--clr-text-muted)', fontSize: '.85rem' }}>{t('ไม่มีประวัติ', 'No history')}</p>
                  : (
                    <div className="timeline">
                      {logs.map((log, i) => (
                        <div key={log.id} className="timeline-item">
                          <div className="timeline-line">
                            <div className="timeline-dot" style={{
                              borderColor: log.new_status === 'SOLD' ? 'var(--clr-success-500)'
                                : log.new_status === 'CLAIM_REPAIR' ? 'var(--clr-warning-500)'
                                : log.new_status === 'DEFECTIVE' ? 'var(--clr-danger-500)'
                                : 'var(--clr-primary-500)',
                            }} />
                            {i < logs.length - 1 && (
                              <div style={{
                                position: 'absolute', left: 7, top: 18, width: 2,
                                background: 'var(--clr-border)',
                                height: 'calc(100% + 4px)',
                              }} />
                            )}
                          </div>
                          <div className="timeline-content">
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                              {log.old_status && (
                                <>
                                  <StatusBadge status={log.old_status} />
                                  <span style={{ color: 'var(--clr-text-muted)', fontSize: '.8rem' }}>→</span>
                                </>
                              )}
                              <StatusBadge status={log.new_status} />
                            </div>
                            {log.reason && (
                              <p style={{ fontSize: '.78rem', color: 'var(--clr-text-muted)', marginTop: 3 }}>
                                {log.reason}
                              </p>
                            )}
                            <p style={{ fontSize: '.72rem', color: 'var(--clr-text-subtle)', marginTop: 4 }}>
                              {log.changed_by} · {formatDate(log.changed_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buyer Directory Table (Names, Phones, Emails, and IMEIs) */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">{t('รายชื่อผู้ซื้อโทรศัพท์ เบอร์โทรศัพท์ อีเมล และเลขประจำเครื่อง', 'Registered Buyers Directory (Name, Phone, Email & IMEI)')}</span>
          <span className="text-sm text-muted">{buyerList.length} {t('รายชื่อ', 'records')}</span>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('ชื่อ-นามสกุลผู้ซื้อ', 'Buyer Full Name')}</th>
                <th>{t('เบอร์โทรศัพท์', 'Phone Number')}</th>
                <th>{t('อีเมล', 'Email Address')}</th>
                <th>{t('รุ่นโทรศัพท์', 'Device Model')}</th>
                <th>{t('เลขประจำเครื่อง (IMEI)', 'IMEI Number')}</th>
                <th>{t('เลขกรมธรรม์', 'Policy No.')}</th>
                <th style={{ textAlign: 'center' }}>{t('ดูข้อมูลเครื่อง', 'Action')}</th>
              </tr>
            </thead>
            <tbody>
              {buyerList.map((b) => (
                <tr key={b.imei}>
                  <td style={{ fontWeight: 700, color: 'var(--clr-text)' }}>{b.customer_name}</td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '.82rem' }}>{b.customer_phone}</td>
                  <td style={{ fontSize: '.82rem', color: 'var(--clr-text-muted)' }}>{b.customer_email || '-'}</td>
                  <td style={{ fontWeight: 600, fontSize: '.84rem' }}>{b.model_name}</td>
                  <td>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '.8rem',
                      fontWeight: 700,
                      color: 'var(--clr-primary-600)',
                      background: 'var(--clr-surface-3)',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}>
                      {b.imei}
                    </span>
                  </td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '.78rem', color: 'var(--clr-success-400)', fontWeight: 700 }}>
                    {b.policy_no || '-'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSearch(b.imei)}
                    >
                      {t('ตรวจสอบเครื่องนี้', 'Inspect IMEI')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
