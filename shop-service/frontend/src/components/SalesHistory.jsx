import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { formatPrice, formatDate, LoadingBox, EmptyState } from './shared';

const PACKAGE_NAMES = {
  PKG_SCREEN_1Y:   'ประกันจอแตก 1 ปี',
  PKG_ACCIDENT_1Y: 'ประกันอุบัติเหตุและจอแตก 1 ปี',
  PKG_FULL_2Y:     'ประกันครอบจักรวาล 2 ปี',
};

export default function SalesHistory({ onOpenClaimForImei }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getOrders();
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load sales history:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = orders.filter(ord => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const matchOrder =
      ord.order_id.toLowerCase().includes(q) ||
      (ord.customer_name || '').toLowerCase().includes(q) ||
      (ord.customer_phone || '').includes(q);
    const matchItems = (ord.items || []).some(
      it =>
        (it.imei || '').includes(q) ||
        (it.model_name || '').toLowerCase().includes(q) ||
        (it.policy_no || '').toLowerCase().includes(q)
    );
    return matchOrder || matchItems;
  });

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const totalUnits = filteredOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
  const totalInsured = filteredOrders.reduce(
    (sum, o) => sum + (o.items || []).filter(i => i.package_code).length,
    0
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>ประวัติการซื้อขายหน้าร้าน (Sales History)</h2>
          <p>รายการคำสั่งซื้อ ข้อมูลผู้ซื้อ เลข IMEI ที่ขายแล้ว และสถานะการผูกกรมธรรม์ประกันภัย</p>
        </div>
        <button className="btn btn-secondary" onClick={loadOrders}>
          รีเฟรชข้อมูล
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card blue">
          <div className="kpi-value">{filteredOrders.length}</div>
          <div className="kpi-label">บิลการขายทั้งหมด</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-value">{totalUnits}</div>
          <div className="kpi-label">เครื่องที่ขายแล้ว</div>
        </div>
        <div className="kpi-card yellow">
          <div className="kpi-value">{totalInsured}</div>
          <div className="kpi-label">เครื่องที่ผูกประกัน</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-value" style={{ fontSize: '1.35rem' }}>{formatPrice(totalRevenue)}</div>
          <div className="kpi-label">ยอดขายรวมสุทธิ</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-control"
              style={{ flex: 1, minWidth: 260 }}
              placeholder="ค้นหาเลขออเดอร์, ชื่อลูกค้า, เบอร์โทร, เลข IMEI, หรือเลขกรมธรรม์..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="text-sm text-muted">
              แสดง {filteredOrders.length} รายการ
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingBox text="กำลังโหลดประวัติการซื้อขาย..." />
      ) : filteredOrders.length === 0 ? (
        <div className="card">
          <EmptyState text="ไม่พบประวัติการซื้อขายที่ตรงกับคำค้นหา" />
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>เลขออเดอร์ / วันที่ขาย</th>
                  <th>ข้อมูลผู้ซื้อ</th>
                  <th>รายการเครื่อง & เลข IMEI</th>
                  <th>แพ็กเกจประกัน / กรมธรรม์</th>
                  <th>ยอดสุทธิ</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(ord => (
                  <tr key={ord.order_id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--clr-primary-400)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {ord.order_id}
                      </div>
                      <div style={{ fontSize: '.75rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>
                        {formatDate(ord.created_at)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ord.customer_name || 'ลูกค้าหน้าร้าน'}</div>
                      <div style={{ fontSize: '.78rem', color: 'var(--clr-text-muted)' }}>
                        {ord.customer_phone || '-'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(ord.items || []).map((it, idx) => (
                          <div key={idx}>
                            <div style={{ fontWeight: 600, fontSize: '.86rem' }}>{it.model_name}</div>
                            <div style={{ fontSize: '.76rem', color: 'var(--clr-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                              IMEI: {it.imei} · {formatPrice(it.price)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(ord.items || []).map((it, idx) => (
                          <div key={idx}>
                            {it.package_code ? (
                              <div>
                                <span className="badge in-stock" style={{ fontSize: '.7rem', marginBottom: 4 }}>
                                  {PACKAGE_NAMES[it.package_code] || it.package_code}
                                </span>
                                {it.policy_no && (
                                  <div style={{ fontSize: '.75rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--clr-primary-400)', fontWeight: 700 }}>
                                    {it.policy_no}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: '.78rem', color: 'var(--clr-text-subtle)' }}>
                                เครื่องเปล่า (ไม่รับประกัน)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--clr-success-400)', fontSize: '1rem' }}>
                        {formatPrice(ord.total_amount)}
                      </div>
                      <div style={{ fontSize: '.72rem', color: 'var(--clr-text-muted)' }}>
                        {ord.payment_details?.label || ord.payment_method || 'CASH'} · {ord.payment_status || 'PAID'}
                      </div>
                      {ord.payment_details?.type === 'CREDIT_INSTALLMENT' && (
                        <div style={{ fontSize: '.72rem', color: 'var(--clr-primary-400)', fontWeight: 700 }}>
                          ผ่อน ฿{Number(ord.payment_details.monthly_payment || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ด. ({ord.payment_details.months} งวด)
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedOrder(ord)}
                        >
                          ใบเสร็จ
                        </button>
                        {(ord.items || []).some(i => i.package_code) && onOpenClaimForImei && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              const insuredItem = ord.items.find(i => i.package_code);
                              if (insuredItem) onOpenClaimForImei(insuredItem.imei);
                            }}
                          >
                            แจ้งเคลม
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Receipt Detail Modal */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={e => e.target === e.currentTarget && setSelectedOrder(null)}
        >
          <div style={{
            background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-lg)', width: 480, maxWidth: '94vw', padding: 24,
            boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                รายละเอียดบิล {selectedOrder.order_id}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--clr-text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '.85rem', marginBottom: 16, padding: 12, background: 'var(--clr-surface-2)', borderRadius: 'var(--radius-sm)' }}>
              <div><strong>ลูกค้า:</strong> {selectedOrder.customer_name} ({selectedOrder.customer_phone})</div>
              <div><strong>วันที่ชำระเงิน:</strong> {formatDate(selectedOrder.created_at)}</div>
              <div><strong>วิธีชำระเงิน:</strong> {selectedOrder.payment_details?.label || selectedOrder.payment_method} ({selectedOrder.payment_status})</div>
              {selectedOrder.payment_details?.type === 'CREDIT_INSTALLMENT' && (
                <div style={{ color: 'var(--clr-primary-400)', fontWeight: 700, marginTop: 4 }}>
                  แผนผ่อนชำระ: ฿{Number(selectedOrder.payment_details.monthly_payment || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / เดือน × {selectedOrder.payment_details.months} งวด
                  {selectedOrder.payment_details.interest_rate === 0 ? ' (ดอกเบี้ย 0%)' : ` (ดอกเบี้ย ${selectedOrder.payment_details.interest_rate}%/เดือน)`}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {(selectedOrder.items || []).map((it, idx) => (
                <div key={idx} style={{ padding: 12, border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>{it.model_name}</span>
                    <span>{formatPrice(it.price)}</span>
                  </div>
                  <div style={{ fontSize: '.78rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--clr-text-muted)', marginTop: 2 }}>
                    IMEI: {it.imei}
                  </div>
                  {it.package_code && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--clr-border)', fontSize: '.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--clr-primary-400)', fontWeight: 600 }}>
                        <span>{PACKAGE_NAMES[it.package_code] || it.package_code}</span>
                        <span>+{formatPrice(it.package_price || 0)}</span>
                      </div>
                      {it.policy_no && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '.78rem' }}>
                            กรมธรรม์: <strong>{it.policy_no}</strong>
                          </span>
                          <a
                            href={it.e_warranty_url || `http://localhost:5176/?imei=${it.imei}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '.78rem', color: 'var(--clr-primary-500)', fontWeight: 700 }}
                          >
                            เปิดบัตร E-Warranty ↗
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '2px solid var(--clr-border)', marginBottom: 16 }}>
              <span style={{ fontWeight: 700 }}>ยอดชำระสุทธิ</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--clr-success-400)' }}>
                {formatPrice(selectedOrder.total_amount)}
              </span>
            </div>

            <button className="btn btn-primary w-full" onClick={() => setSelectedOrder(null)}>
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

