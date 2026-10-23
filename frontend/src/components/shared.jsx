/* ──────────────────────────────────────────────────
   Shared helper components
────────────────────────────────────────────────── */

/* ── Status Badge ───────────────────────────────── */
const STATUS_CONFIG = {
  IN_STOCK:     { label: 'มีในคลัง',   cls: 'in-stock',    dot: '#22c55e', icon: '●' },
  RESERVED:     { label: 'จอง',        cls: 'reserved',    dot: '#0ea5e9', icon: '◆' },
  SOLD:         { label: 'ขายแล้ว',    cls: 'sold',        dot: '#94a3b8', icon: '✓' },
  CLAIM_REPAIR: { label: 'ส่งซ่อม',   cls: 'claim-repair', dot: '#f59e0b', icon: '🔧' },
  DEFECTIVE:    { label: 'เสียหาย',   cls: 'defective',   dot: '#ef4444', icon: '✕' },
};

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: 'sold', dot: '#64748b', icon: '?' };
  return (
    <span className={`badge ${cfg.cls}`}>
      <span className="badge-dot" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

/* ── Price formatter ────────────────────────────── */
export function formatPrice(n) {
  return Number(n).toLocaleString('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 });
}

/* ── Date formatter ─────────────────────────────── */
export function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
}

/* ── Loading Box ────────────────────────────────── */
export function LoadingBox({ text = 'กำลังโหลด...' }) {
  return (
    <div className="loading-box">
      <div className="spinner" />
      <p style={{ marginTop: 14, fontSize: '.85rem', color: 'var(--clr-text-muted)' }}>{text}</p>
    </div>
  );
}

/* ── Empty State ────────────────────────────────── */
export function EmptyState({ icon = '📦', text = 'ไม่มีข้อมูล' }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <p>{text}</p>
    </div>
  );
}

/* ── IMEI Validator (client-side) ───────────────── */
export function validateImeiClient(imei) {
  const cleaned = String(imei || '').trim();
  if (!cleaned) return { valid: false, error: 'กรุณากรอก IMEI' };
  if (!/^[0-9]{15}$/.test(cleaned)) return { valid: false, error: 'IMEI ต้องเป็นตัวเลข 15 หลักเท่านั้น' };
  return { valid: true, error: null };
}
