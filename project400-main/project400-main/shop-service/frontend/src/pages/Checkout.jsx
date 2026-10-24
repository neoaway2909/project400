// src/pages/Checkout.jsx
import { useState, useEffect } from 'react';
import { api } from '../api/client';
import QRCode from 'qrcode.react';

// Mock device list – in real app fetch from inventory API
const MOCK_DEVICES = [
  { model_name: 'iPhone 13', imei: '123456789012345', price: 9900 },
  { model_name: 'Samsung S22', imei: '987654321098765', price: 8500 },
];

const WARRANTY_OPTIONS = [
  { code: 'PKG_ACCIDENT_1Y', name: 'จอแตก 1 ปี', price: 990 },
  { code: 'PKG_FULL_2Y', name: 'คุ้มครอง 2 ปี', price: 1990 },
];

export default function Checkout() {
  const [devices, setDevices] = useState([]);
  const [selected, setSelected] = useState([]); // array of {model_name, imei, price, warranty?}
  const [customer, setCustomer] = useState({ full_name: '', phone_number: '' });
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  // In a real app you would fetch from /inventory/available-stock
  useEffect(() => {
    setDevices(MOCK_DEVICES);
  }, []);

  const addToCart = (device, warranty) => {
    setSelected([...selected, { ...device, warranty }]);
  };

  const totalAmount = selected.reduce((sum, i) => {
    return sum + i.price + (i.warranty?.price || 0);
  }, 0);

  const handleCheckout = async () => {
    if (!customer.full_name || !customer.phone_number) {
      alert('กรุณากรอกข้อมูลลูกค้า');
      return;
    }
    setLoading(true);
    const payload = {
      customerId: 'placeholder-customer-id', // backend will map by phone later
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
        email: '',
        id_card_no: ''
      }
    };
    try {
      const { data } = await api.post('/pos/checkout', payload);
      setReceipt(data);
      setSelected([]);
    } catch (e) {
      console.error(e);
      alert('ชำระเงินไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl mb-4">🛒 POS Checkout</h2>

      {/* Device selection */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {devices.map(d => (
          <div key={d.imei} className="card p-3">
            <p><strong>{d.model_name}</strong></p>
            <p>IMEI: {d.imei}</p>
            <p>ราคา: {d.price.toLocaleString()} ฿</p>
            <div className="mt-2 space-x-2">
              <button className="btn" onClick={() => addToCart(d)}>
                ไม่เลือกประกัน
              </button>
              {WARRANTY_OPTIONS.map(w => (
                <button key={w.code} className="btn" onClick={() => addToCart(d, w)}>
                  {w.name} (+{w.price.toLocaleString()} ฿)
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Customer form */}
      <div className="card mb-6 p-3">
        <h3 className="font-bold mb-2">ข้อมูลลูกค้า</h3>
        <input
          type="text"
          placeholder="ชื่อ-นามสกุล"
          className="input w-full mb-2"
          value={customer.full_name}
          onChange={e => setCustomer({ ...customer, full_name: e.target.value })}
        />
        <input
          type="tel"
          placeholder="เบอร์โทร (10 ตัว)"
          className="input w-full"
          value={customer.phone_number}
          onChange={e => setCustomer({ ...customer, phone_number: e.target.value })}
        />
      </div>

      {/* Summary & Pay */}
      <div className="card p-3 mb-6">
        <h3 className="font-bold mb-2">สรุปการสั่งซื้อ</h3>
        <ul className="mb-3 list-disc list-inside">
          {selected.map((s, i) => (
            <li key={i}>
              {s.model_name} – {s.price.toLocaleString()} ฿
              {s.warranty && ` + ${s.warranty.price.toLocaleString()} ฿ (${s.warranty.name})`}
            </li>
          ))}
        </ul>
        <p className="font-bold">รวมทั้งหมด: {totalAmount.toLocaleString()} ฿</p>
        <button className="btn mt-3" onClick={handleCheckout} disabled={loading || selected.length===0}>
          {loading ? 'กำลังชำระ...' : 'ชำระเงิน'}
        </button>
      </div>

      {/* Receipt modal */}
      {receipt && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="card w-96 p-6 text-center">
            <h3 className="text-xl mb-2">✅ ชำระเงินสำเร็จ</h3>
            <p>เลขออเดอร์: <strong>{receipt.orderId}</strong></p>
            <p>ยอดชำระ: {receipt.totalAmount.toLocaleString()} ฿</p>
            {receipt.warranties.map((w, i) => (
              <div key={i} className="mt-2">
                <p>IMEI {w.imei}</p>
                {w.policy_no ? (
                  <>
                    <p>Policy No.: <strong>{w.policy_no}</strong></p>
                    <QRCode value={w.e_warranty_url} size={128} />
                  </>
                ) : (
                  <p className="text-red-600">⚠️ ไม่ได้รับ Policy (อาจต้อง retry)</p>
                )}
              </div>
            ))}
            <button className="btn mt-4" onClick={() => setReceipt(null)}>ปิด</button>
          </div>
        </div>
      )}
    </div>
  );
}
