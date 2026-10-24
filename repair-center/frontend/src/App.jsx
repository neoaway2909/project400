import { useEffect, useState } from 'react';
import { repairApi } from './api';

const STATUS_LABELS = {
  RECEIVED: 'รับเครื่องแล้ว',
  DIAGNOSING: 'กำลังตรวจสอบ',
  WAITING_PARTS: 'รออะไหล่',
  IN_PROGRESS: 'กำลังซ่อม',
  REPAIR_COMPLETED: 'ซ่อมเสร็จ',
  DELIVERED: 'ส่งคืนแล้ว',
  CANCELLED: 'ยกเลิก',
};

const NEXT_STATUSES = {
  RECEIVED: ['DIAGNOSING', 'CANCELLED'],
  DIAGNOSING: ['WAITING_PARTS', 'IN_PROGRESS', 'CANCELLED'],
  WAITING_PARTS: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['REPAIR_COMPLETED', 'CANCELLED'],
  REPAIR_COMPLETED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const currency = (amount) => new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  maximumFractionDigits: 0,
}).format(Number(amount || 0));

function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-${status?.toLowerCase()}`}>
      <span className="status-dot" />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function ActionModal({ ticket, onClose, onSaved }) {
  const [detail, setDetail] = useState(null);
  const [nextStatus, setNextStatus] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const availableStatuses = NEXT_STATUSES[ticket.repair_status] || [];

  useEffect(() => {
    let active = true;
    repairApi.get(ticket.ticket_id)
      .then((result) => {
        if (active) setDetail(result.data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => { active = false; };
  }, [ticket.ticket_id]);

  async function saveStatus(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = { status: nextStatus };
      if (actualCost !== '') body.actual_cost = Number(actualCost);
      if (summary.trim()) body.repair_summary = summary.trim();
      const result = await repairApi.updateStatus(ticket.ticket_id, body);
      onSaved(result.webhook);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="action-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">REPAIR ACTION</p>
            <h2 id="modal-title">{ticket.ticket_id}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="ปิดหน้าต่าง">×</button>
        </header>
        <div className="modal-content">
          <div className="modal-ticket-meta">
            <div><span>IMEI</span><strong className="mono">{ticket.imei}</strong></div>
            <div><span>สถานะปัจจุบัน</span><StatusBadge status={ticket.repair_status} /></div>
            <div><span>อาการเสีย</span><strong>{ticket.defect_symptom}</strong></div>
          </div>
          {detail && (
            <div className="cost-summary">
              <div><span>ประเมินค่าซ่อม</span><strong>{currency(detail.estimated_cost)}</strong></div>
              <div><span>ประกันรับผิดชอบ</span><strong className="text-green">{currency(detail.cost_covered_by_insurance)}</strong></div>
              <div><span>ลูกค้าชำระส่วนต่าง</span><strong className="text-amber">{currency(detail.customer_excess_paid)}</strong></div>
              {detail.photos?.length > 0 && (
                <div className="photo-links">
                  <span>รูปภาพประกอบ</span>
                  {detail.photos.map((photo) => (
                    <a key={photo.id} href={photo.photo_url} target="_blank" rel="noreferrer">
                      {photo.photo_type === 'BEFORE' ? 'ก่อนซ่อม' : photo.photo_type === 'AFTER' ? 'หลังซ่อม' : 'อะไหล่เสีย'}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
          {availableStatuses.length > 0 ? (
            <form className="action-form" onSubmit={saveStatus}>
              <label>
                เปลี่ยนสถานะเป็น
                <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} required>
                  <option value="">เลือกสถานะถัดไป</option>
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                  ))}
                </select>
              </label>
              <label>
                ค่าซ่อมจริง (บาท)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={actualCost}
                  onChange={(event) => setActualCost(event.target.value)}
                  placeholder="กรอกเมื่อยืนยันค่าซ่อม"
                />
              </label>
              <label>
                สรุปผลการซ่อม
                <textarea
                  rows="3"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  placeholder="เช่น เปลี่ยนชุดหน้าจอและทดสอบการใช้งานแล้ว"
                />
              </label>
              {error && <p className="inline-error" role="alert">{error}</p>}
              <button className="primary-button full-width" type="submit" disabled={saving || !nextStatus}>
                {saving ? 'กำลังบันทึก…' : 'บันทึกการเปลี่ยนแปลง'}
              </button>
            </form>
          ) : (
            <p className="terminal-note">งานนี้ไม่มีสถานะถัดไปให้ดำเนินการ</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    repairApi.list({ status: statusFilter, search: appliedSearch })
      .then((result) => {
        if (active) setTickets(result.data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [statusFilter, appliedSearch, refreshCount]);

  function onActionSaved(webhook) {
    setSelectedTicket(null);
    setRefreshCount((count) => count + 1);
    if (!webhook) {
      setNotice('บันทึกสถานะงานแล้ว');
    } else if (webhook.delivered) {
      setNotice('บันทึกงานแล้ว และส่ง Webhook ไปยังร้านค้าสำเร็จ');
    } else {
      setNotice(`บันทึกงานแล้ว แต่ Webhook ส่งไม่สำเร็จ${webhook.error ? `: ${webhook.error}` : ''} (ระบบบันทึกผลไว้แล้ว)`);
    }
  }

  const activeCount = tickets.filter((ticket) => (
    !['DELIVERED', 'CANCELLED'].includes(ticket.repair_status)
  )).length;
  const completedCount = tickets.filter((ticket) => (
    ['REPAIR_COMPLETED', 'DELIVERED'].includes(ticket.repair_status)
  )).length;

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Repair Center">
          <span className="brand-mark">R</span>
          <span><strong>REPAIR CENTER</strong><small>Service operations portal</small></span>
        </a>
        <div className="user-chip"><span className="online-dot" /> ศูนย์ซ่อม · สยาม</div>
      </header>
      <section className="page-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">WORKSPACE / REPAIR OPERATIONS</p>
            <h1>คิวงานซ่อม</h1>
            <p className="heading-subtitle">ติดตาม ตรวจสอบ และอัปเดตสถานะงานซ่อมของศูนย์</p>
          </div>
          <button className="secondary-button" onClick={() => setRefreshCount((count) => count + 1)}>
            <span aria-hidden="true">↻</span> รีเฟรชรายการ
          </button>
        </div>

        <div className="stats-grid">
          <article className="stat-card"><span className="stat-icon blue">▤</span><div><strong>{tickets.length}</strong><span>รายการที่แสดง</span></div></article>
          <article className="stat-card"><span className="stat-icon amber">◷</span><div><strong>{activeCount}</strong><span>กำลังดำเนินการ</span></div></article>
          <article className="stat-card"><span className="stat-icon green">✓</span><div><strong>{completedCount}</strong><span>ซ่อมเสร็จ / ส่งคืน</span></div></article>
        </div>

        <section className="queue-card">
          <div className="queue-header">
            <div><h2>รายการงานซ่อม</h2><p>ค้นหาด้วย Ticket ID หรือ IMEI</p></div>
            <form className="filters" onSubmit={(event) => {
              event.preventDefault();
              setAppliedSearch(searchInput.trim());
            }}>
              <label className="search-field">
                <span aria-hidden="true">⌕</span>
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="ค้นหา IMEI / Ticket ID"
                  aria-label="ค้นหา IMEI หรือ Ticket ID"
                />
              </label>
              <select aria-label="กรองตามสถานะ" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">ทุกสถานะ</option>
                {Object.entries(STATUS_LABELS).map(([status, label]) => (
                  <option key={status} value={status}>{label}</option>
                ))}
              </select>
              <button className="primary-button" type="submit">ค้นหา</button>
            </form>
          </div>

          {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="ปิดข้อความ">×</button></div>}
          {error && <div className="error-banner" role="alert">{error} <button onClick={() => setRefreshCount((count) => count + 1)}>ลองอีกครั้ง</button></div>}
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>เลขที่งาน / วันที่รับ</th><th>IMEI</th><th>อาการเสีย</th><th>ช่างผู้รับผิดชอบ</th><th>ค่าซ่อมประเมิน</th><th>สถานะ</th><th><span className="sr-only">จัดการ</span></th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="empty-cell" colSpan="7"><span className="spinner" /> กำลังโหลดรายการ…</td></tr>
                ) : tickets.length === 0 && !error ? (
                  <tr><td className="empty-cell" colSpan="7"><div className="empty-icon">▤</div><strong>ไม่พบงานซ่อม</strong><span>ลองปรับตัวกรอง หรือเปิดรับเครื่องเพื่อสร้างรายการใหม่</span></td></tr>
                ) : tickets.map((ticket) => (
                  <tr key={ticket.ticket_id}>
                    <td><strong className="ticket-id">{ticket.ticket_id}</strong><small>{new Date(ticket.created_at).toLocaleDateString('th-TH')}</small></td>
                    <td className="mono">{ticket.imei}</td>
                    <td className="symptom-cell">{ticket.defect_symptom}</td>
                    <td>{ticket.technician_name || <span className="muted">ยังไม่ระบุ</span>}</td>
                    <td>{currency(ticket.estimated_cost)}</td>
                    <td><StatusBadge status={ticket.repair_status} /></td>
                    <td><button className="row-action" onClick={() => setSelectedTicket(ticket)}>จัดการ <span aria-hidden="true">→</span></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="queue-footer"><span>แสดง {tickets.length} รายการ</span><span>อัปเดตจากระบบล่าสุด</span></footer>
        </section>
        <footer className="page-footer">Repair Center Portal <span>·</span> Insurance claim operations</footer>
      </section>
      {selectedTicket && (
        <ActionModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onSaved={onActionSaved}
        />
      )}
    </main>
  );
}
