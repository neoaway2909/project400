import React from 'react';
import { PARTNER_CENTERS } from '../api';

export default function CenterLocator() {
  return (
    <div className="glass-section">
      <div className="section-title">
        <span>📍</span>
        <span>เครือข่ายศูนย์ซ่อมพาร์ทเนอร์ทางการ</span>
      </div>

      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
        ทุกศูนย์บริการใช้อะไหล่แท้ 100% พร้อมช่างผู้เชี่ยวชาญที่ได้รับการรับรอง สามารถยื่นเลขอีมี่เพื่อรับบริการได้ทันทีโดยไม่ต้องสำรองจ่าย
      </div>

      <div>
        {PARTNER_CENTERS.map((c) => (
          <div key={c.id} className="center-card">
            <div className="center-icon">🏬</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
                  {c.name}
                </div>
                <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: '700' }}>
                  ★ {c.rating}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                {c.zone}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0' }}>
                {c.address}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                <span>🕒 {c.hours}</span>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>⚡ {c.speed}</span>
              </div>

              <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                <a 
                  href={`tel:${c.tel}`}
                  style={{
                    padding: '4px 10px',
                    background: 'rgba(0, 240, 255, 0.12)',
                    border: '1px solid var(--accent-cyan)',
                    borderRadius: '6px',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.75rem',
                    textDecoration: 'none',
                    fontWeight: '600'
                  }}
                >
                  📞 โทร {c.tel}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
