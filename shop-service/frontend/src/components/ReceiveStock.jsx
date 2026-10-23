import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { mockBrands, mockModels } from '../data/mockData';
import { validateImeiClient, StatusBadge } from './shared';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/* ── IMEI Chip ───────────────────────────────── */
function ImeiChip({ item, onRemove }) {
  return (
    <div className={`imei-batch-item ${item.valid ? 'valid' : 'invalid'}`}>
      <span style={{ flex: 1 }}>{item.imei}</span>
      {item.valid
        ? <span style={{ color: 'var(--clr-success-400)', fontSize: '.9rem' }}>✓</span>
        : <span style={{ color: 'var(--clr-danger-400)', fontSize: '.75rem' }}>{item.error}</span>}
      <button className="imei-remove-btn" onClick={() => onRemove(item.imei)} title="ลบ">✕</button>
    </div>
  );
}

export default function ReceiveStock() {
  // Scanner field
  const [scanValue,  setScanValue]  = useState('');
  const [scanState,  setScanState]  = useState('idle'); // idle | scanning | ok | fail
  const [scanMsg,    setScanMsg]    = useState('');
  const scanRef = useRef(null);

  // Batch list
  const [imeiList, setImeiList] = useState([]);

  // Form
  const [brands,    setBrands]    = useState([]);
  const [models,    setModels]    = useState([]);
  const [formData,  setFormData]  = useState({
    modelId: '', lotNumber: '', supplierId: '',
    receivedDate: new Date().toISOString().slice(0, 10),
    purchasePrice: '', note: '',
  });

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [bRes, mRes] = USE_MOCK
          ? [{ data: mockBrands }, { data: mockModels }]
          : await Promise.all([api.getBrands(), api.getModels()]);
        setBrands(bRes.data);
        setModels(mRes.data);
      } catch {
        setBrands(mockBrands);
        setModels(mockModels);
      }
    };
    loadMeta();
  }, []);

  // Filter models by selected brand (via modelId lookup)
  const selectedModel = models.find(m => m.id === Number(formData.modelId));
  const filteredModels = models; // show all in dropdown

  /* ─── Scanner Input Handler ─────────────────────── */
  const handleScan = (val) => {
    setScanValue(val);
    if (val.length < 15) {
      setScanState('scanning');
      setScanMsg('');
      return;
    }
    if (val.length === 15) {
      const { valid, error } = validateImeiClient(val);
      if (!valid) {
        setScanState('fail');
        setScanMsg(error);
        return;
      }
      // Check duplicate
      if (imeiList.some(i => i.imei === val)) {
        setScanState('fail');
        setScanMsg('IMEI นี้ถูกเพิ่มแล้ว');
        return;
      }
      setScanState('ok');
      setScanMsg('✓ IMEI ถูกต้อง เพิ่มในรายการแล้ว');
      setImeiList(prev => [{ imei: val, valid: true, error: null }, ...prev]);
      // Auto-clear after short delay (simulate scanner behavior)
      setTimeout(() => {
        setScanValue('');
        setScanState('idle');
        setScanMsg('');
        scanRef.current?.focus();
      }, 800);
    }
  };

  const handleKeyDown = (e) => {
    // On Enter: also process
    if (e.key === 'Enter') handleScan(scanValue);
  };

  const removeImei = (imei) => {
    setImeiList(prev => prev.filter(i => i.imei !== imei));
  };

  /* ─── Submit ─────────────────────────────────────── */
  const handleSubmit = async () => {
    const validImeis = imeiList.filter(i => i.valid).map(i => i.imei);
    if (!validImeis.length) return alert('กรุณาสแกน IMEI อย่างน้อย 1 เครื่อง');
    if (!formData.modelId) return alert('กรุณาเลือกรุ่นโทรศัพท์');

    setSubmitting(true);
    setSubmitResult(null);
    try {
      const payload = {
        imeis: validImeis,
        modelId: Number(formData.modelId),
        lotNumber:    formData.lotNumber    || undefined,
        receivedDate: formData.receivedDate || undefined,
        purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : undefined,
        note: formData.note || undefined,
      };

      const res = USE_MOCK
        ? { success: true, inserted: validImeis.length, data: validImeis.map(i => ({ imei: i, status: 'IN_STOCK' })) }
        : await api.receiveStock(payload);

      setSubmitResult({ type: 'success', message: `✅ บันทึกสำเร็จ! รับเข้าสต็อก ${res.inserted} เครื่อง` });
      setImeiList([]);
      setFormData(f => ({ ...f, lotNumber: '', purchasePrice: '', note: '' }));
    } catch (e) {
      const detail = e.data?.duplicates?.join(', ');
      setSubmitResult({ type: 'error', message: `❌ ${e.message}${detail ? ` (${detail})` : ''}` });
    } finally {
      setSubmitting(false);
    }
  };

  const validCount = imeiList.filter(i => i.valid).length;
  const scanZoneClass = scanState === 'ok' ? 'ok' : scanState === 'fail' ? 'fail' : scanState === 'scanning' ? 'scanning' : '';

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>📥 รับเครื่องเข้าคลัง</h2>
          <p>สแกน IMEI หลาย IMEI พร้อมกัน รองรับ Barcode Scanner</p>
        </div>
      </div>

      <div className="flex gap-4" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* LEFT: Scanner Zone */}
        <div style={{ flex: '1 1 400px' }}>
          {/* Scanner Input */}
          <div className={`scanner-zone ${scanZoneClass}`} style={{ marginBottom: 20 }}>
            <span className="scanner-icon">
              {scanState === 'ok' ? '✅' : scanState === 'fail' ? '❌' : '📷'}
            </span>
            <h3 style={{ marginBottom: 6, fontWeight: 700 }}>สแกน IMEI</h3>
            <p style={{ fontSize: '.82rem', color: 'var(--clr-text-muted)', marginBottom: 18 }}>
              ต่อ Barcode Scanner แล้วยิงสแกน หรือพิมพ์เลข IMEI 15 หลัก
            </p>
            <div className="scanner-input-wrapper">
              <span className="scanner-input-icon">🔍</span>
              <input
                ref={scanRef}
                className={`form-control form-control-lg ${scanState === 'ok' ? 'success' : scanState === 'fail' ? 'error' : ''}`}
                placeholder="000000000000000"
                value={scanValue}
                onChange={e => handleScan(e.target.value.replace(/\D/g, '').slice(0, 15))}
                onKeyDown={handleKeyDown}
                maxLength={15}
                autoFocus
              />
            </div>
            {scanMsg && (
              <p style={{
                marginTop: 10, fontSize: '.8rem',
                color: scanState === 'ok' ? 'var(--clr-success-400)' : 'var(--clr-danger-400)',
                fontWeight: 600,
              }}>
                {scanMsg}
              </p>
            )}
            <p style={{ marginTop: 8, fontSize: '.72rem', color: 'var(--clr-text-subtle)' }}>
              ตัวเลขที่พิมพ์: {scanValue.length}/15
            </p>
          </div>

          {/* Batch List */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">รายการ IMEI ที่สแกน</span>
              <div className="flex gap-2 items-center">
                <span className="badge in-stock">{validCount} เครื่อง</span>
                {imeiList.length > 0 && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setImeiList([])}>
                    ล้างทั้งหมด
                  </button>
                )}
              </div>
            </div>
            <div className="card-body" style={{ padding: 14 }}>
              {imeiList.length === 0
                ? <p style={{ textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: '.85rem', padding: '24px 0' }}>ยังไม่มี IMEI ในรายการ</p>
                : (
                  <div className="imei-batch-list">
                    {imeiList.map(item => (
                      <ImeiChip key={item.imei} item={item} onRemove={removeImei} />
                    ))}
                  </div>
                )
              }
            </div>
          </div>
        </div>

        {/* RIGHT: Form */}
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">ข้อมูลการรับเครื่อง</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">รุ่นโทรศัพท์ *</label>
                <select
                  className="form-control"
                  value={formData.modelId}
                  onChange={e => setFormData(f => ({ ...f, modelId: e.target.value }))}
                >
                  <option value="">-- เลือกรุ่น --</option>
                  {filteredModels.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.model_name} {m.storage} ({m.color})
                    </option>
                  ))}
                </select>
              </div>

              {selectedModel && (
                <div className="alert alert-info" style={{ padding: '10px 14px' }}>
                  <span>💰</span>
                  <span style={{ fontSize: '.82rem' }}>
                    ราคาขาย: <strong>{Number(selectedModel.selling_price).toLocaleString('th-TH')} ฿</strong>
                  </span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">หมายเลข Lot</label>
                <input
                  className="form-control"
                  placeholder="เช่น LOT-2025-005"
                  value={formData.lotNumber}
                  onChange={e => setFormData(f => ({ ...f, lotNumber: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">วันที่รับสินค้า</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.receivedDate}
                  onChange={e => setFormData(f => ({ ...f, receivedDate: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">ราคาทุน (บาท)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0"
                  value={formData.purchasePrice}
                  onChange={e => setFormData(f => ({ ...f, purchasePrice: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">หมายเหตุ</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="บันทึกเพิ่มเติม..."
                  value={formData.note}
                  onChange={e => setFormData(f => ({ ...f, note: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {submitResult && (
            <div className={`alert alert-${submitResult.type === 'success' ? 'success' : 'error'}`}>
              <span style={{ flexShrink: 0 }}>{submitResult.type === 'success' ? '✅' : '❌'}</span>
              <span>{submitResult.message}</span>
            </div>
          )}

          <button
            className="btn btn-primary btn-lg w-full"
            onClick={handleSubmit}
            disabled={submitting || validCount === 0 || !formData.modelId}
          >
            {submitting ? '⏳ กำลังบันทึก...' : `📥 บันทึกรับเข้าสต็อก (${validCount} เครื่อง)`}
          </button>
        </div>
      </div>
    </div>
  );
}
