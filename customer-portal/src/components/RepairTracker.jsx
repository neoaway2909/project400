import React from 'react';

export default function RepairTracker({ device }) {
  const repair = device?.active_repair;

  if (!repair) {
    return (
      <div className="glass-section" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📱✨</div>
        <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '6px' }}>
          ไม่มีรายการส่งซ่อมในขณะนี้
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          โทรศัพท์ของคุณ (IMEI: {device?.imei || '—'}) กำลังใช้งานได้ตามปกติ หากเครื่องมีปัญหา สามารถกดแจ้งเคลมได้ทันที
        </div>
        <div style={{
          display: 'inline-block',
          padding: '8px 16px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--accent-emerald)',
          fontSize: '0.85rem',
          fontWeight: '600'
        }}>
          พร้อมส่งซ่อมที่ศูนย์พาร์ทเนอร์ใกล้บ้านคุณ
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Active Ticket Header Card */}
      <div className="glass-section" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>หมายเลขตั๋วงานซ่อม</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
              {repair.ticket_id}
            </div>
          </div>
          <span style={{
            padding: '4px 10px',
            background: 'rgba(0, 240, 255, 0.15)',
            border: '1px solid var(--accent-cyan)',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: '700',
            color: 'var(--accent-cyan)'
          }}>
            ⚡ กำลังซ่อมแซม
          </span>
        </div>

        <div style={{ fontSize: '0.9rem', marginBottom: '14px', color: 'var(--text-main)' }}>
          <strong>อาการที่แจ้ง:</strong> {repair.defect_symptom}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '12px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.82rem'
        }}>
          <div>
            <span style={{ color: 'var(--text-subtle)', display: 'block' }}>ประมาณการเสร็จ</span>
            <strong style={{ color: '#fff' }}>{repair.estimated_pickup}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-subtle)', display: 'block' }}>ค่าใช้จ่ายที่ต้องชำระ</span>
            <strong style={{ color: 'var(--accent-emerald)' }}>
              {repair.customer_excess === 0 ? 'ฟรี (ประกันคุ้มครอง 100%)' : `฿${repair.customer_excess.toLocaleString()}`}
            </strong>
          </div>
        </div>
      </div>

      {/* Step by Step Live Timeline */}
      <div className="glass-section">
        <div className="section-title">
          <span>🕒</span>
          <span>ขั้นตอนการดำเนินงานแบบเรียลไทม์</span>
        </div>

        <div className="timeline-container">
          <div className="timeline-line"></div>
          {(repair.timeline || []).map((step, idx) => {
            const isCompleted = step.completed;
            const isActive = step.active;
            return (
              <div 
                key={idx} 
                className={`timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
              >
                <div className="timeline-marker">
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <div className="step-header">
                  <div className="step-title" style={{ color: isActive ? 'var(--accent-cyan)' : undefined }}>
                    {step.title}
                  </div>
                  <div className="step-time">{step.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Service Center Details */}
      <div className="glass-section">
        <div className="section-title">
          <span>📍</span>
          <span>ข้อมูลศูนย์บริการที่ดูแลเครื่องของคุณ</span>
        </div>
        <div style={{ fontSize: '0.92rem', fontWeight: '700', marginBottom: '4px' }}>
          {repair.center_name}
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
          {repair.center_address}
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          👨‍🔧 ผู้รับผิดชอบ: <strong>{repair.technician_name}</strong>
        </div>

        <a 
          href={`tel:${repair.center_phone}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid var(--accent-blue)',
            color: 'var(--accent-cyan)',
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '0.88rem'
          }}
        >
          <span>📞</span>
          <span>โทรติดต่อศูนย์ซ่อม: {repair.center_phone}</span>
        </a>
      </div>
    </div>
  );
}
