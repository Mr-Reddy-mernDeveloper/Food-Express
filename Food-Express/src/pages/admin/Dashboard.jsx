import { useState } from 'react';
import { useOrders } from '../../context/useOrders';
import { formatCurrency } from '../../utils/currency';
import './Dashboard.css';

// Placeholder sample data for users, restaurants, deliveries, coupons
const sampleUsers = [
  { id: 'u1', name: 'Alice', role: 'Customer', email: 'alice@example.com' },
  { id: 'u2', name: 'Bob', role: 'Restaurant Owner', email: 'bob@restaurant.com' },
  { id: 'u3', name: 'Carol', role: 'Delivery Partner', email: 'carol@delivery.com' },
];

const sampleRestaurants = [];

const sampleDeliveryPartners = [
  { id: 'dp1', name: 'Dave', approved: true },
  { id: 'dp2', name: 'Eve', approved: false },
];

const sampleCoupons = [
  { code: 'WELCOME10', discount: '10%', expires: '2024-12-31' },
  { code: 'FREESHIP', discount: 'Free Shipping', expires: '2025-06-30' },
];

const AdminDashboard = () => {
  const { orders } = useOrders();
  const [selectedTab, setSelectedTab] = useState('overview');

  const renderOverview = () => (
    <div className="overview">
      <h3>Platform Overview</h3>
      <p>Total Users: {sampleUsers.length}</p>
      <p>Total Restaurants: {sampleRestaurants.length}</p>
      <p>Total Delivery Partners: {sampleDeliveryPartners.length}</p>
      <p>Total Orders: {orders.length}</p>
    </div>
  );

  const renderUserManagement = () => (
    <div className="users">
      <h3>User Management</h3>
      <table>
        <thead>
          <tr><th>Name</th><th>Role</th><th>Email</th></tr>
        </thead>
        <tbody>
          {sampleUsers.map(u => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.role}</td>
              <td>{u.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderRestaurantApproval = () => (
    <div className="restaurants">
      <h3>Restaurant Approval</h3>
      <table>
        <thead>
          <tr><th>Name</th><th>Status</th></tr>
        </thead>
        <tbody>
          {sampleRestaurants.map(r => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.approved ? 'Approved' : 'Pending'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderDeliveryPartnerApproval = () => (
    <div className="delivery-partners">
      <h3>Delivery Partner Approval</h3>
      <table>
        <thead>
          <tr><th>Name</th><th>Status</th></tr>
        </thead>
        <tbody>
          {sampleDeliveryPartners.map(dp => (
            <tr key={dp.id}>
              <td>{dp.name}</td>
              <td>{dp.approved ? 'Approved' : 'Pending'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderOrderMonitoring = () => (
    <div className="orders">
      <h3>Order Monitoring</h3>
      <table>
        <thead>
          <tr><th>Order ID</th><th>Status</th><th>Total</th></tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.status}</td>
              <td>{formatCurrency(o.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCouponManagement = () => (
    <div className="coupons">
      <h3>Coupon Management</h3>
      <table>
        <thead>
          <tr><th>Code</th><th>Discount</th><th>Expires</th></tr>
        </thead>
        <tbody>
          {sampleCoupons.map(c => (
            <tr key={c.code}>
              <td>{c.code}</td>
              <td>{c.discount}</td>
              <td>{c.expires}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics">
      <h3>Analytics Overview</h3>
      <p>Mock analytics could include order volume trends, revenue, top cuisines, etc.</p>
    </div>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'overview': return renderOverview();
      case 'users': return renderUserManagement();
      case 'restaurants': return renderRestaurantApproval();
      case 'deliveryPartners': return renderDeliveryPartnerApproval();
      case 'orders': return renderOrderMonitoring();
      case 'coupons': return renderCouponManagement();
      case 'analytics': return renderAnalytics();
      default: return null;
    }
  };

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      <nav className="admin-nav">
        <button onClick={() => setSelectedTab('overview')}>Overview</button>
        <button onClick={() => setSelectedTab('users')}>Users</button>
        <button onClick={() => setSelectedTab('restaurants')}>Restaurants</button>
        <button onClick={() => setSelectedTab('deliveryPartners')}>Delivery Partners</button>
        <button onClick={() => setSelectedTab('orders')}>Orders</button>
        <button onClick={() => setSelectedTab('coupons')}>Coupons</button>
        <button onClick={() => setSelectedTab('analytics')}>Analytics</button>
      </nav>
      <section className="admin-content">
        {renderContent()}
      </section>
    </div>
  );
};

export default AdminDashboard;
