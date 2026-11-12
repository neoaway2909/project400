import React, { useState, useEffect } from 'react';
import { fetchCustomerDevice } from './api';
import WarrantyCard from './components/WarrantyCard';
import RepairTracker from './components/RepairTracker';
import CenterLocator from './components/CenterLocator';

export default function App() {
  const [imeiInput, setImeiInput] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('warranty'); // 'warranty' | 'repair' | 'centers'

  // Load device if ?imei= is passed from POS QR Code / Link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlImei = params.get('imei');
    if (urlImei) {
      setImeiInput(urlImei);
      loadDevice(urlImei);
    }
  }, []);

  const loadDevice = async (targetQuery) => {
    const q = String(targetQuery || '').trim();
    if (!q) return;
    setLoading(true);
    setSearchedQuery(q);
    const data = await fetchCustomerDevice(q);
    setDevice(data);
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadDevice(imeiInput);
  };

  return (
    <div className="app-container">
      {/* Top Mobile Bar with LINE LIFF integration tag */}
      <header className="top-header">
        <div className="brand-badge">
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

      {/* Search IMEI / Policy No */}
      <div className="search-container">
        <form onSubmit={handleSearch} className="search-box">
          <input
            type="text"
            className="search-input"
            value={imeiInput}
            onChange={(e) => setImeiInput(e.target.value)}
            placeholder="ค้นหาเลขอีมี่ (IMEI 15 หลัก), เลขกรมธรรม์, หรือชื่อลูกค้า..."
            maxLength="50"
          />
          <button type="submit" className="search-btn">
            ค้นหา
          </button>
        </form>
      </div>

      {/* Main Tab Content */}
      <main className="content-area">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{
              width: 40,
              height: 40,
              border: '3px solid rgba(245, 158, 11, 0.2)',
              borderTopColor: 'var(--accent-amber)',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 0.8s linear infinite'
            }}></div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>กำลังตรวจสอบสถานะกับเซิร์ฟเวอร์ประกัน...</div>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : activeTab === 'centers' ? (
          <CenterLocator />
        ) : device ? (
          <>
            {activeTab === 'warranty' && (
              <WarrantyCard
                device={device}
                onGoToRepair={() => setActiveTab('repair')}
              />
            )}

            {activeTab === 'repair' && (
              <RepairTracker device={device} onRefresh={() => loadDevice(device.imei || imeiInput)} />
            )}
          </>
        ) : searchedQuery ? (
          <div style={{
            margin: '30px 16px',
            padding: '36px 20px',
            background: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{ fontWeight: '800', fontSize: '1.15rem', color: '#0f172a', marginBottom: '8px' }}>
              ไม่พบข้อมูลกรมธรรม์
            </div>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              ไม่พบข้อมูลสำหรับคำค้นหา <span style={{ color: '#b45309', fontWeight: '700' }}>"{searchedQuery}"</span><br />
              กรุณาตรวจสอบเลขอีมี่ (IMEI 15 หลัก) หรือเลขกรมธรรม์จากใบเสร็จรับเงินอีกครั้ง
            </div>
          </div>
        ) : (
          <div style={{
            margin: '30px 16px',
            padding: '36px 20px',
            background: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{ fontWeight: '800', fontSize: '1.15rem', color: '#0f172a', marginBottom: '8px' }}>
              ตรวจสอบสิทธิ์ประกัน & ติดตามงานซ่อม
            </div>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              กรุณากรอก <strong>เลข IMEI 15 หลัก</strong>, <strong>เลขที่กรมธรรม์ (POL-...)</strong> หรือ <strong>ชื่อ-นามสกุลผู้ซื้อ</strong> ในช่องค้นหาด้านบน หรือสแกน QR Code จากใบเสร็จหน้าร้านเพื่อดูบัตรรับประกันของคุณ
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation (Mobile App style) */}
      <nav className="bottom-nav">
        <button
          onClick={() => setActiveTab('warranty')}
          className={`nav-item ${activeTab === 'warranty' ? 'active' : ''}`}
        >
          <span>บัตรประกัน</span>
        </button>

        <button
          onClick={() => setActiveTab('repair')}
          className={`nav-item ${activeTab === 'repair' ? 'active' : ''}`}
        >
          <span>สถานะงานซ่อม</span>
        </button>

        <button
          onClick={() => setActiveTab('centers')}
          className={`nav-item ${activeTab === 'centers' ? 'active' : ''}`}
        >
          <span>ศูนย์บริการ</span>
        </button>
      </nav>
    </div>
  );
}
