import React from 'react';

export default function WarrantyCard({ device, onGoToRepair }) {
  if (!device) return null;

  const isActive = device.policy_status === 'ACTIVE';
  
  // Calculate days remaining
  let daysRemaining = 0;
  if (device.coverage_end) {
    const diffTime = new Date(device.coverage_end) - new Date();
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  const coveragePercent = device.max_coverage_amount > 0
    ? Math.round((device.remaining_claim_amount / device.max_coverage_amount) * 100)
    : 0;

  return (
    <div className="warranty-card-container">
      {/* 3D Cyber-Glass Digital Card */}
      <div className="digital-card">
        <div className="card-top">
          <div>
            <div className="card-brand">CareShield™ E-WARRANTY</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
              เลขที่กรมธรรม์: {device.policy_no}
            </div>
          </div>
          <div className={`card-status-badge ${isActive ? 'active' : 'expired'}`}>
            <span>{isActive ? '●' : '●'}</span>
            <span>{isActive ? 'คุ้มครองปกติ' : 'หมดอายุ (EXPIRED)'}</span>
          </div>
        </div>

        <div className="device-model-name">{device.device_model}</div>
        <div className="device-imei-text">IMEI: {device.imei}</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
          <span style={{ color: 'var(--text-muted)' }}>วงเงินความคุ้มครองคงเหลือ</span>
          <span style={{ color: isActive ? '#b45309' : '#94a3b8', fontWeight: '700' }}>
            ฿{Number(device.remaining_claim_amount || 0).toLocaleString()} / ฿{Number(device.max_coverage_amount || 0).toLocaleString()}
          </span>
        </div>

        <div className="coverage-progress-bar">
          <div 
            className="coverage-fill" 
            style={{ 
              width: `${coveragePercent}%`,
              background: isActive ? 'linear-gradient(90deg, #f59e0b, #d97706)' : '#cbd5e1'
            }}
          ></div>
        </div>

        <div className="card-footer-grid">
          <div>
            <div className="footer-cell-label">วันสิ้นสุดความคุ้มครอง</div>
            <div className="footer-cell-value">
              {new Date(device.coverage_end).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
            <div style={{ 
              fontSize: '0.72rem', 
              color: isActive ? '#b45309' : '#dc2626', 
              fontWeight: '600' 
            }}>
              {isActive && daysRemaining > 0 
                ? `(เหลืออีก ${daysRemaining} วัน)` 
                : '(สิ้นสุดความคุ้มครองแล้ว)'}
            </div>
          </div>
          <div>
            <div className="footer-cell-label">สิทธิ์การเคลม</div>
            <div className="footer-cell-value">
              ใช้แล้ว {device.claim_count} / {device.max_claim_count} ครั้ง
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
              ผู้เอาประกัน: {device.customer_name || 'เจ้าของเครื่อง'}
            </div>
          </div>
        </div>

        {!isActive && (
          <div style={{
            marginTop: '12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            fontSize: '0.8rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div>
              <div>สถานะ: สิ้นสุดระยะเวลาคุ้มครองแล้ว (EXPIRED)</div>
              <div style={{ fontSize: '0.72rem', color: '#b91c1c', fontWeight: '400', marginTop: '2px' }}>
                กรมธรรม์นี้หมดอายุการคุ้มครองตามสัญญา ไม่สามารถส่งเคลมหรือเบิกอะไหล่ได้
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Repair Alert Banner if currently in repair */}
      {device.active_repair && (
        <div 
          onClick={onGoToRepair}
          style={{
            marginTop: '14px',
            background: 'linear-gradient(90deg, #fffbeb, #fef3c7)',
            border: '1px solid #fcd34d',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🔧</span>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#78350f' }}>
                เครื่องกำลังดำเนินการซ่อมอยู่!
              </div>
              <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: '600' }}>
                แตะที่นี่เพื่อดูขั้นตอนแบบเรียลไทม์ →
              </div>
            </div>
          </div>
          <span style={{ fontSize: '1.2rem', color: '#d97706', fontWeight: '700' }}>›</span>
        </div>
      )}

      {/* Coverage Benefits Section */}
      <div className="glass-section" style={{ marginTop: '20px' }}>
        <div className="section-title">
          <span>🛡️</span>
          <span>สิทธิประโยชน์และความคุ้มครองที่ได้รับ</span>
        </div>
        <div className="benefit-list">
          {(device.benefits || []).map((b, idx) => (
            <div key={idx} className="benefit-item">
              <div className="benefit-name">
                <span style={{ color: 'var(--accent-emerald)' }}>✓</span>
                <span>{b.name}</span>
              </div>
              <span className="benefit-badge">{b.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
