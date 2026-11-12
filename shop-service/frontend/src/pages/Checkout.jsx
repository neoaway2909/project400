// src/pages/Checkout.jsx - POS Checkout Module
import { useState, useEffect, useCallback } from 'react';
import { api, saveLocalOrder } from '../api/client';
import { mockAvailableStock } from '../data/mockData';

const WARRANTY_OPTIONS = [
  { code: 'PKG_SCREEN_1Y',   name: 'ประกันจอแตก 1 ปี',                 price: 990 },
  { code: 'PKG_ACCIDENT_1Y', name: 'ประกันอุบัติเหตุรอบด้าน 1 ปี',      price: 1990 },
  { code: 'PKG_FULL_2Y',     name: 'ประกันเครื่อง + จอแตก 2 ปีเต็ม',    price: 4990 },
];

const PAYMENT_METHODS = [
  { id: 'CASH',               label: 'เงินสด / QR PromptPay', sub: 'ชำระเต็มจำนวน ไม่มีค่าธรรมเนียม' },
  { id: 'CREDIT_FULL',        label: 'บัตรเครดิต (รูดเต็มจำนวน)', sub: 'ชำระเต็มจำนวนผ่านบัตรเครดิต' },
  { id: 'CREDIT_INSTALLMENT', label: 'บัตรเครดิต (ผ่อนชำระ)',     sub: 'ผ่อน 0% สูงสุด 10 เดือน หรือผ่อนนาน 24 เดือน' },
];

const CARD_NETWORKS = [
  { id: 'VISA',       label: 'VISA',       badgeBg: '#1e3a8a', badgeColor: '#ffffff' },
  { id: 'MASTERCARD', label: 'Mastercard', badgeBg: '#9a3412', badgeColor: '#ffffff' },
  { id: 'JCB',        label: 'JCB',        badgeBg: '#065f46', badgeColor: '#ffffff' },
  { id: 'UNIONPAY',   label: 'UnionPay',   badgeBg: '#0f766e', badgeColor: '#ffffff' },
  { id: 'AMEX',       label: 'AMEX',       badgeBg: '#1d4ed8', badgeColor: '#ffffff' },
];

const CARD_BANKS = [
  { id: 'KBANK',    name: 'กสิกรไทย (KBank Smart PAY)',       promo: 'ผ่อน 0% นานสูงสุด 10 เดือน' },
  { id: 'SCB',      name: 'ไทยพาณิชย์ (SCB CardX ดีจัง)',      promo: 'ผ่อน 0% นานสูงสุด 10 เดือน' },
  { id: 'KTC',      name: 'บัตรเครดิต KTC (KTC FLEXI)',       promo: 'ผ่อน 0% นานสูงสุด 10 เดือน' },
  { id: 'KRUNGSRI', name: 'กรุงศรี / FirstChoice',            promo: 'ผ่อน 0% 10 เดือน หรือผ่อนนาน 24 เดือน' },
  { id: 'BBL',      name: 'ธนาคารกรุงเทพ (BeSmart)',          promo: 'ผ่อน 0% นานสูงสุด 10 เดือน' },
  { id: 'TTB',      name: 'ทหารไทยธนชาต (ttb so goood)',      promo: 'ผ่อน 0% นานสูงสุด 10 เดือน' },
];

const INSTALLMENT_PLANS = [
  { months: 3,  monthlyRate: 0,    label: 'ผ่อน 3 เดือน',  tag: 'ดอกเบี้ย 0%' },
  { months: 6,  monthlyRate: 0,    label: 'ผ่อน 6 เดือน',  tag: 'ดอกเบี้ย 0%' },
  { months: 10, monthlyRate: 0,    label: 'ผ่อน 10 เดือน', tag: 'ดอกเบี้ย 0% ยอดนิยม' },
  { months: 12, monthlyRate: 0.59, label: 'ผ่อน 12 เดือน', tag: 'ดอกเบี้ยพิเศษ 0.59%/เดือน' },
  { months: 24, monthlyRate: 0.69, label: 'ผ่อน 24 เดือน', tag: 'ดอกเบี้ยพิเศษ 0.69%/เดือน' },
];

