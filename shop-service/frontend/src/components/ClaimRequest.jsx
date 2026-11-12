import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { formatPrice, formatDate, validateImeiClient } from './shared';

const PARTNER_CENTERS = [
  { id: 'CTR-SIAM-01',    name: 'ศูนย์บริการพาร์ทเนอร์ สยามพารากอน (iService)', zone: 'กรุงเทพฯ ชั้นใน' },
  { id: 'CTR-LADPRAO-02', name: 'ศูนย์ซ่อมพาร์ทเนอร์ เซ็นทรัล ลาดพร้าว',        zone: 'กรุงเทพฯ ตอนเหนือ' },
  { id: 'CTR-BANGNA-03',  name: 'ศูนย์บริการมาตรฐาน เมกาบางนา',                zone: 'สมุทรปราการ / บางนา' },
];

const SYMPTOM_TYPES = [
  { id: 'SCREEN',  label: 'หน้าจอแตก / ร้าว',       type: 'SCREEN_CRACK', defaultCost: 6500 },
  { id: 'WATER',   label: 'เครื่องตกน้ำ / ความชื้น', type: 'WATER_DAMAGE', defaultCost: 8000 },
  { id: 'BATTERY', label: 'แบตเตอรี่ / ระบบไฟ',      type: 'ACCIDENTAL',   defaultCost: 3500 },
  { id: 'OTHER',   label: 'อุบัติเหตุตัวเครื่องอื่นๆ', type: 'ACCIDENTAL',   defaultCost: 5000 },
];

const REPAIR_STATUS_LABELS = {
  RECEIVED:         { label: 'รับเครื่องแล้ว',    cls: 'in-stock' },
  DIAGNOSING:       { label: 'กำลังตรวจสอบ',     cls: 'reserved' },
  WAITING_PARTS:    { label: 'รออะไหล่',         cls: 'claim-repair' },
  IN_PROGRESS:      { label: 'กำลังซ่อม',        cls: 'claim-repair' },
  REPAIR_COMPLETED: { label: 'ซ่อมเสร็จ',        cls: 'in-stock' },
  DELIVERED:        { label: 'ส่งคืนร้านแล้ว',     cls: 'sold' },
  CANCELLED:        { label: 'ยกเลิก',           cls: 'defective' },
};

