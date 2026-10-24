import React, { useEffect, useState } from 'react';
import { fetchDashboardStats } from '../services/api';
import { formatMoney } from './Shared';

// ============================================================
// Dashboard Page
// ============================================================
export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats().then(data => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div className="spinner" style={{ width: 48, height: 48 }} />
        <p style={{ color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  );

  const maxMonth = Math.max(...(stats?.monthly_data?.map(m => m.count) || [1]), 1);

  return (
    <div className="page-content fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-heading">Dashboard ภาพรวม</h2>
          <p className="page-subheading">ข้อมูลสรุประบบกรมธรรม์ประกันภัยทั้งหมด</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.3)',
            color: 'var(--accent-blue)',
            fontSize: '12px',
            fontWeight: 600
          }}>
            อัปเดต: {new Date().toLocaleDateString('th-TH', { day:'2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-icon blue">📋</div>
          <div className="stat-label">กรมธรรม์ทั้งหมด</div>
          <div className="stat-value">{stats?.total_policies?.toLocaleString()}</div>
          <div className="stat-sub">รายการในระบบ</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green">✅</div>
          <div className="stat-label">กำลังคุ้มครอง</div>
          <div className="stat-value" style={{ color: 'var(--accent-green)' }}>
            {stats?.active_policies?.toLocaleString()}
          </div>
          <div className="stat-sub">ACTIVE policies</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon red">⏰</div>
          <div className="stat-label">หมดอายุแล้ว</div>
          <div className="stat-value" style={{ color: 'var(--accent-red)' }}>
            {stats?.expired_policies?.toLocaleString()}
          </div>
          <div className="stat-sub">EXPIRED policies</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple">🏷️</div>
          <div className="stat-label">แพ็กเกจที่ใช้งาน</div>
          <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>3</div>
          <div className="stat-sub">Package types</div>
        </div>
      </div>

      {/* Charts & Rankings Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Monthly Bar Chart */}
        <div className="card">
          <div className="card-title">📈 ยอดเปิดกรมธรรม์รายเดือน (6 เดือนล่าสุด)</div>
          <div className="chart-container">
            {stats?.monthly_data?.map((m, i) => (
              <div key={i} className="chart-bar-wrap">
                <div className="chart-value">{m.count}</div>
                <div className="chart-bar-bg">
                  <div
                    className="chart-bar"
                    style={{ height: `${maxMonth === 0 ? 5 : Math.max(5, (m.count / maxMonth) * 100)}%` }}
                  />
                </div>
                <div className="chart-label">{m.month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Packages */}
        <div className="card">
          <div className="card-title">🥇 แพ็กเกจยอดนิยม</div>
          {stats?.top_packages?.map((pkg, i) => {
            const maxPkg = stats.top_packages[0]?.count || 1;
            const colors = ['var(--accent-blue)', 'var(--accent-green)', 'var(--accent-purple)'];
            return (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{pkg.name}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: colors[i] }}>{pkg.count}</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(pkg.count / maxPkg) * 100}%`,
                    background: colors[i],
                    borderRadius: '3px',
                    transition: 'width 0.8s ease'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Devices */}
      <div className="card">
        <div className="card-title">📱 ยี่ห้อโทรศัพท์ที่ทำประกันมากที่สุด</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {stats?.top_devices?.map((d, i) => {
            const colors = ['blue', 'green', 'purple', 'red', 'blue'];
            const bgColors = [
              'rgba(59,130,246,0.1)', 'rgba(16,185,129,0.1)',
              'rgba(139,92,246,0.1)', 'rgba(239,68,68,0.1)', 'rgba(6,182,212,0.1)'
            ];
            const textColors = ['var(--accent-blue)', 'var(--accent-green)', 'var(--accent-purple)', 'var(--accent-red)', 'var(--accent-cyan)'];
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px', borderRadius: 'var(--radius-md)',
                background: bgColors[i],
                border: `1px solid ${bgColors[i].replace('0.1', '0.3')}`
              }}>
                <span style={{ fontSize: 22 }}>
                  {d.brand === 'iPhone' ? '🍎' : d.brand === 'Samsung' ? '🌟' : d.brand === 'OPPO' ? '🟢' : d.brand === 'Google' ? '🔵' : '📱'}
                </span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: textColors[i] }}>{d.brand}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{d.count} เครื่อง</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
