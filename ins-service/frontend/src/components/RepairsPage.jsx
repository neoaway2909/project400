import React, { useEffect, useState } from 'react';
import { fetchRepairs, updateRepairStatus } from '../services/api';
import { formatDate, formatMoney } from './Shared';

export const REPAIR_STATUS_LABELS = {
  RECEIVED: { label: 'รับเครื่องแล้ว (RECEIVED)', color: '#2563eb', bg: '#dbeafe' },
  DIAGNOSING: { label: 'กำลังตรวจสอบ (DIAGNOSING)', color: '#7c3aed', bg: '#ede9fe' },
  WAITING_PARTS: { label: 'รออะไหล่ (WAITING_PARTS)', color: '#d97706', bg: '#fef3c7' },
  IN_PROGRESS: { label: 'กำลังซ่อม (IN_PROGRESS)', color: '#ea580c', bg: '#ffedd5' },
  REPAIR_COMPLETED: { label: 'ซ่อมเสร็จพร้อมส่งคืน (COMPLETED)', color: '#16a34a', bg: '#dcfce7' },
  DELIVERED: { label: 'ส่งคืนร้านแล้ว (DELIVERED)', color: '#0f766e', bg: '#ccfbf1' },
  CANCELLED: { label: 'ยกเลิกงานซ่อม (CANCELLED)', color: '#dc2626', bg: '#fee2e2' },
};

export function RepairStatusBadge({ status }) {
  const s = REPAIR_STATUS_LABELS[status] || { label: status || '-', color: '#475569', bg: '#f1f5f9' };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      color: s.color,
      background: s.bg,
    }}>
      <span>●</span>
      <span>{s.label}</span>
    </span>
  );
}

export default function RepairsPage({ addToast }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [nextStatus, setNextStatus] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [repairSummary, setRepairSummary] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetchRepairs({ search, status: statusFilter });
    setTickets(res?.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [search, statusFilter]);

  const openModal = (ticket) => {
    setSelectedTicket(ticket);
    setNextStatus(ticket.repair_status || 'IN_PROGRESS');
    setActualCost(ticket.actual_cost != null ? String(ticket.actual_cost) : String(ticket.estimated_cost || ''));
    setRepairSummary(ticket.repair_summary || '');
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !nextStatus) return;
    setSaving(true);
    const res = await updateRepairStatus(selectedTicket.ticket_id, {
      status: nextStatus,
      actual_cost: actualCost !== '' ? Number(actualCost) : undefined,
      repair_summary: repairSummary.trim() || undefined,
    });
    setSaving(false);

    if (res?.success) {
      addToast?.(`อัปเดตสถานะ ${selectedTicket.ticket_id} เป็น ${REPAIR_STATUS_LABELS[nextStatus]?.label || nextStatus} สำเร็จ!`, 'success');
      setSelectedTicket(null);
      load();
    } else {
      addToast?.(`${res?.message || 'ไม่สามารถอัปเดตสถานะได้'}`, 'error');
    }
  };

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-heading">จัดการงานเคลม & อัปเดตสถานะการซ่อม</h2>
          <p className="page-subheading">ตรวจสอบรายการเคลมประกัน อัปเดตขั้นตอนการซ่อม และตัดวงเงินความคุ้มครองอัตโนมัติ</p>
        </div>
        <button className="btn btn-secondary" onClick={load}>
          รีเฟรชรายการ
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-lg" style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-box" style={{ flex: 1, minWidth: 240 }}>
            <input
              className="form-input"
              placeholder="ค้นหาเลขใบงานซ่อม (REP-...), เลข IMEI, หรือเลขกรมธรรม์ (POL-...)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-input form-select"
            style={{ width: 220 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">ทุกสถานะงานซ่อม</option>
            {Object.entries(REPAIR_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px', width: 36, height: 36 }} />
              <p style={{ color: 'var(--text-muted)' }}>กำลังโหลดรายการงานซ่อม...</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>เลขใบงานซ่อม</th>
                  <th>เลขกรมธรรม์ / IMEI</th>
                  <th>อาการเสีย / รายละเอียด</th>
                  <th>ศูนย์บริการ</th>
                  <th>ค่าซ่อมประเมิน / จริง</th>
                  <th>สถานะการซ่อม</th>
                  <th>จัดการสถานะ</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                      ไม่พบรายการแจ้งเคลม / ส่งซ่อม
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.ticket_id}>
                      <td>
                        <div className="mono text-blue font-bold">{t.ticket_id}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(t.created_at)}</div>
                      </td>
                      <td>
                        <div className="mono font-bold" style={{ fontSize: 12 }}>{t.policy_no || '-'}</div>
                        <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>IMEI: {t.imei}</div>
                      </td>
                      <td style={{ maxWidth: 260 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{t.defect_symptom}</div>
                        {t.repair_summary && (
                          <div style={{ fontSize: 11, color: '#16a34a', marginTop: 3 }}>
                            ✓ {t.repair_summary}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{t.center_name || 'ศูนย์บริการพาร์ทเนอร์'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.technician_name || 'ช่างเทคนิค'}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>ประเมิน: <strong>฿{formatMoney(t.estimated_cost)}</strong></div>
                        {t.actual_cost != null && (
                          <div style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 700 }}>
                            ซ่อมจริง: ฿{formatMoney(t.actual_cost)}
                          </div>
                        )}
                      </td>
                      <td>
                        <RepairStatusBadge status={t.repair_status} />
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => openModal(t)}
                        >
                          อัปเดตสถานะ
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Update Repair Status Modal */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedTicket(null)}>
          <div className="modal fade-in" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2 className="modal-title">อัปเดตสถานะการซ่อม ({selectedTicket.ticket_id})</h2>
              <button className="modal-close" onClick={() => setSelectedTicket(null)}>✕</button>
            </div>

            <div style={{
              padding: 14,
              borderRadius: 'var(--radius-md)',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              marginBottom: 16,
              fontSize: 13,
            }}>
              <div style={{ marginBottom: 4 }}><strong>IMEI:</strong> <span className="mono">{selectedTicket.imei}</span></div>
              <div style={{ marginBottom: 4 }}><strong>เลขกรมธรรม์:</strong> <span className="mono">{selectedTicket.policy_no || '-'}</span></div>
              <div style={{ marginBottom: 4 }}><strong>อาการเสียที่รับแจ้ง:</strong> {selectedTicket.defect_symptom}</div>
              <div><strong>สถานะปัจจุบัน:</strong> <RepairStatusBadge status={selectedTicket.repair_status} /></div>
            </div>

            <form onSubmit={handleSaveStatus}>
              <div className="form-group">
                <label className="form-label">เลือกสถานะการซ่อมใหม่ *</label>
                <select
                  className="form-input form-select"
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  required
                >
                  {Object.entries(REPAIR_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">ค่าซ่อมจริง (บาท)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="form-input"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  placeholder="กรอกยอดค่าซ่อมจริง เช่น 4500"
                />
              </div>

              <div className="form-group">
                <label className="form-label">สรุปผลการซ่อม / หมายเหตุช่าง</label>
                <textarea
                  rows={3}
                  className="form-input"
                  value={repairSummary}
                  onChange={(e) => setRepairSummary(e.target.value)}
                  placeholder="เช่น เปลี่ยนชุดหน้าจอแท้ศูนย์และทดสอบระบบสัมผัสเรียบร้อยแล้ว"
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => setSelectedTicket(null)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={saving}
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึกสถานะการซ่อม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

