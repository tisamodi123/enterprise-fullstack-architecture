"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';

// Axios base configuration node link (Aapke Node backend ka port 5001 hai)
const API = axios.create({
  baseURL: 'http://localhost:5001/api',
  withCredentials: true // 🔒 CRITICAL: Isse HTTP-Only Cookies tokens auto-pass honge
});

export default function CheckoutPage() {
  // ─── STATE MANAGEMENT ───
  const [cartItems, setCartItems] = useState([
    { id: 'DIAMOND_ROUND_101', name: '1 Carat Solitaire Classic', category: 'round-cut', basePriceUSD: 2000 }
  ]);
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [couponCode, setCouponCode] = useState('');
  const [checkoutData, setCheckoutData] = useState(null);
  const [optimizerLog, setOptimizerLog] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Automatically fetch fresh breakdown snapshot whenever components or states drift
  useEffect(() => {
    triggerCheckoutSnapshot();
  }, [currencyCode]);

  // =========================================================================
  // 🛒 1. PIPELINE INTERCEPTOR: Fetch Checkout Pricing Structure
  // =========================================================================
  const triggerCheckoutSnapshot = async (appliedCode = couponCode) => {
    try {
      setErrorMessage('');
      const response = await API.post('/orders/checkout', {
        currencyCode,
        couponCode: appliedCode || null,
        items: cartItems
      });
      if (response.data.status === 'success') {
        setCheckoutData(response.data.data.order);
      }
    } catch (error) {
      setCheckoutData(null);
      setErrorMessage(error.response?.data?.message || 'Checkout pipeline structural failure.');
    }
  };

  // =========================================================================
  // 🍱 2. THE AUTO-OPTIMIZER ACTION: Algorithmic Best Deal Lookup
  // =========================================================================
  const handleAutoOptimize = async () => {
    try {
      setErrorMessage('');
      const response = await API.post('/coupons/auto-optimize', {
        currentCurrencyCode: currencyCode,
        cartTotalBaseUSD: 2000,
        cartItems: cartItems
      });

      if (response.data.data) {
        const recommended = response.data.data.recommendedCode;
        setCouponCode(recommended);
        setOptimizerLog(`Best deal detected! Applied ${recommended}`);
        // Refire pricing engine with optimized choice parameters
        triggerCheckoutSnapshot(recommended);
      } else {
        setOptimizerLog('You already have the best custom pricing layout locked.');
      }
    } catch (error) {
      setErrorMessage('Optimization matrix sequence timed out.');
    }
  };

  // =========================================================================
  // 💳 3. GATEWAY HANDLER: Execute Simulated Transaction Verification
  // =========================================================================
  const handleMockPayment = async (successStatus) => {
    if (!checkoutData?._id) return;
    try {
      const response = await API.post('/orders/verify-payment', {
        orderId: checkoutData._id,
        paymentSuccess: successStatus
      });
      alert(`Transaction Callback Status: ${response.data.message}`);
      // Refresh current UI view state tree
      triggerCheckoutSnapshot();
    } catch (error) {
      alert('Payment processing loop crashed.');
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h2>💎 Premium Diamond Checkout Hub</h2>
      
      {/* ─── CURRENCY CAPTURE DROP-DOWN ─── */}
      <div style={{ margin: '20px 0' }}>
        <label style={{ fontWeight: 'bold' }}>Select Operational Currency: </label>
        <select value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} style={{ padding: '8px', marginLeft: '10px' }}>
          <option value="USD">USD ($)</option>
          <option value="INR">INR (₹)</option>
          <option value="EUR">EUR (€)</option>
        </select>
      </div>

      {/* ─── CART LISTING NODE ─── */}
      <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h4>Items in Cart</h4>
        {cartItems.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{item.name} ({item.category})</span>
            <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>${item.basePriceUSD} Base USD</span>
          </div>
        ))}
      </div>

      {/* ─── OFFERS ENGINE PROMO INTERFACE ─── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="ENTER PROMO CODE" 
          value={couponCode} 
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          style={{ padding: '10px', width: '200px', textTransform: 'uppercase' }}
        />
        <button onClick={() => triggerCheckoutSnapshot()} style={{ padding: '10px 20px', cursor: 'pointer', background: '#000', color: '#fff' }}>
          Apply Code
        </button>
        <button onClick={handleAutoOptimize} style={{ padding: '10px 20px', cursor: 'pointer', background: '#22c55e', color: '#fff', border: 'none' }}>
          ✨ Auto-Apply Best Deal
        </button>
      </div>

      {optimizerLog && <p style={{ color: '#16a34a', fontSize: '14px' }}>{optimizerLog}</p>}
      {errorMessage && <p style={{ color: '#dc2626', fontSize: '14px', background: '#fee2e2', padding: '10px' }}>⚠️ {errorMessage}</p>}

      {/* ─── LIVE PRICING BLOCK RESOLUTION ─── */}
      {checkoutData && (
        <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
          <h4>Order Financial Snapshot ({checkoutData.currency})</h4>
          <p>Subtotal Local: {checkoutData.subTotalLocal}</p>
          <p style={{ color: '#dc2626' }}>Discount Local Applied: -{checkoutData.discountLocal}</p>
          <hr />
          <h3>Grand Total: {checkoutData.grandTotalLocal} {checkoutData.currency}</h3>
          <p>Order Life Status: <span style={{ color: '#d97706', fontWeight: 'bold' }}>{checkoutData.orderStatus.toUpperCase()}</span></p>

          {checkoutData.orderStatus === 'pending_payment' && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => handleMockPayment(true)} style={{ padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
                Simulate Payment Success (Success)
              </button>
              <button onClick={() => handleMockPayment(false)} style={{ padding: '12px 24px', background: '#94a3b8', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
                Simulate Payment Failure (Fail/Revert)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── 🔄 POST-ORDER LIFECYCLE & RETURN PORTAL ─── */}
      {checkoutData && checkoutData.orderStatus !== 'pending_payment' && (
        <div style={{ marginTop: '40px', borderTop: '2px dashed #ccc', paddingTop: '30px' }}>
          <h3>📦 Post-Order User Dashboard</h3>
          <p>Manage your active item tokens and platform lifecycles below.</p>

          <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Order ID:</strong> <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{checkoutData._id}</code>
                <br />
                <span style={{ fontSize: '13px', color: '#64748b' }}>Placed on: {new Date(checkoutData.createdAt).toLocaleDateString()}</span>
              </div>
              <span style={{ 
                padding: '6px 12px', 
                borderRadius: '20px', 
                fontSize: '12px', 
                fontWeight: 'bold',
                background: checkoutData.orderStatus === 'returned' ? '#fee2e2' : '#fef3c7',
                color: checkoutData.orderStatus === 'returned' ? '#991b1b' : '#92400e'
              }}>
                Lifecycle: {checkoutData.orderStatus.toUpperCase()}
              </span>
            </div>

            {/* Return Workflow Trigger Logic */}
            {checkoutData.returnRequest && !checkoutData.returnRequest.isRequested && (
              <div style={{ marginTop: '20px', background: '#f8fafc', padding: '15px', borderRadius: '6px' }}>
                <h5>Need to request a product return/rejection?</h5>
                <button 
                  onClick={async () => {
                    try {
                      const res = await API.post('/orders/return-request', {
                        orderId: checkoutData._id,
                        type: 'full_return',
                        reason: 'The diamond profile facet matches did not meet digital grade benchmarks.'
                      });
                      alert(res.data.message);
                      triggerCheckoutSnapshot(); 
                    } catch (err) {
                      alert(err.response?.data?.message || 'Return track initiation aborted.');
                    }
                  }} 
                  style={{ padding: '10px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ↩️ Trigger Automated Return Track
                </button>
              </div>
            )}

            {/* Display active pending evaluation matrix */}
            {checkoutData.returnRequest && checkoutData.returnRequest.isRequested && (
              <div style={{ marginTop: '20px', padding: '15px', borderRadius: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <h4>📡 Return Audit Metrics Logged</h4>
                <p><strong>Current Review Status:</strong> <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{checkoutData.returnRequest.status.toUpperCase()}</span></p>
                <p style={{ fontSize: '14px', color: '#475569' }}><strong>Reason Submitted:</strong> "{checkoutData.returnRequest.reason}"</p>
                
                {checkoutData.returnRequest.adminNotes && (
                  <p style={{ marginTop: '10px', fontSize: '14px', padding: '10px', background: '#fff', borderLeft: '4px solid #16a34a' }}>
                    <strong>Admin Response Notes:</strong> {checkoutData.returnRequest.adminNotes}
                  </p>
                )}

                {/* Simulated Admin Resolution Control Center Shortcut */}
                {checkoutData.returnRequest.status === 'pending' && (
                  <div style={{ marginTop: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '8px' }}>🔧 ADMIN SIMULATOR OVERVIEW (FOR TESTING PANEL):</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={async () => {
                          try {
                            const res = await API.post('/orders/admin/resolve-return', {
                              orderId: checkoutData._id,
                              decision: 'approved',
                              adminNotes: 'QA inspection cleared on cloud snaps. Refund pool initiated.'
                            });
                            alert(res.data.message);
                            triggerCheckoutSnapshot();
                          } catch (err) { alert('Admin routing failure.'); }
                        }}
                        style={{ padding: '6px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                      >
                        ✅ Approve & Refund
                      </button>
                      <button 
                        onClick={async () => {
                          try {
                            const res = await API.post('/orders/admin/resolve-return', {
                              orderId: checkoutData._id,
                              decision: 'rejected',
                              adminNotes: 'Product tracking confirms delivery seals were altered post-arrival.'
                            });
                            alert(res.data.message);
                            triggerCheckoutSnapshot();
                          } catch (err) { alert('Admin routing failure.'); }
                        }}
                        style={{ padding: '6px 12px', background: '#b91c1c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                      >
                        ❌ Reject Request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}