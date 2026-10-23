import React, { useEffect, useState } from 'react';
import { fetchPolicies } from '../services/api';
import { StatusBadge, formatDate, formatMoney, daysLeft } from './Shared';

// ============================================================
// Policies List Page
// ============================================================
export default function PoliciesPage() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await fetchPolicies({ search, status: statusFilter });
    setData(res);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  return (
    <div className="page-content fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-heading">รายการกรมธรรม์</h2>
          <p className="page-subheading">ค้นหาและจัดการกรมธรรม์ทั้งหมดในระบบ</p>
        </div>
        <span style={{
          padding: '6px 14px', borderRadius: 'var(--radius-full)',
          background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
          color: 'var(--accent-blue)', fontSize: '12px', fontWeight: 700
        }}>
          ทั้งหมด {data.total} รายการ
        </span>
      </div>

      {/* Filters */}
      <div className="card mb-lg" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-box" style={{ flex: 1, minWidth: '220px' }}>
            <span className="search-icon">🔍</span>
            <input
              className="form-input"
              placeholder="ค้นหา Policy No, IMEI, ชื่อลูกค้า, รุ่นเครื่อง..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-input form-select"
            style={{ width: '160px' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">ทุกสถานะ</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="VOID">VOID</option>
            <option value="CLAIMED_OUT">CLAIMED OUT</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={load}>🔄 รีเฟรช</button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px', width: 36, height: 36 }} />
              <p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Policy No.</th>
                  <th>IMEI</th>
                  <th>ลูกค้า</th>
                  <th>รุ่นเครื่อง</th>
                  <th>แพ็กเกจ</th>
                  <th>วันหมดอายุ</th>
                  <th>วงเงินคงเหลือ</th>
                  <th>สถานะ</th>
                  <th>รายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                      ไม่พบข้อมูลกรมธรรม์
                    </td>
                  </tr>
                ) : data.items.map(p => (
                  <tr key={p.policy_no}>
                    <td><span className="mono text-blue font-bold">{p.policy_no}</span></td>
                    <td><span className="mono text-sm">{p.imei}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.customer_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.customer_phone}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.device_model}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.package_name}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>{formatDate(p.coverage_end)}</div>
                      {p.status === 'ACTIVE' && (
                        <div style={{ fontSize: '10px', color: daysLeft(p.coverage_end) < 30 ? 'var(--accent-yellow)' : 'var(--text-muted)' }}>
                          เหลือ {daysLeft(p.coverage_end)} วัน
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--accent-green)' }}>
                        ฿{formatMoney(p.remaining_claim_amount)}
                      </span>
                    </td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelected(p)}>
                        ดู
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Policy Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal fade-in" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h2 className="modal-title">📋 รายละเอียดกรมธรรม์</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            {/* Policy Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '16px', borderRadius: 'var(--radius-md)',
              background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: 36 }}>🛡️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-blue)' }}>
                  {selected.policy_no}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selected.package_name}</div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            {/* Info Grid */}
            <div className="grid-2" style={{ marginBottom: '16px' }}>
              {[
                ['ลูกค้า', selected.customer_name],
                ['เบอร์โทร', selected.customer_phone],
                ['อีเมล', selected.customer_email || '-'],
                ['ร้านค้า', selected.store_id],
                ['IMEI', selected.imei],
                ['รุ่นเครื่อง', selected.device_model],
                ['ราคาเครื่อง', `฿${formatMoney(selected.device_price)}`],
                ['วันซื้อ', formatDate(selected.purchased_at)],
                ['เริ่มคุ้มครอง', formatDate(selected.coverage_start)],
                ['หมดอายุ', formatDate(selected.coverage_end)],
                ['วงเงินสูงสุด', `฿${formatMoney(selected.max_coverage_amount)}`],
                ['วงเงินคงเหลือ', `฿${formatMoney(selected.remaining_claim_amount)}`],
                ['เคลมแล้ว', `${selected.claim_count} / ${selected.max_claim_count} ครั้ง`],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, wordBreak: 'break-all' }}>{value}</div>
                </div>
              ))}
            </div>

            {selected.e_warranty_url && (
              <a
                href={selected.e_warranty_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                🔗 ดู E-Warranty Card
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
