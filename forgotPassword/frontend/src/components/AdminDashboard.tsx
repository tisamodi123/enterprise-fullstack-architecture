"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5001/api',
  withCredentials: true
});

export default function EnterpriseAdminDashboard() {
  // ─── CORE STATE NAVIGATION & DATA TRACKERS ───
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metrics, setMetrics] = useState({
    onlineUsers: 0,
    totalOrders: 0,
    totalJewellery: 0,
    orderSalesRevenue: 0,
    verifyPendingCustomer: 0,
    totalCustomer: 0
  });
  
  const [products, setProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [currentCarts, setCurrentCarts] = useState([]);
  
  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [importStatus, setImportStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync all server components loops on initial load
  useEffect(() => {
    fetchDashboardSnapshot();
    fetchActiveInventory();
  }, []);

  const fetchDashboardSnapshot = async () => {
    try {
      const res = await API.get('/admin/dashboard-metrics');
      if (res.data.status === 'success') {
        setMetrics(res.data.data.metrics);
        setRecentOrders(res.data.data.recentOrders || []);
        setCurrentCarts(res.data.data.currentCarts || []);
      }
    } catch (err) {
      console.error("Dashboard engine metrics failed to sync.");
    }
  };

  const fetchActiveInventory = async () => {
    try {
      const res = await API.get('/products/catalog');
      if (res.data.status === 'success') {
        setProducts(res.data.data.products);
      }
    } catch (err) {
      console.error("Inventory snapshot failed to load.");
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setImportStatus('');
    setErrorMessage('');
  };

  const handleExcelImportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return setErrorMessage('Staging target missing.');

    try {
      setIsUploading(true);
      setImportStatus('Spawning database worker threads forks...');
      
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await API.post('/products/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.status === 'processing') {
        setImportStatus('⚡ Excel stream processing safely inside Background Worker Thread!');
        setSelectedFile(null);
        setTimeout(() => {
          fetchDashboardSnapshot();
          fetchActiveInventory();
        }, 3000);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Access pipeline rejected uploaded matrix.');
    } finally {
      setIsUploading(false);
    }
  };
  

  return (
    <div style={{ display: 'flex', background: '#f4f6f9', minHeight: '100vh', fontFamily: 'sans-serif', color: '#333' }}>
      
      {/* 🧭 LEFT SIDE NAVIGATION BAR (As per image_56ba01.png) */}
      <aside style={{ width: '260px', background: '#1e293b', color: '#fff', padding: '20px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 20px 20px 20px', borderBottom: '1px solid #334155', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', letterSpacing: '2px', margin: 0, fontWeight: 'bold' }}>ORRA ADMIN</h2>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '0 10px' }}>
          <button onClick={() => setActiveTab('dashboard')} style={{ width: '100%', padding: '12px 15px', background: activeTab === 'dashboard' ? '#334155' : 'transparent', border: 'none', color: '#fff', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>📊 Dashboard</button>
          <button onClick={() => setActiveTab('products')} style={{ width: '100%', padding: '12px 15px', background: activeTab === 'products' ? '#334155' : 'transparent', border: 'none', color: '#fff', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>💎 Products Inventory</button>
          <button style={{ width: '100%', padding: '12px 15px', background: 'transparent', border: 'none', color: '#94a3b8', textAlign: 'left', borderRadius: '6px', cursor: 'not-allowed' }}>📦 Orders (4)</button>
          <button style={{ width: '100%', padding: '12px 15px', background: 'transparent', border: 'none', color: '#94a3b8', textAlign: 'left', borderRadius: '6px', cursor: 'not-allowed' }}>🏷️ Price & Discounts</button>
        </nav>
        
        <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid #334155', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
          Operator: <strong>Tisha Dev</strong>
        </div>
      </aside>

      {/* 💻 MAIN ACTION CONTENT DISPLAY WRAPPER */}
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        {/* TOP STATUS BAR CONTAINER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: '#fff', padding: '15px 25px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>{activeTab === 'dashboard' ? 'Overview Operations Desk' : 'Master Diamond Matrix Grid'}</h3>
          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>🟢 Live Infrastructure Streamed</span>
        </div>

        {/* ─── TAB VIEW 1: CENTRAL COMMAND DASHBOARD LOGIC (image_56ba01.png layout) ─── */}
        {activeTab === 'dashboard' && (
          <div>
            {/* KPI TRACKING METRICS CARDS ROW BOX */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderLeft: '4px solid #10b981' }}>
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>🟢 ONLINE USERS</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.onlineUsers} Active</span>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>🛒 TOTAL ORDERS</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.totalOrders}</span>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>💎 TOTAL JEWELLERY LINES</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.totalJewellery} Rows</span>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderLeft: '4px solid #3b82f6' }}>
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>💰 ORDER SALES GROSS</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>₹{metrics.orderSalesRevenue.toLocaleString()}</span>
              </div>
            </div>

            {/* LOWER RECENT TRACKING REPOSITORY LOGS */}
            <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
              <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>Recent Order Logs Pipeline</h4>
              {recentOrders.length === 0 ? (
                <p style={{ color: '#9ca3af', textAlign: 'center', fontSize: '14px', padding: '20px' }}>No active transactions detected inside target cluster.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: '#6b7280', background: '#f8fafc' }}>
                      <th style={{ padding: '10px' }}>Order Token</th>
                      <th style={{ padding: '10px' }}>Customer Reference</th>
                      <th style={{ padding: '10px' }}>Financial Volume</th>
                      <th style={{ padding: '10px' }}>Processing Stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(o => (
                      <tr key={o._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '10px' }}><code>{o._id}</code></td>
                        <td style={{ padding: '10px' }}>{o.user?.name || 'Guest Client'}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>₹{o.grandTotalLocal}</td>
                        <td style={{ padding: '10px' }}><span style={{ color: '#d97706' }}>{o.orderStatus.toUpperCase()}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB VIEW 2: PRODUCTS INVENTORY GRID (image_56b67a.png Dynamic Changes) ─── */}
        {activeTab === 'products' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
            
            {/* THREAD BULK EXCEL UPLOADER INTERACTIVE COMPONENT */}
            <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h4 style={{ margin: '0 0 15px 0' }}>Bulk Excel Processing</h4>
              <form onSubmit={handleExcelImportSubmit}>
                <div style={{ border: '2px dashed #cbd5e1', padding: '30px 10px', borderRadius: '6px', textAlign: 'center', background: '#f8fafc', marginBottom: '15px' }}>
                  <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} style={{ fontSize: '12px' }} />
                </div>
                <button type="submit" disabled={isUploading} style={{ width: '100%', padding: '12px', background: '#1e293b', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {isUploading ? "Uploading Data Streams..." : "🚀 Load Matrix Rows"}
                </button>
              </form>
              {importStatus && <div style={{ marginTop: '15px', padding: '10px', background: '#eff6ff', color: '#1d4ed8', fontSize: '12px', borderRadius: '4px' }}>{importStatus}</div>}
              {errorMessage && <div style={{ marginTop: '15px', padding: '10px', background: '#fef2f2', color: '#991b1b', fontSize: '12px', borderRadius: '4px' }}>{errorMessage}</div>}
            </div>

            {/* LIVE DATA GRID ACCORDING TO REAL DIAMOND FILE SCHEMA */}
            <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h4 style={{ margin: '0 0 15px 0' }}>Active Matrix Repository Mapping</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '10px' }}>Shape</th>
                      <th style={{ padding: '10px' }}>Color</th>
                      <th style={{ padding: '10px' }}>Clarity</th>
                      <th style={{ padding: '10px' }}>Carat Scope</th>
                      <th style={{ padding: '10px' }}>Selling Price / Ct</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, idx) => (
                      <tr key={p._id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#0f172a' }}>{p.shape}</td>
                        <td style={{ padding: '10px' }}><span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{p.color}</span></td>
                        <td style={{ padding: '10px' }}>{p.clarity}</td>
                        <td style={{ padding: '10px', color: '#475569' }}>{p.carat_from} - {p.carat_to}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#059669' }}>₹{p.selling_price_per_ct?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}