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

  // Product / Model Management Modals
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [savingBrand, setSavingBrand] = useState(false);

  const [showModelModal, setShowModelModal] = useState(false);
  const [newModelForm, setNewModelForm] = useState({
    brand_id: '',
    model_name: '',
    storage: '256GB',
    color: '',
    selling_price: '',
    cost_price: '',
  });
  const [savingModel, setSavingModel] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editModelForm, setEditModelForm] = useState({
    id: '',
    model_name: '',
    storage: '',
    color: '',
    selling_price: '',
    cost_price: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const [showCatalogModal, setShowCatalogModal] = useState(false);

  const loadMeta = async () => {
    try {
      const [bRes, mRes] = USE_MOCK
        ? [{ data: mockBrands }, { data: mockModels }]
        : await Promise.all([api.getBrands(), api.getModels()]);
      setBrands(bRes.data || []);
      setModels(mRes.data || []);
    } catch {
      setBrands(mockBrands);
      setModels(mockModels);
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  // Filter models by selected brand (via modelId lookup)
  const selectedModel = models.find(m => m.id === Number(formData.modelId));
  const filteredModels = models; // show all in dropdown

  const handleCreateBrand = async (e) => {
    e.preventDefault();
    const name = newBrandName.trim();
    if (!name) return alert('กรุณากรอกชื่อยี่ห้อ');
    setSavingBrand(true);
    try {
      const res = await api.createBrand({ name });
      const created = res?.data || { id: brands.length + 1, name, is_active: true };
      setBrands(prev => [...prev.filter(b => b.id !== created.id), created]);
      setNewModelForm(f => ({ ...f, brand_id: String(created.id) }));
      setNewBrandName('');
      setShowBrandModal(false);
      setSubmitResult({ type: 'success', message: `เพิ่มยี่ห้อ "${created.name}" สำเร็จ` });
    } catch (err) {
      alert(err.message || 'ไม่สามารถเพิ่มยี่ห้อได้');
    } finally {
      setSavingBrand(false);
    }
  };

  const handleCreateModel = async (e) => {
    e.preventDefault();
    if (!newModelForm.brand_id) return alert('กรุณาเลือกยี่ห้อ');
    if (!newModelForm.model_name.trim()) return alert('กรุณากรอกชื่อรุ่นโทรศัพท์');
    if (!newModelForm.storage.trim()) return alert('กรุณาระบุความจุ');
    if (!newModelForm.color.trim()) return alert('กรุณาระบุสีตัวเครื่อง');
    if (!newModelForm.selling_price || Number(newModelForm.selling_price) <= 0) {
      return alert('กรุณาระบุราคาขายที่ถูกต้อง');
    }
    setSavingModel(true);
    try {
      const brandObj = brands.find(b => Number(b.id) === Number(newModelForm.brand_id));
      const payload = {
        brand_id: Number(newModelForm.brand_id),
        brand_name: brandObj?.name || '',
        model_name: newModelForm.model_name.trim(),
        storage: newModelForm.storage.trim(),
        color: newModelForm.color.trim(),
        selling_price: Number(newModelForm.selling_price),
        cost_price: Number(newModelForm.cost_price || newModelForm.selling_price),
      };
      const res = await api.createModel(payload);
      const created = {
        ...payload,
        ...(res?.data || {}),
        id: res?.data?.id || models.length + 1,
      };
      setModels(prev => [...prev.filter(m => m.id !== created.id), created]);
      setFormData(f => ({ ...f, modelId: String(created.id), purchasePrice: String(created.cost_price || '') }));
      setNewModelForm({ brand_id: '', model_name: '', storage: '256GB', color: '', selling_price: '', cost_price: '' });
      setShowModelModal(false);
      setSubmitResult({ type: 'success', message: `เพิ่มรุ่น "${created.model_name} ${created.storage} (${created.color})" สำเร็จ` });
    } catch (err) {
      alert(err.message || 'ไม่สามารถเพิ่มรุ่นโทรศัพท์ได้');
    } finally {
      setSavingModel(false);
    }
  };

  const openEditModel = (model) => {
    if (!model) return;
    setEditModelForm({
      id: model.id,
      model_name: model.model_name || '',
      storage: model.storage || '',
      color: model.color || '',
      selling_price: String(model.selling_price || ''),
      cost_price: String(model.cost_price || ''),
    });
    setShowEditModal(true);
  };

  const handleUpdateModel = async (e) => {
    e.preventDefault();
    if (!editModelForm.id) return;
    if (!editModelForm.selling_price || Number(editModelForm.selling_price) <= 0) {
      return alert('กรุณาระบุราคาขายที่ถูกต้อง');
    }
    setSavingEdit(true);
    try {
      const payload = {
        model_name: editModelForm.model_name.trim(),
        storage: editModelForm.storage.trim(),
        color: editModelForm.color.trim(),
        selling_price: Number(editModelForm.selling_price),
        cost_price: editModelForm.cost_price ? Number(editModelForm.cost_price) : undefined,
      };
      await api.updateModel(editModelForm.id, payload);
      setModels(prev =>
        prev.map(m => (Number(m.id) === Number(editModelForm.id) ? { ...m, ...payload } : m))
      );
      setShowEditModal(false);
      setSubmitResult({
        type: 'success',
        message: `อัปเดตราคาขาย "${payload.model_name} ${payload.storage}" เป็น ฿${Number(payload.selling_price).toLocaleString('th-TH')} สำเร็จ`,
      });
    } catch (err) {
      alert(err.message || 'ไม่สามารถแก้ไขข้อมูลรุ่นโทรศัพท์ได้');
    } finally {
      setSavingEdit(false);
    }
  };

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

      setSubmitResult({ type: 'success', message: `บันทึกสำเร็จ! รับเข้าสต็อก ${res.inserted} เครื่อง` });
      setImeiList([]);
      setFormData(f => ({ ...f, lotNumber: '', purchasePrice: '', note: '' }));
    } catch (e) {
      const detail = e.data?.duplicates?.join(', ');
      setSubmitResult({ type: 'error', message: `${e.message}${detail ? ` (${detail})` : ''}` });
    } finally {
      setSubmitting(false);
    }
  };

  const validCount = imeiList.filter(i => i.valid).length;
  const scanZoneClass = scanState === 'ok' ? 'ok' : scanState === 'fail' ? 'fail' : scanState === 'scanning' ? 'scanning' : '';

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>รับเครื่องเข้าคลัง & จัดการรุ่นสินค้า</h2>
          <p>สแกน IMEI หลายเครื่องพร้อมกัน รองรับ Barcode Scanner และจัดการยี่ห้อ / รุ่นโทรศัพท์ / ราคาขาย</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowBrandModal(true)}
          >
            + เพิ่มยี่ห้อใหม่
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (!newModelForm.brand_id && brands.length > 0) {
                setNewModelForm(f => ({ ...f, brand_id: String(brands[0].id) }));
              }
              setShowModelModal(true);
            }}
          >
            + เพิ่มรุ่นโทรศัพท์ใหม่
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowCatalogModal(true)}
          >
            จัดการรุ่นสินค้า / แก้ไขราคาขาย ({models.length} รุ่น)
          </button>
        </div>
      </div>

      <div className="flex gap-4" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* LEFT: Scanner Zone */}
        <div style={{ flex: '1 1 400px' }}>
          {/* Scanner Input */}
          <div className={`scanner-zone ${scanZoneClass}`} style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 6, fontWeight: 700 }}>สแกน IMEI</h3>
            <p style={{ fontSize: '.82rem', color: 'var(--clr-text-muted)', marginBottom: 18 }}>
              ต่อ Barcode Scanner แล้วยิงสแกน หรือพิมพ์เลข IMEI 15 หลัก
            </p>
            <div className="scanner-input-wrapper">
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>รุ่นโทรศัพท์ *</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setShowBrandModal(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--clr-primary-400)',
                        fontSize: '.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      + เพิ่มยี่ห้อ
                    </button>
                    <span style={{ color: 'var(--clr-border)' }}>|</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newModelForm.brand_id && brands.length > 0) {
                          setNewModelForm(f => ({ ...f, brand_id: String(brands[0].id) }));
                        }
                        setShowModelModal(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--clr-primary-400)',
                        fontSize: '.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      + เพิ่มรุ่นใหม่
                    </button>
                  </div>
                </div>
                <select
                  className="form-control"
                  value={formData.modelId}
                  onChange={e => setFormData(f => ({ ...f, modelId: e.target.value }))}
                >
                  <option value="">-- เลือกรุ่น --</option>
                  {filteredModels.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.brand_name ? `[${m.brand_name}] ` : ''}{m.model_name} {m.storage} ({m.color}) — ฿{Number(m.selling_price || 0).toLocaleString('th-TH')}
                    </option>
                  ))}
                </select>
              </div>

              {selectedModel && (
                <div className="alert alert-info" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '.82rem' }}>
                    ราคาขายหน้าร้าน: <strong>{Number(selectedModel.selling_price).toLocaleString('th-TH')} ฿</strong>
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 10px', fontSize: '.75rem' }}
                    onClick={() => openEditModel(selectedModel)}
                  >
                    แก้ไขราคาขาย
                  </button>
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
              <span>{submitResult.message}</span>
            </div>
          )}

          <button
            className="btn btn-primary btn-lg w-full"
            onClick={handleSubmit}
            disabled={submitting || validCount === 0 || !formData.modelId}
          >
            {submitting ? 'กำลังบันทึก...' : `บันทึกรับเข้าสต็อก (${validCount} เครื่อง)`}
          </button>
        </div>
      </div>

      {/* Modal 1: Add Brand */}
      {showBrandModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
          }}
          onClick={e => e.target === e.currentTarget && setShowBrandModal(false)}
        >
          <div style={{
            background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-lg)', width: 400, maxWidth: '94vw', padding: 24,
            boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>เพิ่มยี่ห้อโทรศัพท์ใหม่</h3>
              <button
                type="button"
                onClick={() => setShowBrandModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--clr-text-muted)' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateBrand} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">ชื่อยี่ห้อ (Brand Name) *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น Xiaomi, Vivo, Nothing, Honor"
                  value={newBrandName}
                  onChange={e => setNewBrandName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div style={{ fontSize: '.78rem', color: 'var(--clr-text-muted)' }}>
                ยี่ห้อที่มีอยู่แล้ว: {brands.map(b => b.name).join(', ') || '-'}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowBrandModal(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }} disabled={savingBrand}>
                  {savingBrand ? 'กำลังบันทึก...' : 'บันทึกยี่ห้อใหม่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Phone Model */}
      {showModelModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
          }}
          onClick={e => e.target === e.currentTarget && setShowModelModal(false)}
        >
          <div style={{
            background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-lg)', width: 480, maxWidth: '94vw', padding: 24,
            boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>เพิ่มรุ่นโทรศัพท์ใหม่</h3>
              <button
                type="button"
                onClick={() => setShowModelModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--clr-text-muted)' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateModel} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">ยี่ห้อ (Brand) *</label>
                  <button
                    type="button"
                    onClick={() => { setShowModelModal(false); setShowBrandModal(true); }}
                    style={{ background: 'none', border: 'none', color: 'var(--clr-primary-400)', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    + เพิ่มยี่ห้อใหม่
                  </button>
                </div>
                <select
                  className="form-control"
                  value={newModelForm.brand_id}
                  onChange={e => setNewModelForm(f => ({ ...f, brand_id: e.target.value }))}
                  required
                >
                  <option value="">-- เลือกยี่ห้อ --</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">ชื่อรุ่นโทรศัพท์ *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น iPhone 16 Pro Max, Galaxy S25 Ultra"
                  value={newModelForm.model_name}
                  onChange={e => setNewModelForm(f => ({ ...f, model_name: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">ความจุ (Storage) *</label>
                  <select
                    className="form-control"
                    value={newModelForm.storage}
                    onChange={e => setNewModelForm(f => ({ ...f, storage: e.target.value }))}
                  >
                    <option value="128GB">128GB</option>
                    <option value="256GB">256GB</option>
                    <option value="512GB">512GB</option>
                    <option value="1TB">1TB</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">สีตัวเครื่อง (Color) *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="เช่น Natural Titanium, Black"
                    value={newModelForm.color}
                    onChange={e => setNewModelForm(f => ({ ...f, color: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">ราคาขายหน้าร้าน (บาท) *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    placeholder="เช่น 48900"
                    value={newModelForm.selling_price}
                    onChange={e => setNewModelForm(f => ({ ...f, selling_price: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ราคาทุน (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="เช่น 42000"
                    value={newModelForm.cost_price}
                    onChange={e => setNewModelForm(f => ({ ...f, cost_price: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModelModal(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }} disabled={savingModel}>
                  {savingModel ? 'กำลังบันทึก...' : 'บันทึกรุ่นโทรศัพท์ใหม่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Edit Model / Selling Price */}
      {showEditModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200,
          }}
          onClick={e => e.target === e.currentTarget && setShowEditModal(false)}
        >
          <div style={{
            background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-lg)', width: 440, maxWidth: '94vw', padding: 24,
            boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>แก้ไขราคาขาย / ข้อมูลรุ่นสินค้า</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--clr-text-muted)' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateModel} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">ชื่อรุ่นโทรศัพท์ *</label>
                <input
                  type="text"
                  className="form-control"
                  value={editModelForm.model_name}
                  onChange={e => setEditModelForm(f => ({ ...f, model_name: e.target.value }))}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">ความจุ *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editModelForm.storage}
                    onChange={e => setEditModelForm(f => ({ ...f, storage: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">สี *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editModelForm.color}
                    onChange={e => setEditModelForm(f => ({ ...f, color: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">ราคาขายหน้าร้าน (บาท) *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={editModelForm.selling_price}
                    onChange={e => setEditModelForm(f => ({ ...f, selling_price: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ราคาทุน (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={editModelForm.cost_price}
                    onChange={e => setEditModelForm(f => ({ ...f, cost_price: e.target.value }))}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }} disabled={savingEdit}>
                  {savingEdit ? 'กำลังบันทึก...' : 'บันทึกราคาขายใหม่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Product / Model Catalog Manager Table */}
      {showCatalogModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.72)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
          }}
          onClick={e => e.target === e.currentTarget && setShowCatalogModal(false)}
        >
          <div style={{
            background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-lg)', width: 760, maxWidth: '95vw', maxHeight: '86vh',
            display: 'flex', flexDirection: 'column', padding: 24,
            boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  จัดการรุ่นสินค้า & ราคาขายทั้งหมด ({models.length} รุ่น)
                </h3>
                <div style={{ fontSize: '.78rem', color: 'var(--clr-text-muted)' }}>
                  คลิกปุ่มแก้ไขราคาขายในแต่ละแถว หรือเพิ่มยี่ห้อและรุ่นใหม่ได้ทันที
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowBrandModal(true)}
                >
                  + เพิ่มยี่ห้อ
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    if (!newModelForm.brand_id && brands.length > 0) {
                      setNewModelForm(f => ({ ...f, brand_id: String(brands[0].id) }));
                    }
                    setShowModelModal(true);
                  }}
                >
                  + เพิ่มรุ่นใหม่
                </button>
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--clr-text-muted)', marginLeft: 4 }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="table-wrapper" style={{ overflowY: 'auto', flex: 1 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>ยี่ห้อ</th>
                    <th>ชื่อรุ่นโทรศัพท์</th>
                    <th>ความจุ / สี</th>
                    <th style={{ textAlign: 'right' }}>ราคาขายหน้าร้าน</th>
                    <th style={{ textAlign: 'center' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '.78rem' }}>#{m.id}</td>
                      <td>
                        <span className="badge in-stock" style={{ fontSize: '.72rem' }}>
                          {m.brand_name || brands.find(b => Number(b.id) === Number(m.brand_id))?.name || '-'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{m.model_name}</td>
                      <td style={{ fontSize: '.82rem', color: 'var(--clr-text-muted)' }}>
                        {m.storage} · {m.color}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--clr-success-400)' }}>
                        ฿{Number(m.selling_price || 0).toLocaleString('th-TH')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditModel(m)}
                          >
                            แก้ไขราคาขาย
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setFormData(f => ({ ...f, modelId: String(m.id) }));
                              setShowCatalogModal(false);
                            }}
                          >
                            เลือกรุ่นนี้
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
