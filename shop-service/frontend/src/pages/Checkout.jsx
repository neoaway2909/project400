// src/pages/Checkout.jsx - POS Checkout Module
import { useState, useEffect, useCallback } from 'react';
import { api, saveLocalOrder } from '../api/client';
import { mockAvailableStock } from '../data/mockData';

const WARRANTY_OPTIONS = [
  { code: 'PKG_SCREEN_1Y',   name: 'ประกันจอแตก 1 ปี',                 price: 990 },
  { code: 'PKG_ACCIDENT_1Y', name: 'ประกันอุบัติเหตุรอบด้าน 1 ปี',      price: 1990 },
  { code: 'PKG_FULL_2Y',     name: 'ประกันเครื่อง + จอแตก 2 ปีเต็ม',    price: 4990 },
];

// Helper: expand grouped model stock rows into individual unique IMEI devices
function expandStockRows(rows) {
  const expanded = [];
  for (const row of rows || []) {
    const modelLabel = `${row.brand_name || ''} ${row.model_name || ''} ${row.storage || ''} (${row.color || ''})`
      .replace(/\s+/g, ' ')
      .trim();
    const price = Number(row.selling_price || 0);
    if (Array.isArray(row.available_imeis)) {
      for (const imei of row.available_imeis) {
        expanded.push({
          model_id: row.model_id,
          brand_name: row.brand_name,
          model_name: modelLabel,
          imei: String(imei),
          price,
        });
      }
    } else if (row.imei) {
      expanded.push({
        model_id: row.model_id,
        brand_name: row.brand_name,
        model_name: modelLabel,
        imei: String(row.imei),
        price,
      });
    }
  }
  return expanded;
}

