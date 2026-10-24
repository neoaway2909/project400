import React, { useState, useEffect } from 'react';
import { fetchCustomerDevice } from './api';
import WarrantyCard from './components/WarrantyCard';
import RepairTracker from './components/RepairTracker';
import ClaimForm from './components/ClaimForm';
import CenterLocator from './components/CenterLocator';

const DEMO_DEVICES = [
  { label: 'iPhone 15 Pro (กำลังซ่อม)', imei: '358941091234567' },
  { label: 'S24 Ultra (ประกัน 2 ปี)', imei: '351234567890001' },
  { label: 'iPhone 13 (หมดอายุ)', imei: '350000000000000' }
];

export default function App() {
  const [imeiInput, setImeiInput] = useState('358941091234567');
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('warranty'); // 'warranty' | 'repair' | 'claim' | 'centers'

  // Load initial device
  useEffect(() => {
    loadDevice(imeiInput);
  }, []);

  const loadDevice = async (targetImei) => {
    if (!targetImei) return;
    setLoading(true);
    const data = await fetchCustomerDevice(targetImei);
    setDevice(data);
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadDevice(imeiInput);
  };

  const handleSelectDemo = (imei) => {
    setImeiInput(imei);
    loadDevice(imei);
  };

  return (
    <div className="app-container">
      {/* Top Mobile Bar with LINE LIFF integration tag */}
      <header className="top-header">
        <div className="brand-badge">
          <div className="brand-icon">🛡️</div>
          <div>
            <div className="brand-title">CareShield™</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
              ระบบประกันดิจิทัล & ติดตามงานซ่อม
            </div>
          </div>
        </div>

        <div className="line-indicator">
          <div className="line-dot"></div>
          <span>LINE LIFF Active</span>
        </div>
      </header>

      {/* Quick Search IMEI */}
      <div className="search-container">
        <form onSubmit={handleSearch} className="search-box">
          <span style={{ fontSize: '1.1rem' }}>🔍</span>
          <input
            type="text"
            className="search-input"
            value={imeiInput}
            onChange={(e) => setImeiInput(e.target.value)}
            placeholder="ค้นหาเลขอีมี่ (IMEI 15 หลัก)..."
            maxLength="15"
          />
          <button type="submit" className="search-btn">
            ค้นหา
          </button>
        </form>
      </div>

      {/* Quick Demo Switcher */}
      <div className="quick-chips">
        {DEMO_DEVICES.map((d) => (
          <button
            key={d.imei}
            onClick={() => handleSelectDemo(d.imei)}
            className={`chip-btn ${imeiInput === d.imei ? 'active' : ''}`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Main Tab Content */}
      <main className="content-area">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{
              width: 40,
              height: 40,
              border: '3px solid rgba(0, 240, 255, 0.2)',
              borderTopColor: 'var(--accent-cyan)',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 0.8s linear infinite'
            }}></div>
            <div style={{ fontSize: '0.9rem' }}>กำลังตรวจสอบสถานะกับเซิร์ฟเวอร์ประกัน...</div>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {activeTab === 'warranty' && (
              <WarrantyCard 
                device={device} 
                onGoToRepair={() => setActiveTab('repair')} 
              />
            )}

            {activeTab === 'repair' && (
              <RepairTracker device={device} />
            )}

            {activeTab === 'claim' && (
              <ClaimForm 
                device={device} 
                onSubmitSuccess={() => setActiveTab('repair')} 
              />
            )}

            {activeTab === 'centers' && (
              <CenterLocator />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation (Mobile App style) */}
      <nav className="bottom-nav">
        <button
          onClick={() => setActiveTab('warranty')}
          className={`nav-item ${activeTab === 'warranty' ? 'active' : ''}`}
        >
          <span className="nav-icon">🪪</span>
          <span>บัตรประกัน</span>
        </button>

        <button
          onClick={() => setActiveTab('repair')}
          className={`nav-item ${activeTab === 'repair' ? 'active' : ''}`}
        >
          <span className="nav-icon">🚚</span>
          <span>สถานะงานซ่อม</span>
        </button>

        <button
          onClick={() => setActiveTab('claim')}
          className={`nav-item ${activeTab === 'claim' ? 'active' : ''}`}
        >
          <span className="nav-icon">📝</span>
          <span>แจ้งเคลม</span>
        </button>

        <button
          onClick={() => setActiveTab('centers')}
          className={`nav-item ${activeTab === 'centers' ? 'active' : ''}`}
        >
          <span className="nav-icon">📍</span>
          <span>ศูนย์บริการ</span>
        </button>
      </nav>
    </div>
  );
}
