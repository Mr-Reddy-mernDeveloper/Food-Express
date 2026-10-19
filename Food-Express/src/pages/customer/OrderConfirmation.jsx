import { Link, useLocation } from 'react-router-dom';
import { formatTimestamp } from '../../utils/dateTime';
import { formatCurrency } from '../../utils/currency';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
  const { state } = useLocation();

  if (!state) {
    return (
      <main className="order-confirmation order-confirmation-empty">
        <div className="confirmation-card">
          <span className="confirmation-icon" aria-hidden="true">⌁</span>
          <span className="confirmation-eyebrow">ORDER DETAILS</span>
          <h1>No recent order to show</h1>
          <p>Place an order to see its confirmation and itemized receipt here.</p>
          <Link className="confirmation-primary-link" to="/restaurants">Browse restaurants</Link>
        </div>
      </main>
    );
  }

  const {
    address,
    coupon,
    payment,
    total,
    pricing,
    restaurantName,
    items = [],
    customerName,
    orderId,
    placedAt,
    orders = [],
  } = state;

  return (
    <main className="order-confirmation">
      <section className="confirmation-card" aria-labelledby="confirmation-title">
        <header className="confirmation-success">
          <span className="confirmation-check" aria-hidden="true">✓</span>
          <span className="confirmation-eyebrow">ORDER RECEIVED</span>
          <h1 id="confirmation-title">Thanks{customerName ? `, ${customerName}` : ''}!</h1>
          <p>Your order has been sent to the restaurant. It is now waiting for the restaurant partner’s approval.</p>
        </header>

        <div className="confirmation-order-meta">
          <div>
            <span>{orders.length > 1 ? 'Orders' : 'Order ID'}</span>
            <strong>{orders.length > 1 ? orders.length : orderId || '—'}</strong>
          </div>
          <div>
            <span>Restaurant</span>
            <strong>{restaurantName || 'Restaurant'}</strong>
          </div>
          <div>
            <span>Placed</span>
            <strong>
              {placedAt && !Number.isNaN(new Date(placedAt).getTime())
                ? formatTimestamp(placedAt)
                : 'Just now'}
            </strong>
          </div>
        </div>

        {orders.length > 0 && (
          <section className="confirmation-multi-orders" aria-label="Restaurant orders">
            {orders.map((order) => (
              <div key={order.orderId}>
                <span>{order.restaurantName}</span>
                <strong>{order.orderId}</strong>
                <strong>{formatCurrency(order.total)}</strong>
              </div>
            ))}
          </section>
        )}

        <div className="confirmation-content">
          <section className="confirmation-items" aria-labelledby="confirmation-items-title">
            <div className="confirmation-section-heading">
              <h2 id="confirmation-items-title">Your items</h2>
              <span>{items.length} {items.length === 1 ? 'item' : 'items'}</span>
            </div>
            {items.length ? (
              <ul>
                {items.map((item) => (
                  <li key={item.cartKey || item.id}>
                    <span className="confirmation-item-quantity">{item.quantity}×</span>
                    <span className="confirmation-item-name">
                      {item.name}
                      {item.restaurantName && <small>{item.restaurantName}</small>}
                    </span>
                    <strong>{formatCurrency(item.price * item.quantity)}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="confirmation-items-note">Your item list is available in order details.</p>
            )}
          </section>

          <aside className="confirmation-side-details">
            <section>
              <h2>Delivery details</h2>
              <p>{address || 'Address not provided'}</p>
            </section>
            <section>
              <h2>Payment</h2>
              <p>{payment || 'Cash on Delivery'}</p>
              <small>Pay in cash when your order arrives.</small>
            </section>
            {coupon && <section><h2>Coupon</h2><p>{coupon}</p></section>}
          </aside>
        </div>

        {pricing && (
          <section className="confirmation-price-summary" aria-label="Price summary">
            <p><span>Food subtotal</span><span>{formatCurrency(pricing.subtotal)}</span></p>
            <p><span>Delivery fee</span><span>{formatCurrency(pricing.deliveryFee)}</span></p>
            <p><span>Platform fee</span><span>{formatCurrency(pricing.platformFee)}</span></p>
            <p><span>GST ({pricing.gstRate}%)</span><span>{formatCurrency(pricing.gst)}</span></p>
            <p className="confirmation-total"><strong>Total payable</strong><strong>{formatCurrency(Number(total))}</strong></p>
          </section>
        )}

        <footer className="confirmation-actions">
          <Link className="confirmation-primary-link" to="/orders">Track your order <span aria-hidden="true">→</span></Link>
          <Link className="confirmation-secondary-link" to="/restaurants">Continue browsing</Link>
        </footer>
      </section>
    </main>
  );
};

export default OrderConfirmation;
