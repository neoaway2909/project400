import React from 'react';

/**
 * Validate IMEI format & Luhn algorithm on client side
 */
export const validateImeiClient = (imei) => {
  const cleaned = String(imei || '').trim();
  if (!cleaned) {
    return { valid: false, error: 'กรุณากรอกเลขอีมี่ (IMEI)' };
  }
  if (!/^[0-9]{15}$/.test(cleaned)) {
    return { valid: false, error: 'IMEI ต้องเป็นตัวเลข 15 หลักเท่านั้น' };
  }

  // Luhn algorithm check
  const digits = cleaned.split('').map(Number);
  const sum = digits.reduceRight((acc, digit, idx) => {
    if ((digits.length - 1 - idx) % 2 === 1) {
      const doubled = digit * 2;
      return acc + (doubled > 9 ? doubled - 9 : doubled);
    }
    return acc + digit;
  }, 0);

  if (sum % 10 !== 0) {
    return { valid: false, error: 'เลขอีมี่ไม่ถูกต้องตามมาตรฐาน (Luhn Checksum ล้มเหลว)' };
  }

  return { valid: true, error: null };
};

/**
 * StatusBadge Component
 */
const STATUS_MAP = {
  IN_STOCK:     { label: 'มีในคลัง',   cls: 'in-stock' },
  RESERVED:     { label: 'จองแล้ว',    cls: 'reserved' },
  SOLD:         { label: 'ขายแล้ว',    cls: 'sold' },
  CLAIM_REPAIR: { label: 'ส่งเคลม/ซ่อม', cls: 'claim-repair' },
  DEFECTIVE:    { label: 'เสียถาวร',   cls: 'defective' },
};

export function StatusBadge({ status }) {
  const info = STATUS_MAP[status] || { label: status || '—', cls: '' };
  return (
    <span className={`badge ${info.cls}`}>
      <span className="badge-dot" />
      {info.label}
    </span>
  );
}

/**
 * Format Price to THB currency
 */
export function formatPrice(price) {
  if (price === undefined || price === null || isNaN(Number(price))) return '฿0';
  return `฿${Number(price).toLocaleString('th-TH')}`;
}

/**
 * Format Date to Thai locale string
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Loading indicator box
 */
export function LoadingBox({ text = 'กำลังโหลดข้อมูล...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      color: 'var(--clr-text-muted)',
      gap: '16px'
    }}>
      <div style={{
        width: 36,
        height: 36,
        border: '3px solid rgba(255, 255, 255, .1)',
        borderTopColor: 'var(--clr-primary-500)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <span style={{ fontSize: '.9rem' }}>{text}</span>
    </div>
  );
}

/**
 * Empty state box
 */
export function EmptyState({ text, title, message }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '40px 20px',
      color: 'var(--clr-text-muted)'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
      {title && <div style={{ fontWeight: 600, color: 'var(--clr-text)', marginBottom: '4px' }}>{title}</div>}
      <div style={{ fontSize: '.88rem' }}>{text || message || 'ไม่มีข้อมูลที่จะแสดง'}</div>
    </div>
  );
}
