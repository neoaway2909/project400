// src/pages/Checkout.jsx - POS Checkout Module
import { useState, useEffect } from 'react';
import { api } from '../api/client';

// Mock device list for instant POS demo
const MOCK_DEVICES = [
  { model_name: 'iPhone 15 Pro 256GB', imei: '358941091234567', price: 41900 },
  { model_name: 'Samsung Galaxy S24 Ultra', imei: '351234567890001', price: 46900 },
  { model_name: 'Xiaomi 14 Pro 512GB', imei: '862345678901234', price: 29900 },
];

const WARRANTY_OPTIONS = [
  { code: 'PKG_SCREEN_1Y', name: 'ประกันจอแตก 1 ปี', price: 990 },
  { code: 'PKG_ACCIDENT_1Y', name: 'ประกันอุบัติเหตุรอบด้าน 1 ปี', price: 1990 },
  { code: 'PKG_FULL_2Y', name: 'ประกันเครื่อง + จอแตก 2 ปีเต็ม', price: 3490 },
];

export default function Checkout() {
  const [devices, setDevices] = useState(MOCK_DEVICES);
  const [selected, setSelected] = useState([]);
  const [customer, setCustomer] = useState({ full_name: 'สมชาย ใจดี', phone_number: '0812345678' });
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Try to load real in-stock devices from inventory API
    api.getAvailableStock()
      .then(res => {
        if (res?.data && res.data.length > 0) {
          const items = res.data.map(d => ({
            model_name: `${d.brand_name || ''} ${d.model_name || ''} ${d.storage || ''}`.trim(),
            imei: d.imei,
            price: Number(d.selling_price || 0)
          }));
          setDevices(items);
        }
      })
      .catch(() => {
        // Fallback to mock devices
      });
  }, []);

  const addToCart = (device, warranty) => {
    setSelected([...selected, { ...device, warranty }]);
  };

  const removeFromCart = (index) => {
    setSelected(selected.filter((_, idx) => idx !== index));
  };

  const totalAmount = selected.reduce((sum, i) => {
    return sum + Number(i.price) + Number(i.warranty?.price || 0);
  }, 0);

  const handleCheckout = async () => {
    if (!customer.full_name || !customer.phone_number) {
      alert('กรุณากรอกข้อมูลลูกค้า');
      return;
    }
    setLoading(true);
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
        full_name: customer.full_name,
        phone_number: customer.phone_number,
        email: 'customer@example.com',
        id_card_no: '1234567890123'
      }
    };

    try {
      const res = await api.post('/pos/checkout', payload);
      setReceipt(res);
      setSelected([]);
    } catch (e) {
      console.warn('Backend POS API unreachable, showing client demo receipt:', e);
      // Fallback demo receipt
      setReceipt({
        orderId: `ORD-${Date.now().toString().slice(-8)}`,
        totalAmount,
        paymentStatus: 'PAID',
        warranties: selected.filter(i => i.warranty).map(i => ({
          imei: i.imei,
          policy_no: `POL-2026-${i.imei.slice(-6)}`,
          e_warranty_url: `http://localhost:5176/?imei=${i.imei}`
        }))
      });
      setSelected([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--clr-text)' }}>
          🛒 POS Checkout & สมัครประกันหน้าร้าน
        </h2>
        <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>
          ขายเครื่องพร้อมผูกสิทธิ์กรมธรรม์ E-Warranty ไปยังศูนย์ซ่อมแบบ Real-time
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* Device selection */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--clr-primary-400)' }}>
            1. เลือกโทรศัพท์ในสต็อก
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {devices.map(d => (
              <div key={d.imei} style={{
                background: 'var(--clr-surface)',
                border: '1px solid var(--clr-border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: '1rem', color: '#fff' }}>{d.model_name}</strong>
                  <span style={{ color: 'var(--clr-primary-400)', fontWeight: 800, fontSize: '1.1rem' }}>
                    ฿{d.price.toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)', fontFamily: 'monospace', margin: '4px 0 12px' }}>
                  IMEI: {d.imei}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button 
                    onClick={() => addToCart(d, null)}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--clr-border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--clr-text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    เครื่องเปล่า (ไม่รับประกัน)
                  </button>
                  {WARRANTY_OPTIONS.map(w => (
                    <button 
                      key={w.code}
                      onClick={() => addToCart(d, w)}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid var(--clr-primary-500)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--clr-primary-400)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      + {w.name} (฿{w.price.toLocaleString()})
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
              2. ข้อมูลผู้ซื้อ (ผู้ถือประกัน)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="ชื่อ-นามสกุลลูกค้า"
                value={customer.full_name}
                onChange={e => setCustomer({ ...customer, full_name: e.target.value })}
                style={{
                  padding: '10px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--clr-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#fff',
                  outline: 'none'
                }}
              />
              <input
                type="tel"
                placeholder="เบอร์โทรศัพท์ (10 หลัก)"
                value={customer.phone_number}
                onChange={e => setCustomer({ ...customer, phone_number: e.target.value })}
                style={{
                  padding: '10px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--clr-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#fff',
                  outline: 'none'
                }}
              />
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
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{s.model_name}</div>
                      {s.warranty && (
                        <div style={{ color: 'var(--clr-primary-400)', fontSize: '0.78rem' }}>
                          🛡️ {s.warranty.name} (+฿{s.warranty.price.toLocaleString()})
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700 }}>
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
              <span style={{ color: 'var(--clr-text-muted)' }}>ยอดรวมสุทธิ</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--clr-success-400)' }}>
                ฿{totalAmount.toLocaleString()}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || selected.length === 0}
              style={{
                width: '100%',
                padding: '12px',
                background: selected.length > 0 ? 'var(--clr-primary-600)' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: selected.length > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              {loading ? 'กำลังส่งข้อมูลเปิดประกัน...' : '💳 ชำระเงิน & ออกใบรับประกัน'}
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
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--clr-surface)',
            border: '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-lg)',
            width: '420px',
            padding: '28px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎉</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
              ชำระเงินสำเร็จเรียบร้อย!
            </h3>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              เลขออเดอร์: <strong style={{ color: 'var(--clr-primary-400)' }}>{receipt.orderId}</strong>
            </p>

            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '8px' }}>
                สแกนดูบัตรรับประกันดิจิทัล E-Warranty:
              </div>
              {receipt.warranties && receipt.warranties.length > 0 ? (
                receipt.warranties.map((w, idx) => (
                  <div key={idx} style={{ marginTop: '10px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--clr-primary-400)', marginBottom: '4px' }}>
                      เลขกรมธรรม์: {w.policy_no}
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
                    <a 
                      href={w.e_warranty_url || '#'}
                      target="_blank" 
                      rel="noreferrer"
                      style={{ fontSize: '0.78rem', color: 'var(--clr-primary-400)' }}
                    >
                      เปิด E-Warranty Card ในเบราว์เซอร์ ↗
                    </a>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
                  (ไม่มีการผูกประกันสำหรับออเดอร์นี้)
                </div>
              )}
            </div>

            <button
              onClick={() => setReceipt(null)}
              style={{
                width: '100%',
                padding: '10px',
                background: 'var(--clr-primary-600)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
