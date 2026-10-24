import { useState, useRef } from 'react';
import { api } from '../api/client';
import { mockImeiLookup } from '../data/mockData';
import { StatusBadge, formatPrice, formatDate, validateImeiClient } from './shared';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/* ── Status Transition Buttons ─────────────────────────────── */
const TRANSITIONS = {
  IN_STOCK:     [{ to: 'RESERVED', label: 'จอง',       icon: '🔒', cls: 'btn-secondary' },
                 { to: 'SOLD',     label: 'ขายแล้ว',   icon: '✅', cls: 'btn-success' },
                 { to: 'CLAIM_REPAIR', label: 'ส่งซ่อม', icon: '🔧', cls: 'btn-secondary' }],
  RESERVED:     [{ to: 'IN_STOCK', label: 'คืนคลัง',   icon: '↩️', cls: 'btn-secondary' },
                 { to: 'SOLD',     label: 'ขายแล้ว',   icon: '✅', cls: 'btn-success' }],
  CLAIM_REPAIR: [{ to: 'IN_STOCK', label: 'ซ่อมเสร็จ', icon: '✔️', cls: 'btn-success' },
                 { to: 'DEFECTIVE', label: 'เสียถาวร', icon: '❌', cls: 'btn-danger' }],
  SOLD:         [],
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
  const [query,      setQuery]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null); // { device, logs }
  const [error,      setError]      = useState(null);
  const [updating,   setUpdating]   = useState(false);
  const [statusMsg,  setStatusMsg]  = useState(null);
  const inputRef = useRef(null);

  const handleSearch = async (imei) => {
    const val = (imei || query).trim();
    if (!val) return;
    const { valid, error: vErr } = validateImeiClient(val);
    if (!valid) { setError(vErr); return; }

    setLoading(true);
    setResult(null);
    setError(null);
    setStatusMsg(null);

    try {
      let res;
      if (USE_MOCK) {
        res = mockImeiLookup[val] || null;
        if (!res) throw new Error(`ไม่พบ IMEI ${val} ในระบบ`);
      } else {
        const data = await api.getImeiDetail(val);
        res = data.data;
      }
      setResult(res);
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
      setStatusMsg({ type: 'success', text: `✅ เปลี่ยนสถานะเป็น ${newStatus} สำเร็จ` });
    } catch (e) {
      setStatusMsg({ type: 'error', text: `❌ ${e.message}` });
    } finally {
      setUpdating(false);
    }
  };

  const { device, logs } = result || {};
  const transitions = TRANSITIONS[device?.status] || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>🔍 ค้นหาประวัติ IMEI</h2>
          <p>ค้นหาข้อมูลเครื่อง สถานะปัจจุบัน และประวัติการเปลี่ยนแปลง</p>
        </div>
      </div>

      {/* Search Box */}
      <div className="card mb-6" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                fontSize: '1.2rem', pointerEvents: 'none',
              }}>🔍</span>
              <input
                ref={inputRef}
                className={`form-control form-control-lg ${error ? 'error' : ''}`}
                style={{ paddingLeft: 46, fontFamily: "'JetBrains Mono', monospace" }}
                placeholder="กรอกเลข IMEI 15 หลัก..."
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
              {loading ? '⏳' : '🔍 ค้นหา'}
            </button>
          </div>

          {error && <p className="form-error" style={{ marginTop: 8 }}>⚠️ {error}</p>}
          <p className="form-hint" style={{ marginTop: 6 }}>
            กรอกตัวเลข IMEI 15 หลัก แล้วกด Enter หรือคลิก "ค้นหา" — ลอง: <code style={{ fontSize: '.78rem', background: 'var(--clr-surface-3)', padding: '1px 6px', borderRadius: 4 }}>351234567890001</code>
          </p>
        </div>
      </div>

      {/* Result */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" />
          <p style={{ marginTop: 12, color: 'var(--clr-text-muted)' }}>กำลังค้นหา IMEI...</p>
        </div>
      )}

      {!loading && result && (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* LEFT: Device Detail */}
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
                  <div style={{ fontSize: '.72rem', color: 'var(--clr-text-muted)' }}>ราคาขาย</div>
                </div>
              </div>

              {/* Details */}
              <DetailRow label="ยี่ห้อ"          value={device.brand_name} />
              <DetailRow label="รุ่น"             value={device.model_name} />
              <DetailRow label="ความจุ / สี"      value={`${device.storage} / ${device.color}`} />
              <DetailRow label="SKU"              value={device.sku} mono />
              <DetailRow label="ราคาทุน"          value={device.purchase_price ? formatPrice(device.purchase_price) : null} />
              <DetailRow label="หมายเลข Lot"      value={device.lot_number} mono />
              <DetailRow label="ซัพพลายเออร์"    value={device.supplier_name} />
              <DetailRow label="วันที่รับสินค้า"  value={formatDate(device.received_at)} />
              <DetailRow label="วันที่ขาย"        value={device.sold_at ? formatDate(device.sold_at) : null} />
            </div>

            {/* Status Actions */}
            {transitions.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">เปลี่ยนสถานะ</span>
                </div>
                <div className="card-body">
                  {statusMsg && (
                    <div className={`alert alert-${statusMsg.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 14 }}>
                      {statusMsg.text}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {transitions.map(t => (
                      <button
                        key={t.to}
                        className={`btn ${t.cls}`}
                        onClick={() => handleStatusChange(t.to)}
                        disabled={updating}
                      >
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Status Timeline */}
          <div style={{ flex: '1 1 280px' }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">ประวัติการเปลี่ยนสถานะ</span>
                <span className="text-sm text-muted">{logs.length} รายการ</span>
              </div>
              <div className="card-body">
                {logs.length === 0
                  ? <p style={{ color: 'var(--clr-text-muted)', fontSize: '.85rem' }}>ไม่มีประวัติ</p>
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
                                📝 {log.reason}
                              </p>
                            )}
                            <p style={{ fontSize: '.72rem', color: 'var(--clr-text-subtle)', marginTop: 4 }}>
                              👤 {log.changed_by} · {formatDate(log.changed_at)}
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
    </div>
  );
}
