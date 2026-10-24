import React, { useEffect, useState } from 'react';
import { fetchPackages, updatePackage } from '../services/api';
import { Modal } from './Shared';

// ============================================================
// Package Management Page
// ============================================================
export default function PackagesPage({ addToast }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState({});

  const load = async () => {
    setLoading(true);
    const data = await fetchPackages();
    setPackages(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleEdit = (pkg) => {
    setEditTarget(pkg);
    setEditForm({
      package_name: pkg.package_name,
      description: pkg.description,
      premium_price: pkg.premium_price,
      coverage_months: pkg.coverage_months,
      max_coverage_amount: pkg.max_coverage_amount,
      max_claim_count: pkg.max_claim_count,
      is_active: pkg.is_active
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const updated = await updatePackage(editTarget.package_code, {
      ...editForm,
      premium_price: parseFloat(editForm.premium_price),
      coverage_months: parseInt(editForm.coverage_months),
      max_coverage_amount: parseFloat(editForm.max_coverage_amount),
      max_claim_count: parseInt(editForm.max_claim_count)
    });
    setSaving(false);
    if (updated) {
      addToast('✅ อัปเดตแพ็กเกจสำเร็จ', 'success');
      setEditTarget(null);
      load();
    } else {
      addToast('❌ เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  };

  const packageColors = ['blue', 'green', 'purple'];
  const coverageTypeMap = {
    SCREEN_CRACK: { icon: '💔', label: 'จอแตก', color: 'var(--accent-blue)' },
    WATER_DAMAGE: { icon: '💧', label: 'ตกน้ำ', color: 'var(--accent-cyan)' },
    ACCIDENTAL:   { icon: '⚡', label: 'อุบัติเหตุ', color: 'var(--accent-yellow)' },
    THEFT:        { icon: '🔒', label: 'โจรกรรม', color: 'var(--accent-purple)' },
    FULL_COVERAGE:{ icon: '🛡️', label: 'ครบทุกอย่าง', color: 'var(--accent-green)' }
  };

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="spinner" style={{ width: 48, height: 48 }} />
    </div>
  );

  return (
    <div className="page-content fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-heading">จัดการแพ็กเกจประกันภัย</h2>
          <p className="page-subheading">กำหนดราคาเบี้ย, วงเงิน และเงื่อนไขความคุ้มครองของแต่ละแพ็กเกจ</p>
        </div>
      </div>

      {/* Package Cards */}
      <div className="package-grid">
        {packages.map((pkg, i) => {
          const color = packageColors[i % packageColors.length];
          return (
            <div key={pkg.id} className={`package-card ${color}`}>
              {/* Active Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className={`package-badge ${color}`}>{pkg.package_code}</span>
                <span className={`badge ${pkg.is_active ? 'badge-active' : 'badge-void'}`}>
                  {pkg.is_active ? '● ใช้งาน' : '● ปิด'}
                </span>
              </div>

              <div className="package-name">{pkg.package_name}</div>
              <div className="package-price">
                ฿{Number(pkg.premium_price).toLocaleString()}
                <span> / {pkg.coverage_months} เดือน</span>
              </div>
              <div className="package-desc">{pkg.description}</div>

              {/* Meta Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                {[
                  ['💰 วงเงินสูงสุด', `฿${Number(pkg.max_coverage_amount).toLocaleString()}`],
                  ['🔢 เคลมได้สูงสุด', `${pkg.max_claim_count} ครั้ง`],
                  ['📅 ระยะคุ้มครอง', `${pkg.coverage_months} เดือน`],
                  ['🔗 กฎย่อย', `${pkg.coverage_rules?.length || 0} รายการ`]
                ].map(([label, value]) => (
                  <div key={label} style={{
                    padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Coverage Rules */}
              {pkg.coverage_rules?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    ความคุ้มครองย่อย
                  </div>
                  {pkg.coverage_rules.map((r, ri) => {
                    const ct = coverageTypeMap[r.coverage_type] || { icon: '📌', label: r.coverage_type, color: 'var(--text-secondary)' };
                    return (
                      <div key={ri} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255,255,255,0.03)', marginBottom: '6px',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        <span style={{ fontSize: '16px' }}>{ct.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', color: ct.color, fontWeight: 600 }}>{r.rule_name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            สูงสุด ฿{Number(r.max_amount).toLocaleString()}
                            {r.excess_amount > 0 && ` | Excess ฿${r.excess_amount}`}
                            {' | '}{r.max_times} ครั้ง
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="package-actions">
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleEdit(pkg)}>
                  ✏️ แก้ไขแพ็กเกจ
                </button>
                <button
                  className={`btn btn-sm ${pkg.is_active ? 'btn-danger' : 'btn-ghost'}`}
                  onClick={async () => {
                    await updatePackage(pkg.package_code, { is_active: !pkg.is_active });
                    addToast(`${pkg.is_active ? 'ปิด' : 'เปิด'}แพ็กเกจ ${pkg.package_code} แล้ว`, pkg.is_active ? 'error' : 'success');
                    load();
                  }}
                >
                  {pkg.is_active ? '🔕 ปิด' : '🔔 เปิด'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Package Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`✏️ แก้ไขแพ็กเกจ: ${editTarget?.package_code}`}
      >
        {editTarget && (
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">ชื่อแพ็กเกจ *</label>
              <input className="form-input" required value={editForm.package_name}
                onChange={e => setEditForm({...editForm, package_name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">คำอธิบาย</label>
              <textarea className="form-input" rows={3} value={editForm.description}
                onChange={e => setEditForm({...editForm, description: e.target.value})}
                style={{ resize: 'vertical' }} />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">ราคาเบี้ย (บาท) *</label>
                <input className="form-input" type="number" min="0" required
                  value={editForm.premium_price}
                  onChange={e => setEditForm({...editForm, premium_price: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">ระยะคุ้มครอง (เดือน) *</label>
                <input className="form-input" type="number" min="1" required
                  value={editForm.coverage_months}
                  onChange={e => setEditForm({...editForm, coverage_months: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">วงเงินสูงสุด (บาท) *</label>
                <input className="form-input" type="number" min="0" required
                  value={editForm.max_coverage_amount}
                  onChange={e => setEditForm({...editForm, max_coverage_amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">จำนวนครั้งเคลมสูงสุด *</label>
                <input className="form-input" type="number" min="1" required
                  value={editForm.max_claim_count}
                  onChange={e => setEditForm({...editForm, max_claim_count: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={editForm.is_active}
                  onChange={e => setEditForm({...editForm, is_active: e.target.checked})}
                  style={{ width: 16, height: 16 }} />
                <span className="form-label" style={{ margin: 0 }}>เปิดใช้งานแพ็กเกจนี้</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditTarget(null)}>
                ยกเลิก
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                {saving ? <><span className="spinner" /> กำลังบันทึก...</> : '💾 บันทึกการเปลี่ยนแปลง'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