export default function ClaimRequest({ initialImei = '' }) {
  const [imeiInput, setImeiInput] = useState(initialImei);
  const [verifying, setVerifying] = useState(false);
  const [policyInfo, setPolicyInfo] = useState(null);
  const [verifyError, setVerifyError] = useState('');

  // Form states
  const [symptomCategory, setSymptomCategory] = useState('SCREEN');
  const [symptomDetail, setSymptomDetail] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('6500');
  const [selectedCenter, setSelectedCenter] = useState('CTR-SIAM-01');
  const [contactPhone, setContactPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [submitError, setSubmitError] = useState('');

  // Recent claims list (Read-only status tracking)
  const [claims, setClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(true);

  const loadClaims = useCallback(async () => {
    setClaimsLoading(true);
    try {
      const res = await api.getClaims();
      setClaims(res.data || []);
    } catch {
      setClaims([]);
    } finally {
      setClaimsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  const handleVerifyImei = useCallback(async (targetImei) => {
    const clean = String(targetImei ?? imeiInput).trim();
    const { valid, error } = validateImeiClient(clean);
    if (!valid) {
      setVerifyError(error);
      setPolicyInfo(null);
      return;
    }

    setVerifying(true);
    setVerifyError('');
    setPolicyInfo(null);
    setCreatedTicket(null);
    setSubmitError('');

    try {
      const data = await api.verifyWarranty(clean);
      setPolicyInfo(data);
      if (data.customer_phone) setContactPhone(data.customer_phone);
    } catch (err) {
      setVerifyError(err.message || 'ไม่พบข้อมูลกรมธรรม์สำหรับเลข IMEI นี้');
    } finally {
      setVerifying(false);
    }
  }, [imeiInput]);

  useEffect(() => {
    if (initialImei && /^[0-9]{15}$/.test(initialImei)) {
      setImeiInput(initialImei);
      handleVerifyImei(initialImei);
    }
  }, [initialImei, handleVerifyImei]);

  const handleSelectCategory = (cat) => {
    setSymptomCategory(cat.id);
    setEstimatedCost(String(cat.defaultCost));
  };

  const handleCreateClaim = async (e) => {
    e.preventDefault();
    if (!policyInfo || !policyInfo.is_valid) return;

    const cat = SYMPTOM_TYPES.find(c => c.id === symptomCategory) || SYMPTOM_TYPES[0];
    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await api.createClaim({
        imei: policyInfo.imei,
        policy_no: policyInfo.policy_no,
        center_id: selectedCenter,
        coverage_type: cat.type,
        defect_symptom: `[${cat.label}] ${symptomDetail}`.trim(),
        estimated_cost: Number(estimatedCost || cat.defaultCost),
        contact_phone: contactPhone,
      });
      setCreatedTicket(res.data);
      setSymptomDetail('');
      // Refresh policy balance & claim list immediately
      const refreshedPolicy = await api.verifyWarranty(policyInfo.imei).catch(() => null);
      if (refreshedPolicy) setPolicyInfo(refreshedPolicy);
      await loadClaims();
    } catch (err) {
      setSubmitError(err.message || 'ไม่สามารถเปิดใบแจ้งเคลมได้');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>แจ้งเคลมประกัน & ส่งซ่อมหน้าร้าน (Warranty Claim Intake)</h2>
          <p>ตรวจสอบสิทธิ์ประกันของลูกค้าด้วยเลข IMEI เปิดใบงานส่งศูนย์ซ่อม และตัดสถานะเครื่องเป็น CLAIM_REPAIR</p>
        </div>
        <button className="btn btn-secondary" onClick={loadClaims}>
          รีเฟรชรายการเคลม
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 24, alignItems: 'flex-start' }}>
        {/* LEFT COLUMN: Verify IMEI & Create Claim Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Step 1: Verify IMEI */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">1. ตรวจสอบสิทธิ์กรมธรรม์ด้วยเลข IMEI</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.95rem' }}
                  placeholder="กรอกเลข IMEI 15 หลักของลูกค้า..."
                  maxLength={15}
                  value={imeiInput}
                  onChange={e => setImeiInput(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyImei()}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => handleVerifyImei()}
                  disabled={verifying || imeiInput.length !== 15}
                  style={{ minWidth: 130 }}
                >
                  {verifying ? 'ตรวจสอบ...' : 'ตรวจสอบสิทธิ์'}
                </button>
              </div>

              {verifyError && (
                <div className="alert alert-error" style={{ marginTop: 12 }}>
                  <span>{verifyError}</span>
                </div>
              )}

              {policyInfo && (
                <div style={{
                  marginTop: 16,
                  padding: 16,
                  borderRadius: 'var(--radius-md)',
                  background: policyInfo.is_valid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${policyInfo.is_valid ? 'var(--clr-success-500)' : 'var(--clr-danger-500)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: policyInfo.is_valid ? 'var(--clr-success-500)' : 'var(--clr-danger-500)' }}>
                        {policyInfo.is_valid ? 'กรมธรรม์คุ้มครองปกติ (พร้อมเคลม)' : 'ไม่สามารถเคลมได้'}
                      </span>
                      <div style={{ fontSize: '.78rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--clr-text-muted)', marginTop: 2 }}>
                        เลขกรมธรรม์: <strong>{policyInfo.policy_no}</strong> · สถานะ: {policyInfo.policy_status}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '.83rem' }}>
                    <div><strong>รุ่นเครื่อง:</strong> {policyInfo.device_model}</div>
                    <div><strong>ผู้ถือประกัน:</strong> {policyInfo.customer_name}</div>
                    <div><strong>แพ็กเกจ:</strong> {policyInfo.coverage_details?.package_name}</div>
                    <div><strong>วงเงินคงเหลือ:</strong> <span style={{ color: 'var(--clr-primary-500)', fontWeight: 700 }}>{formatPrice(policyInfo.coverage_details?.remaining_claim_amount)}</span></div>
                    <div><strong>จำนวนครั้งเคลม:</strong> {policyInfo.coverage_details?.claim_count} / {policyInfo.coverage_details?.max_claim_count} ครั้ง</div>
                    <div><strong>หมดอายุ:</strong> {formatDate(policyInfo.coverage_details?.expires_at)}</div>
                  </div>

                  {!policyInfo.is_valid && policyInfo.validation_reason && (
                    <div style={{ marginTop: 8, color: 'var(--clr-danger-500)', fontSize: '.82rem', fontWeight: 600 }}>
                      สาเหตุ: {policyInfo.validation_reason}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Claim Submission Form */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">2. บันทึกอาการเสีย & ส่งเข้าศูนย์ซ่อม</span>
            </div>
            <div className="card-body">
              {createdTicket ? (
                <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--clr-success-500)', marginBottom: 6 }}>
                    เปิดใบงานเคลมส่งซ่อมสำเร็จ!
                  </h3>
                  <p style={{ fontSize: '.88rem', color: 'var(--clr-text-muted)', marginBottom: 14 }}>
                    หมายเลขตั๋วงานซ่อม: <strong style={{ color: 'var(--clr-primary-500)', fontFamily: "'JetBrains Mono', monospace" }}>{createdTicket.ticket_id}</strong><br />
                    ศูนย์ที่รับผิดชอบ: <strong>{createdTicket.center_name}</strong><br />
                    ประกันรับผิดชอบ: <strong>{formatPrice(createdTicket.cost_covered_by_insurance)}</strong> · ลูกค้าชำระส่วนต่าง: <strong>{formatPrice(createdTicket.customer_excess_paid)}</strong>
                  </p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setCreatedTicket(null)}
                    >
                      แจ้งเคลมรายการอื่นต่อ
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateClaim} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {submitError && (
                    <div className="alert alert-error">
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div>
                    <label className="form-label">ประเภทความเสียหาย *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {SYMPTOM_TYPES.map(cat => (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => handleSelectCategory(cat)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: symptomCategory === cat.id ? '2px solid var(--clr-primary-500)' : '1px solid var(--clr-border)',
                            background: symptomCategory === cat.id ? 'var(--clr-surface-2)' : 'var(--clr-surface)',
                            color: 'var(--clr-text)',
                            fontWeight: symptomCategory === cat.id ? 700 : 500,
                            fontSize: '.82rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="form-label">รายละเอียดอาการเสีย *</label>
                    <textarea
                      required
                      rows={3}
                      className="form-control"
                      placeholder="ระบุอาการเสีย เช่น หน้าจอแตกร้าวจากการตกกระแทก..."
                      value={symptomDetail}
                      onChange={e => setSymptomDetail(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="form-label">ค่าซ่อมประเมินเบื้องต้น (บาท) *</label>
                      <input
                        type="number"
                        min="0"
                        required
                        className="form-control"
                        value={estimatedCost}
                        onChange={e => setEstimatedCost(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label">เบอร์โทรติดต่อลูกค้า *</label>
                      <input
                        type="tel"
                        required
                        className="form-control"
                        placeholder="0812345678"
                        value={contactPhone}
                        onChange={e => setContactPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">เลือกศูนย์ซ่อมพาร์ทเนอร์ที่ส่งเครื่อง *</label>
                    <select
                      className="form-control"
                      value={selectedCenter}
                      onChange={e => setSelectedCenter(e.target.value)}
                    >
                      {PARTNER_CENTERS.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.zone})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-full"
                    disabled={submitting || !policyInfo || !policyInfo.is_valid}
                  >
                    {submitting
                      ? 'กำลังเปิดตั๋วงานซ่อม...'
                      : !policyInfo
                      ? 'กรุณาตรวจสอบเลข IMEI ด้านบนก่อน'
                      : !policyInfo.is_valid
                      ? 'ไม่สามารถเปิดเคลมได้ (กรมธรรม์ไม่พร้อมใช้งาน)'
                      : 'ยืนยันเปิดใบงานเคลม & ส่งศูนย์ซ่อม'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active & Past Claim Tickets */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">รายการส่งเคลม / งานซ่อมล่าสุด ({claims.length} รายการ)</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {claimsLoading ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                กำลังโหลดรายการเคลม...
              </div>
            ) : claims.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                ยังไม่มีรายการแจ้งเคลมในระบบ
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {claims.map(t => {
                  const st = REPAIR_STATUS_LABELS[t.repair_status] || { label: t.repair_status, cls: '' };
                  return (
                    <div
                      key={t.ticket_id}
                      style={{
                        padding: '14px 18px',
                        borderBottom: '1px solid var(--clr-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: 'var(--clr-primary-400)', fontFamily: "'JetBrains Mono', monospace", fontSize: '.92rem' }}>
                          {t.ticket_id}
                        </strong>
                        <span className={`badge ${st.cls}`} style={{ fontSize: '.72rem' }}>
                          <span className="badge-dot" />
                          {st.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '.8rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--clr-text-muted)' }}>
                        IMEI: <strong>{t.imei}</strong> · กรมธรรม์: {t.policy_no}
                      </div>
                      <div style={{ fontSize: '.84rem', fontWeight: 600 }}>
                        {t.defect_symptom}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.76rem', color: 'var(--clr-text-muted)' }}>
                        <span>{t.center_name}</span>
                        <span>ประกันจ่าย: <strong style={{ color: 'var(--clr-success-500)' }}>{formatPrice(t.cost_covered_by_insurance)}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