export default function Checkout() {
  const [devices, setDevices] = useState([]);
  const [selected, setSelected] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customer, setCustomer] = useState({
    full_name: 'สมชาย ใจดี',
    phone_number: '0812345678',
    email: 'somchai@example.com',
  });
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stockLoading, setStockLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const loadAvailableDevices = useCallback(async () => {
    setStockLoading(true);
    try {
      const res = await api.getAvailableStock();
      if (res?.data) {
        setDevices(expandStockRows(res.data));
        setErrorMsg(null);
      }
    } catch {
      setDevices(expandStockRows(mockAvailableStock));
      setErrorMsg('ไม่สามารถเชื่อมต่อ API สต็อกได้ – แสดงรายการสต็อกสำรอง');
    } finally {
      setStockLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAvailableDevices();
  }, [loadAvailableDevices]);

  const isImeiInCart = (imei) => selected.some(item => item.imei === imei);

  const addToCart = (device, warranty) => {
    if (isImeiInCart(device.imei)) {
      alert(`เครื่อง IMEI ${device.imei} อยู่ในตะกร้าแล้ว (ไม่สามารถขาย IMEI ซ้ำกันได้)`);
      return;
    }
    setSelected([...selected, { ...device, warranty }]);
  };

  const removeFromCart = (index) => {
    setSelected(selected.filter((_, idx) => idx !== index));
  };

  const totalAmount = selected.reduce((sum, i) => {
    return sum + Number(i.price) + Number(i.warranty?.price || 0);
  }, 0);

  const handleCheckout = async () => {
    const cleanPhone = String(customer.phone_number || '').replace(/\D/g, '');
    if (!customer.full_name.trim()) {
      alert('กรุณากรอกชื่อ-นามสกุลผู้ซื้อ');
      return;
    }
    if (!/^0[0-9]{9}$/.test(cleanPhone)) {
      alert('กรุณากรอกเบอร์โทรศัพท์ 10 หลัก (ขึ้นต้นด้วย 0)');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const payload = {
      customerId: '00000000-0000-0000-0000-000000000001',
      paymentMethod: 'CASH',
      totalAmount,
      items: selected.map(i => ({
        model_name: i.model_name,
        imei: i.imei,
        price: i.price,
        package_code: i.warranty?.code || null,
        package_price: i.warranty?.price || null,
      })),
      customer: {
        full_name: customer.full_name.trim(),
        phone_number: cleanPhone,
        email: customer.email?.trim() || 'customer@example.com',
      }
    };

    try {
      const res = await api.post('/pos/checkout', payload);
      const warrantyByImei = {};
      for (const w of res.warranties || []) {
        if (w?.imei) warrantyByImei[w.imei] = w;
      }
      saveLocalOrder({
        order_id: res.orderId,
        customer_name: payload.customer.full_name,
        customer_phone: payload.customer.phone_number,
        customer_email: payload.customer.email,
        total_amount: res.totalAmount || totalAmount,
        payment_method: payload.paymentMethod,
        payment_status: res.paymentStatus || 'PAID',
        created_at: new Date().toISOString(),
        items: payload.items.map((it, idx) => ({
          ...it,
          line_no: idx + 1,
          policy_no: warrantyByImei[it.imei]?.policy_no || null,
          e_warranty_url: warrantyByImei[it.imei]?.e_warranty_url || (warrantyByImei[it.imei]?.policy_no ? `http://localhost:5176/?imei=${it.imei}` : null),
          sync_status: warrantyByImei[it.imei]?.policy_no ? 'SUCCESS' : null,
        })),
      });
      setReceipt(res);
      setSelected([]);
      // Reload stock so sold IMEI immediately disappears from POS list
      await loadAvailableDevices();
    } catch (e) {
      console.error('POS Checkout error:', e);
      setErrorMsg(`เกิดข้อผิดพลาดในการชำระเงิน: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter devices excluding those already in cart and matching search query
  const visibleDevices = devices.filter(d => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      d.model_name.toLowerCase().includes(q) ||
      d.imei.includes(q) ||
      (d.brand_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1080px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--clr-text)' }}>
            POS Checkout & สมัครประกันหน้าร้าน
          </h2>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>
            ดึงข้อมูลสต็อกจากคลังจริง (IN_STOCK) ตัดสต็อกทันที และส่งข้อมูลเปิดกรมธรรม์ไปยังระบบประกันแบบ Real-time
          </p>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--clr-success-400)', fontWeight: 700 }}>
          พร้อมขาย {devices.length} เครื่อง (IMEI ไม่ซ้ำ)
        </div>
      </div>

      {errorMsg && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          <span>{errorMsg}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '24px' }}>
        {/* Device selection */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--clr-primary-400)', margin: 0 }}>
              1. เลือกโทรศัพท์ในสต็อก ({visibleDevices.length} เครื่อง)
            </h3>
            <input
              type="text"
              className="form-control"
              placeholder="ค้นหาชื่อรุ่น หรือเลข IMEI..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ maxWidth: '240px', padding: '6px 12px', fontSize: '0.82rem' }}
            />
          </div>

          {stockLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--clr-text-muted)' }}>
              กำลังดึงรายการเครื่องพร้อมขายจากคลัง...
            </div>
          ) : visibleDevices.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--clr-text-muted)', background: 'var(--clr-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
              ไม่พบเครื่องพร้อมขายที่ตรงกับคำค้นหา
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '640px', overflowY: 'auto', paddingRight: '4px' }}>
              {visibleDevices.map(d => {
                const inCart = isImeiInCart(d.imei);
                return (
                  <div key={d.imei} style={{
                    background: 'var(--clr-surface)',
                    border: inCart ? '2px solid var(--clr-success-500)' : '1px solid var(--clr-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    opacity: inCart ? 0.65 : 1,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--clr-text)' }}>
                        {d.model_name}
                      </strong>
                      <span style={{ color: 'var(--clr-primary-500)', fontWeight: 800, fontSize: '1.1rem', whiteSpace: 'nowrap' }}>
                        ฿{d.price.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 12px' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                        IMEI: <strong>{d.imei}</strong>
                      </span>
                      {inCart && (
                        <span className="badge in-stock" style={{ fontSize: '0.72rem' }}>
                          ✓ อยู่ในตะกร้าแล้ว
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <button
                        disabled={inCart}
                        onClick={() => addToCart(d, null)}
                        style={{
                          padding: '6px 12px',
                          background: 'var(--clr-surface-2)',
                          border: '1px solid var(--clr-border)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--clr-text-muted)',
                          cursor: inCart ? 'not-allowed' : 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        เครื่องเปล่า (ไม่รับประกัน)
                      </button>
                      {WARRANTY_OPTIONS.map(w => (
                        <button
                          key={w.code}
                          disabled={inCart}
                          onClick={() => addToCart(d, w)}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(245, 158, 11, 0.12)',
                            border: '1px solid var(--clr-primary-500)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--clr-primary-400)',
                            cursor: inCart ? 'not-allowed' : 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}
                        >
                          + {w.name} (฿{w.price.toLocaleString()})
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Customer & Cart Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Customer form */}
          <div style={{
            background: 'var(--clr-surface)',
            border: '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--clr-primary-400)' }}>
              2. ข้อมูลผู้ซื้อ (ผู้ถือกรมธรรม์ประกัน)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="form-label">ชื่อ-นามสกุลลูกค้า *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="ชื่อ-นามสกุลลูกค้า"
                  value={customer.full_name}
                  onChange={e => setCustomer({ ...customer, full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">เบอร์โทรศัพท์ (10 หลัก) *</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="0812345678"
                  maxLength={10}
                  value={customer.phone_number}
                  onChange={e => setCustomer({ ...customer, phone_number: e.target.value.replace(/\D/g, '') })}
                />
              </div>
              <div>
                <label className="form-label">อีเมล</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="customer@example.com"
                  value={customer.email}
                  onChange={e => setCustomer({ ...customer, email: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Cart summary */}
          <div style={{
            background: 'var(--clr-surface)',
            border: '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--clr-primary-400)' }}>
              3. สรุปรายการสั่งซื้อ ({selected.length} รายการ)
            </h3>

            {selected.length === 0 ? (
              <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                ยังไม่มีสินค้าในตะกร้า เลือกโทรศัพท์จากทางซ้ายได้เลย
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {selected.map((s, i) => (
                  <div key={s.imei} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: 'var(--clr-surface-2)',
                    border: '1px solid var(--clr-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--clr-text)' }}>{s.model_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                        IMEI: {s.imei}
                      </div>
                      {s.warranty ? (
                        <div style={{ color: 'var(--clr-primary-400)', fontSize: '0.78rem', fontWeight: 600, marginTop: '2px' }}>
                          {s.warranty.name} (+฿{s.warranty.price.toLocaleString()})
                        </div>
                      ) : (
                        <div style={{ color: 'var(--clr-text-subtle)', fontSize: '0.75rem', marginTop: '2px' }}>
                          (เครื่องเปล่า ไม่รับประกัน)
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--clr-text)' }}>
                        ฿{(Number(s.price) + Number(s.warranty?.price || 0)).toLocaleString()}
                      </span>
                      <button
                        onClick={() => removeFromCart(i)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--clr-danger-400)',
                          cursor: 'pointer',
                          fontSize: '1rem'
                        }}
                        title="ลบออกจากตะกร้า"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              paddingTop: '12px',
              borderTop: '1px solid var(--clr-border)',
              marginBottom: '16px'
            }}>
              <span style={{ color: 'var(--clr-text-muted)', fontWeight: 600 }}>ยอดรวมสุทธิ</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--clr-success-400)' }}>
                ฿{totalAmount.toLocaleString()}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || selected.length === 0}
              className="btn btn-primary btn-lg w-full"
            >
              {loading ? 'กำลังตัดสต็อก & ส่งข้อมูลเปิดประกัน...' : 'ชำระเงิน & ออกใบรับประกัน'}
            </button>
          </div>
        </div>
      </div>

      {/* Receipt & QR Code Modal */}
      {receipt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--clr-surface)',
            border: '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-lg)',
            width: '440px',
            maxWidth: '92vw',
            padding: '28px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.35)'
          }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--clr-text)', marginBottom: '4px' }}>
              ชำระเงิน & ตัดสต็อกสำเร็จ!
            </h3>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              เลขออเดอร์: <strong style={{ color: 'var(--clr-primary-400)' }}>{receipt.orderId}</strong>
            </p>

            <div style={{
              background: 'var(--clr-surface-2)',
              border: '1px solid var(--clr-border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                ข้อมูลกรมธรรม์ประกันภัย (ซิงค์เข้าศูนย์ประกันแล้ว):
              </div>
              {receipt.warranties && receipt.warranties.length > 0 ? (
                receipt.warranties.map((w, idx) => (
                  <div key={idx} style={{ marginTop: '10px', padding: '10px', background: '#fff', borderRadius: '8px', border: '1px solid var(--clr-border)' }}>
                    {w.error ? (
                      <div style={{ color: 'var(--clr-danger-500)', fontSize: '0.85rem', fontWeight: 600 }}>
                        ไม่สามารถสร้างกรมธรรม์สำหรับ IMEI {w.imei}: {w.error}
                      </div>
                    ) : (
                      <>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--clr-primary-400)', marginBottom: '2px' }}>
                          เลขกรมธรรม์: {w.policy_no}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                          IMEI: {w.imei}
                        </div>
                        {w.e_warranty_url && (
                          <div style={{ margin: '10px 0' }}>
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(w.e_warranty_url)}`}
                              alt="E-Warranty QR Code"
                              style={{ borderRadius: '8px', border: '4px solid #fff' }}
                            />
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                          <a
                            href={w.e_warranty_url || `http://localhost:5176/?imei=${w.imei}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '0.8rem', color: 'var(--clr-primary-500)', fontWeight: 700 }}
                          >
                            เปิดดูบัตร E-Warranty ของลูกค้า (Customer Portal) ↗
                          </a>
                          <a
                            href="http://localhost:5173"
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '0.78rem', color: 'var(--clr-success-500)', fontWeight: 600 }}
                          >
                            เปิดดูรายการกรมธรรม์ในระบบประกัน (Insurance Portal) ↗
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
                  (ออเดอร์นี้ซื้อเครื่องเปล่า ไม่มีการผูกประกัน)
                </div>
              )}
            </div>

            <button
              onClick={() => setReceipt(null)}
              className="btn btn-primary w-full"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
