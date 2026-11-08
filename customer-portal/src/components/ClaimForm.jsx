import React, { useState } from 'react';
import { PARTNER_CENTERS } from '../api';

export default function ClaimForm({ device, onSubmitSuccess }) {
  const isExpired = device?.policy_status === 'EXPIRED';
  const [symptomType, setSymptomType] = useState('SCREEN');
  const [description, setDescription] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('CTR-001');
  const [contactPhone, setContactPhone] = useState(device?.customer_phone || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      if (onSubmitSuccess) onSubmitSuccess();
    }, 1200);
  };

  if (submitted) {
    return (
      <div className="glass-section" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉✅</div>
        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-emerald)', marginBottom: '8px' }}>
          บันทึกการแจ้งเคลมล่วงหน้าสำเร็จ!
        </div>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          รหัสคิวแจ้งซ่อม: <strong style={{ color: '#b45309' }}>CLM-2026-9812</strong><br />
          คุณสามารถนำเครื่องเข้าติดต่อที่ <strong>{PARTNER_CENTERS.find(c => c.id === selectedCenter)?.name}</strong> ได้ทันที โดยแสดงเลขอีมี่นี้ต่อช่าง
        </div>
        <button 
          onClick={() => setSubmitted(false)}
          className="search-btn"
          style={{ width: '100%', padding: '12px' }}
        >
          กลับสู่หน้าหลัก
        </button>
      </div>
    );
  }

  return (
    <div className="glass-section">
      <div className="section-title">
        <span>📝</span>
        <span>แจ้งส่งซ่อม / เคลมประกันออนไลน์</span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Device Quick Info */}
        <div style={{
          padding: '12px 14px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.82rem'
        }}>
          <span style={{ color: 'var(--text-subtle)' }}>เครื่องที่ขอรับบริการ: </span>
          <strong style={{ color: '#0f172a' }}>{device?.device_model}</strong>
          <div style={{ color: '#b45309', fontFamily: 'monospace', fontWeight: '600', marginTop: '2px' }}>
            IMEI: {device?.imei}
          </div>
        </div>

        {/* Issue Category */}
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            ลักษณะความเสียหาย
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { id: 'SCREEN', label: 'หน้าจอแตก / ร้าว', icon: '📱' },
              { id: 'WATER', label: 'เครื่องตกน้ำ / โดนน้ำ', icon: '💧' },
              { id: 'BATTERY', label: 'แบตเตอรี่เสื่อม / บวม', icon: '🔋' },
              { id: 'OTHER', label: 'เปิดไม่ติด / อาการอื่น', icon: '⚠️' }
            ].map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setSymptomType(cat.id)}
                style={{
                  padding: '10px 8px',
                  background: symptomType === cat.id ? '#fef3c7' : '#ffffff',
                  border: `1px solid ${symptomType === cat.id ? '#f59e0b' : '#e2e8f0'}`,
                  borderRadius: 'var(--radius-sm)',
                  color: symptomType === cat.id ? '#92400e' : '#1e293b',
                  fontSize: '0.8rem',
                  fontWeight: symptomType === cat.id ? '700' : '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  boxShadow: symptomType === cat.id ? '0 2px 6px rgba(245, 158, 11, 0.15)' : 'none'
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Symptom Description */}
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            รายละเอียดอาการเสียเพิ่มเติม
          </label>
          <textarea
            required
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="เช่น เครื่องหล่นพื้นหน้าจอมีเส้นขีดดำ ทัชสกรีนด้านบนไม่ติด..."
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 'var(--radius-sm)',
              padding: '10px',
              color: '#0f172a',
              fontSize: '0.88rem',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Preferred Center */}
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            เลือกศูนย์บริการพาร์ทเนอร์ที่สะดวกเข้าพบ
          </label>
          <select
            value={selectedCenter}
            onChange={(e) => setSelectedCenter(e.target.value)}
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 'var(--radius-sm)',
              padding: '10px',
              color: '#0f172a',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          >
            {PARTNER_CENTERS.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.zone})</option>
            ))}
          </select>
        </div>

        {/* Contact Phone */}
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            เบอร์โทรศัพท์ติดต่อกลับ
          </label>
          <input
            type="tel"
            required
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="081-234-5678"
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 'var(--radius-sm)',
              padding: '10px',
              color: '#0f172a',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          />
        </div>

        {isExpired && (
          <div style={{
            padding: '12px 14px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-sm)',
            color: '#991b1b',
            fontSize: '0.85rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '1.2rem' }}>🚫</span>
            <div>
              <div>ไม่สามารถส่งเคลมประกันได้</div>
              <div style={{ fontSize: '0.75rem', fontWeight: '400', color: '#b91c1c' }}>
                กรมธรรม์ของอุปกรณ์เครื่องนี้หมดอายุความคุ้มครองแล้ว (EXPIRED)
              </div>
            </div>
          </div>
        )}

        <button 
          type="submit"
          disabled={submitting || isExpired}
          className="search-btn"
          style={{ 
            width: '100%', 
            padding: '12px', 
            marginTop: '6px',
            opacity: isExpired ? 0.5 : 1,
            cursor: isExpired ? 'not-allowed' : 'pointer',
            backgroundColor: isExpired ? '#94a3b8' : undefined
          }}
        >
          {isExpired ? 'ไม่สามารถแจ้งเคลมได้ (กรมธรรม์หมดอายุ)' : submitting ? 'กำลังส่งข้อมูลเปิดเคส...' : 'ยืนยันการแจ้งเคลมส่งซ่อม'}
        </button>
      </form>
    </div>
  );
}
