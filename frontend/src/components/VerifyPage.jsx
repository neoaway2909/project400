import React, { useState } from 'react';
import { verifyByImei, createPolicy, fetchPackages } from '../services/api';
import { StatusBadge, formatDate, formatMoney, daysLeft } from './Shared';

// ============================================================
// Verify / Search Policy Page
// ============================================================
export default function VerifyPage({ addToast }) {
  const [imei, setImei] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [packages, setPackages] = useState([]);
  const [creating, setCreating] = useState(false);

  // Form state สำหรับ Create Policy
  const [form, setForm] = useState({
    store_id: 'SHOP-BKK-01',
    order_id: `ORD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-0001`,
    imei: '',
    device_model: '',
    device_price: '',
    package_code: 'PKG_ACCIDENT_1Y',
    customer: { full_name: '', phone_number: '', email: '' },
    purchased_at: new Date().toISOString()
  });

  const handleVerify = async () => {
    setError('');
    if (!/^[0-9]{15}$/.test(imei)) {
      setError('กรุณากรอก IMEI ให้ครบ 15 หลัก (ตัวเลขเท่านั้น)');
      return;
    }
    setLoading(true);
    setResult(null);
    const res = await verifyByImei(imei);
    setResult(res);
    setLoading(false);
  };

  const handleOpenCreate = async () => {
    const pkgs = await fetchPackages();
    setPackages(pkgs);
    setShowCreateForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    const payload = {
      ...form,
      device_price: parseFloat(form.device_price) || undefined,
    };
    const res = await createPolicy(payload);
    setCreating(false);
    if (res?.success) {
      addToast(`✅ สร้างกรมธรรม์ ${res.policy_no} สำเร็จ!`, 'success');
      setShowCreateForm(false);
      setImei(form.imei);
    } else {
      addToast(`❌ ${res?.message || 'เกิดข้อผิดพลาด'}`, 'error');
    }
  };

  // Quick test IMEIs
  const quickTests = [
    { label: 'iPhone 15 Pro (ACTIVE)', imei: '358941091234567' },
    { label: 'Samsung S24 (ACTIVE)', imei: '490154203237518' },
    { label: 'OPPO (EXPIRED)', imei: '012345678901234' },
    { label: 'ไม่มีในระบบ', imei: '999999999999999' },
  ];

  return (
    <div className="page-content fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-heading">ตรวจสอบสิทธิ์ประกัน (IMEI Verify)</h2>
          <p className="page-subheading">ค้นหากรมธรรม์และตรวจสอบความคุ้มครองด้วยเลขอีมี่</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          ➕ เปิดกรมธรรม์ใหม่
        </button>
      </div>

      {/* Search Box */}
      <div className="card mb-lg">
        <div className="card-title">🔍 ตรวจสอบสิทธิ์ด้วยเลข IMEI</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1 }}>
            <span className="search-icon">📱</span>
            <input
              id="imei-input"
              className="form-input"
              style={{ paddingLeft: '36px', fontSize: '15px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}
              placeholder="กรอก IMEI 15 หลัก เช่น 358941091234567"
              value={imei}
              maxLength={15}
              onChange={e => { setImei(e.target.value.replace(/\D/g, '')); setError(''); setResult(null); }}
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleVerify}
            disabled={loading}
            style={{ minWidth: '140px' }}
          >
            {loading ? <><span className="spinner" />กำลังค้นหา...</> : '🔎 ตรวจสอบ'}
          </button>
        </div>

        {error && (
          <div style={{
            marginTop: '12px', padding: '10px 14px', borderRadius: 'var(--radius-md)',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
            color: 'var(--accent-red)', fontSize: '13px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Quick Test Buttons */}
        <div style={{ marginTop: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '8px' }}>ทดสอบด่วน:</span>
          {quickTests.map(q => (
            <button
              key={q.imei}
              className="btn btn-ghost btn-sm"
              style={{ marginRight: '6px', marginTop: '4px', fontSize: '11px' }}
              onClick={() => { setImei(q.imei); setResult(null); }}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Verification Result */}
      {result && (
        <div className={`verify-result ${result.is_valid ? 'valid' : 'invalid'} fade-in`}>
          <div className="verify-header">
            <div className={`verify-icon ${result.is_valid ? 'valid' : 'invalid'}`}>
              {result.is_valid ? '✅' : '❌'}
            </div>
            <div>
              <div className="verify-title">
                {result.is_valid ? 'มีสิทธิ์รับการซ่อม' : (result.error_code === 'POLICY_NOT_FOUND' ? 'ไม่พบกรมธรรม์' : 'ไม่มีสิทธิ์รับการซ่อม')}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                IMEI: <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--text-secondary)' }}>{result.imei || imei}</span>
              </div>
              {result.validation_reason && (
                <div style={{ fontSize: '12px', color: 'var(--accent-yellow)', marginTop: '4px' }}>
                  ⚠️ เหตุผล: {result.validation_reason}
                </div>
              )}
            </div>
            {result.policy_status && <StatusBadge status={result.policy_status} />}
          </div>

          {result.success && result.policy_no && (
            <>
              {/* Basic Info */}
              <div className="coverage-grid">
                <div className="coverage-item">
                  <div className="coverage-item-label">Policy No.</div>
                  <div className="coverage-item-value mono" style={{ fontSize: '13px', color: 'var(--accent-blue)' }}>
                    {result.policy_no}
                  </div>
                </div>
                <div className="coverage-item">
                  <div className="coverage-item-label">รุ่นเครื่อง</div>
                  <div className="coverage-item-value" style={{ fontSize: '13px' }}>{result.device_model}</div>
                </div>
                <div className="coverage-item">
                  <div className="coverage-item-label">ลูกค้า</div>
                  <div className="coverage-item-value" style={{ fontSize: '13px' }}>{result.customer_name}</div>
                </div>
                <div className="coverage-item">
                  <div className="coverage-item-label">ร้านค้าที่ซื้อ</div>
                  <div className="coverage-item-value" style={{ fontSize: '13px' }}>{result.store_id}</div>
                </div>
              </div>

              {/* Coverage Details */}
              {result.coverage_details && (
                <div style={{ marginTop: '16px', padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    ℹ️ รายละเอียดความคุ้มครอง
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                    {result.coverage_details.package_name}
                  </div>
                  <div className="coverage-grid">
                    <div className="coverage-item">
                      <div className="coverage-item-label">วันหมดอายุ</div>
                      <div className="coverage-item-value" style={{ fontSize: '13px' }}>
                        {formatDate(result.coverage_details.expires_at)}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--accent-yellow)', marginTop: '2px' }}>
                        เหลือ {daysLeft(result.coverage_details.expires_at)} วัน
                      </div>
                    </div>
                    <div className="coverage-item">
                      <div className="coverage-item-label">วงเงินคงเหลือ</div>
                      <div className="coverage-item-value" style={{ color: 'var(--accent-green)' }}>
                        ฿{formatMoney(result.coverage_details.remaining_claim_amount)}
                      </div>
                    </div>
                    <div className="coverage-item">
                      <div className="coverage-item-label">ครั้งที่เคลมแล้ว</div>
                      <div className="coverage-item-value">
                        {result.coverage_details.claim_count} / {result.coverage_details.max_claim_count}
                      </div>
                    </div>
                  </div>

                  {/* Coverage Rules */}
                  {result.coverage_details.claimable_rules?.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>ความคุ้มครองที่ใช้ได้:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {result.coverage_details.claimable_rules.map((r, i) => (
                          <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                            background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)'
                          }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              ✓ {r.rule_name}
                              {r.excess_amount > 0 && <span style={{ color: 'var(--accent-yellow)', marginLeft: '6px' }}>(Excess ฿{formatMoney(r.excess_amount)})</span>}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-green)' }}>
                              สูงสุด ฿{formatMoney(r.max_amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!result.success && result.error_code === 'POLICY_NOT_FOUND' && (
            <div style={{ marginTop: '12px', padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.05)' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                📋 {result.message}
              </p>
              <button className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
                ➕ เปิดกรมธรรม์ใหม่สำหรับเลขนี้
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Policy Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreateForm(false)}>
          <div className="modal fade-in" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">➕ เปิดกรมธรรม์ใหม่</h2>
              <button className="modal-close" onClick={() => setShowCreateForm(false)}>✕</button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Store ID *</label>
                  <input className="form-input" required value={form.store_id}
                    onChange={e => setForm({...form, store_id: e.target.value})} placeholder="SHOP-BKK-01" />
                </div>
                <div className="form-group">
                  <label className="form-label">Order ID *</label>
                  <input className="form-input" required value={form.order_id}
                    onChange={e => setForm({...form, order_id: e.target.value})} placeholder="ORD-20261023-0001" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">IMEI (15 หลัก) *</label>
                <input className="form-input" required pattern="[0-9]{15}" maxLength={15}
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  value={form.imei} onChange={e => setForm({...form, imei: e.target.value.replace(/\D/g, '')})}
                  placeholder="358941091234567" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">รุ่นเครื่อง *</label>
                  <input className="form-input" required value={form.device_model}
                    onChange={e => setForm({...form, device_model: e.target.value})} placeholder="iPhone 15 Pro 256GB" />
                </div>
                <div className="form-group">
                  <label className="form-label">ราคาเครื่อง (บาท)</label>
                  <input className="form-input" type="number" min="0" value={form.device_price}
                    onChange={e => setForm({...form, device_price: e.target.value})} placeholder="41900" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">แพ็กเกจประกัน *</label>
                <select className="form-input form-select" value={form.package_code}
                  onChange={e => setForm({...form, package_code: e.target.value})}>
                  {packages.map(p => (
                    <option key={p.package_code} value={p.package_code}>
                      {p.package_name} — ฿{p.premium_price.toLocaleString()} / {p.coverage_months} เดือน
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ height: 1, background: 'var(--border-color)', margin: '16px 0' }} />
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ข้อมูลลูกค้า</div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">ชื่อ-นามสกุล *</label>
                  <input className="form-input" required value={form.customer.full_name}
                    onChange={e => setForm({...form, customer: {...form.customer, full_name: e.target.value}})}
                    placeholder="สมชาย ใจดี" />
                </div>
                <div className="form-group">
                  <label className="form-label">เบอร์โทร * (10 หลัก)</label>
                  <input className="form-input" required pattern="0[0-9]{9}" maxLength={10}
                    value={form.customer.phone_number}
                    onChange={e => setForm({...form, customer: {...form.customer, phone_number: e.target.value.replace(/\D/g,'')}})}
                    placeholder="0812345678" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">อีเมล</label>
                <input className="form-input" type="email" value={form.customer.email}
                  onChange={e => setForm({...form, customer: {...form.customer, email: e.target.value}})}
                  placeholder="customer@example.com" />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCreateForm(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={creating}>
                  {creating ? <><span className="spinner" /> กำลังสร้าง...</> : '✅ สร้างกรมธรรม์'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