function calculateInstallment(baseAmount, plan) {
  const principal = Number(baseAmount || 0);
  if (!plan || principal <= 0) {
    return {
      months: plan?.months || 1,
      monthlyRate: plan?.monthlyRate || 0,
      totalInterest: 0,
      grandTotal: principal,
      monthlyPayment: principal,
    };
  }
  const totalInterest = Math.round(principal * (plan.monthlyRate / 100) * plan.months);
  const grandTotal = principal + totalInterest;
  const monthlyPayment = grandTotal / plan.months;
  return {
    months: plan.months,
    monthlyRate: plan.monthlyRate,
    totalInterest,
    grandTotal,
    monthlyPayment,
  };
}

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
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cardNetwork, setCardNetwork] = useState('VISA');
  const [cardBank, setCardBank] = useState('KBANK');
  const [cardLast4, setCardLast4] = useState('4242');
  const [installmentMonths, setInstallmentMonths] = useState(10);
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

  const selectedPlan = INSTALLMENT_PLANS.find(p => p.months === installmentMonths) || INSTALLMENT_PLANS[2];
  const installmentCalc = calculateInstallment(totalAmount, selectedPlan);
  const finalPayableAmount = paymentMethod === 'CREDIT_INSTALLMENT' ? installmentCalc.grandTotal : totalAmount;
  const selectedBankObj = CARD_BANKS.find(b => b.id === cardBank) || CARD_BANKS[0];

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
    if (paymentMethod !== 'CASH' && cardLast4 && !/^[0-9]{4}$/.test(cardLast4)) {
      alert('กรุณากรอกเลขท้ายบัตรเครดิต 4 หลัก');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const paymentDetails = paymentMethod === 'CASH'
      ? { type: 'CASH', label: 'เงินสด / QR PromptPay' }
      : paymentMethod === 'CREDIT_FULL'
      ? {
          type: 'CREDIT_FULL',
          card_network: cardNetwork,
          card_bank: cardBank,
          card_bank_name: selectedBankObj.name,
          card_last4: cardLast4 || '4242',
          months: 1,
          interest_rate: 0,
          monthly_payment: totalAmount,
          total_interest: 0,
          grand_total: totalAmount,
          label: `บัตรเครดิตเต็มจำนวน ${cardBank} (${cardNetwork} *${cardLast4 || '4242'})`,
        }
      : {
          type: 'CREDIT_INSTALLMENT',
          card_network: cardNetwork,
          card_bank: cardBank,
          card_bank_name: selectedBankObj.name,
          card_last4: cardLast4 || '4242',
          months: installmentCalc.months,
          interest_rate: installmentCalc.monthlyRate,
          monthly_payment: Math.round(installmentCalc.monthlyPayment * 100) / 100,
          total_interest: installmentCalc.totalInterest,
          grand_total: installmentCalc.grandTotal,
          label: `ผ่อนบัตรเครดิต ${cardBank} (${cardNetwork} *${cardLast4 || '4242'}) · ${installmentCalc.months} เดือน`,
        };

    const payload = {
      customerId: '00000000-0000-0000-0000-000000000001',
      paymentMethod,
      paymentDetails,
      totalAmount: finalPayableAmount,
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
        total_amount: res.totalAmount || finalPayableAmount,
        payment_method: payload.paymentMethod,
        payment_details: paymentDetails,
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
      setReceipt({ ...res, paymentDetails });
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

            {/* Payment Method & Credit Card Installment Section */}
            <div style={{
              marginTop: '14px',
              paddingTop: '14px',
              borderTop: '1px solid var(--clr-border)',
            }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--clr-primary-400)', margin: '0 0 10px 0' }}>
                4. เลือกช่องทางชำระเงิน & แผนผ่อนบัตรเครดิต
              </h4>

              {/* Payment method buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {PAYMENT_METHODS.map(pm => {
                  const active = paymentMethod === pm.id;
                  return (
                    <div
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: active ? '2px solid var(--clr-primary-500)' : '1px solid var(--clr-border)',
                        background: active ? 'rgba(245, 158, 11, 0.12)' : 'var(--clr-surface-2)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={active}
                          onChange={() => setPaymentMethod(pm.id)}
                          style={{ accentColor: 'var(--clr-primary-500)' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--clr-text)' }}>
                            {pm.label}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--clr-text-muted)' }}>
                            {pm.sub}
                          </div>
                        </div>
                      </div>
                      {pm.id === 'CREDIT_INSTALLMENT' && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: '#dcfce7',
                          color: '#166534',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                        }}>
                          0% สูงสุด 10 ด.
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Card Type & Issuing Bank Selection */}
              {paymentMethod !== 'CASH' && (
                <div style={{
                  padding: '12px',
                  background: 'var(--clr-surface-2)',
                  border: '1px solid var(--clr-border)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '12px',
                }}>
                  <div style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.8rem' }}>
                      เลือกประเภทบัตรเครดิต (Card Network)
                    </label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {CARD_NETWORKS.map(net => {
                        const isSel = cardNetwork === net.id;
                        return (
                          <button
                            key={net.id}
                            type="button"
                            onClick={() => setCardNetwork(net.id)}
                            style={{
                              padding: '5px 11px',
                              borderRadius: '6px',
                              border: isSel ? '2px solid var(--clr-primary-500)' : '1px solid var(--clr-border)',
                              background: isSel ? net.badgeBg : '#ffffff',
                              color: isSel ? net.badgeColor : 'var(--clr-text)',
                              fontWeight: 700,
                              fontSize: '0.76rem',
                              cursor: 'pointer',
                            }}
                          >
                            {net.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: '8px', marginBottom: paymentMethod === 'CREDIT_INSTALLMENT' ? '12px' : '0' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>ธนาคารผู้ออกบัตร</label>
                      <select
                        className="form-control"
                        value={cardBank}
                        onChange={e => setCardBank(e.target.value)}
                        style={{ padding: '7px 10px', fontSize: '0.8rem' }}
                      >
                        {CARD_BANKS.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>เลขท้าย 4 หลัก</label>
                      <input
                        type="text"
                        className="form-control"
                        maxLength={4}
                        placeholder="4242"
                        value={cardLast4}
                        onChange={e => setCardLast4(e.target.value.replace(/\D/g, ''))}
                        style={{ padding: '7px 10px', fontSize: '0.8rem', fontFamily: "'JetBrains Mono', monospace", textAlign: 'center' }}
                      />
                    </div>
                  </div>

                  {/* Installment Plan Table */}
                  {paymentMethod === 'CREDIT_INSTALLMENT' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--clr-text)' }}>
                          ตารางเลือกแผนผ่อนชำระ ({selectedBankObj.name})
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--clr-primary-400)', fontWeight: 600 }}>
                          {selectedBankObj.promo}
                        </span>
                      </div>

                      <div style={{
                        border: '1px solid var(--clr-border)',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        background: '#ffffff',
                      }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--clr-border)', textAlign: 'left' }}>
                              <th style={{ padding: '7px 8px', width: '32px', textAlign: 'center' }}>เลือก</th>
                              <th style={{ padding: '7px 8px' }}>จำนวนงวด</th>
                              <th style={{ padding: '7px 8px', textAlign: 'center' }}>ดอกเบี้ย/ด.</th>
                              <th style={{ padding: '7px 8px', textAlign: 'right' }}>ยอดผ่อน/เดือน</th>
                              <th style={{ padding: '7px 8px', textAlign: 'right' }}>ยอดรวม</th>
                            </tr>
                          </thead>
                          <tbody>
                            {INSTALLMENT_PLANS.map(plan => {
                              const calc = calculateInstallment(totalAmount, plan);
                              const isChosen = installmentMonths === plan.months;
                              return (
                                <tr
                                  key={plan.months}
                                  onClick={() => setInstallmentMonths(plan.months)}
                                  style={{
                                    borderBottom: '1px solid var(--clr-border)',
                                    background: isChosen ? 'rgba(245, 158, 11, 0.14)' : 'transparent',
                                    cursor: 'pointer',
                                    fontWeight: isChosen ? 700 : 500,
                                  }}
                                >
                                  <td style={{ padding: '8px', textAlign: 'center' }}>
                                    <input
                                      type="radio"
                                      name="installmentPlan"
                                      checked={isChosen}
                                      onChange={() => setInstallmentMonths(plan.months)}
                                      style={{ accentColor: 'var(--clr-primary-500)' }}
                                    />
                                  </td>
                                  <td style={{ padding: '8px' }}>
                                    <div>{plan.months} เดือน</div>
                                    <div style={{ fontSize: '0.68rem', color: plan.monthlyRate === 0 ? '#16a34a' : 'var(--clr-text-muted)' }}>
                                      {plan.tag}
                                    </div>
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'center' }}>
                                    <span style={{
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: plan.monthlyRate === 0 ? '#dcfce7' : '#fef3c7',
                                      color: plan.monthlyRate === 0 ? '#166534' : '#92400e',
                                      fontWeight: 700,
                                      fontSize: '0.72rem',
                                    }}>
                                      {plan.monthlyRate === 0 ? '0%' : `${plan.monthlyRate}%`}
                                    </span>
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right', color: 'var(--clr-primary-400)', fontWeight: 700 }}>
                                    ฿{calc.monthlyPayment.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>
                                    ฿{calc.grandTotal.toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {totalAmount > 0 && (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          fontSize: '0.78rem',
                          color: '#065f46',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                          <span>
                            ผ่อนผ่านบัตร <strong>{cardBank} ({cardNetwork})</strong> นาน <strong>{installmentCalc.months} งวด</strong>
                          </span>
                          <strong>
                            งวดละ ฿{installmentCalc.monthlyPayment.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/เดือน
                          </strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              paddingTop: '12px',
              borderTop: '1px solid var(--clr-border)',
              marginBottom: '16px'
            }}>
              <div>
                <div style={{ color: 'var(--clr-text-muted)', fontWeight: 600 }}>ยอดรวมสุทธิ</div>
                {paymentMethod === 'CREDIT_INSTALLMENT' && totalAmount > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--clr-primary-400)', fontWeight: 600 }}>
                    ผ่อน ฿{installmentCalc.monthlyPayment.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × {installmentCalc.months} เดือน
                    {installmentCalc.totalInterest > 0 ? ` (รวมดอกเบี้ย ฿${installmentCalc.totalInterest.toLocaleString()})` : ' (ดอกเบี้ย 0%)'}
                  </div>
                )}
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--clr-success-400)' }}>
                ฿{finalPayableAmount.toLocaleString()}
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
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
              เลขออเดอร์: <strong style={{ color: 'var(--clr-primary-400)' }}>{receipt.orderId}</strong>
            </p>

            {receipt.paymentDetails && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: '#f8fafc',
                border: '1px solid var(--clr-border)',
                marginBottom: '14px',
                fontSize: '0.82rem',
                textAlign: 'left',
              }}>
                <div><strong>วิธีชำระเงิน:</strong> {receipt.paymentDetails.label}</div>
                {receipt.paymentDetails.type === 'CREDIT_INSTALLMENT' && (
                  <div style={{ color: 'var(--clr-primary-400)', fontWeight: 700, marginTop: '4px' }}>
                    ยอดผ่อนชำระ: ฿{Number(receipt.paymentDetails.monthly_payment || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / เดือน × {receipt.paymentDetails.months} งวด
                    {receipt.paymentDetails.interest_rate === 0 ? ' (ดอกเบี้ย 0%)' : ` (ดอกเบี้ย ${receipt.paymentDetails.interest_rate}%/เดือน)`}
                  </div>
                )}
              </div>
            )}

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
