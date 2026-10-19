import { useCart } from '../../context/useCart';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/currency';
import './Cart.css';

const Cart = () => {
  const { cartItems, removeItem, updateQuantity, total } = useCart();

  const handleChange = (id, restaurantId, e) => {
    const qty = parseInt(e.target.value, 10);
    if (qty > 0) updateQuantity(id, restaurantId, qty);
  };

  if (cartItems.length === 0) {
    return (
      <main className="cart cart-empty-page">
        <div className="cart-empty-card">
          <span className="cart-empty-icon" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none">
              <path d="M8 10h4l4.2 20.2a4 4 0 0 0 3.9 3.2h15.2a4 4 0 0 0 3.9-3.1L42 18H14" />
              <circle cx="21" cy="40" r="2.2" />
              <circle cx="35" cy="40" r="2.2" />
            </svg>
          </span>
          <span className="cart-eyebrow">READY WHEN YOU ARE</span>
          <h1>Your cart is taking a little break.</h1>
          <p>Explore local favourites and add something delicious to get started.</p>
          <Link to="/restaurants" className="cart-browse-button">
            Browse restaurants <span aria-hidden="true">→</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cart cart-page">
      <div className="cart-page-heading">
        <div>
          <span className="cart-eyebrow">YOUR SELECTION</span>
          <h1>Your cart</h1>
          <p>{cartItems.length} {cartItems.length === 1 ? "item" : "items"} ready to make your day.</p>
        </div>
        <Link to="/restaurants" className="cart-continue-link">
          <span aria-hidden="true">←</span> Continue browsing
        </Link>
      </div>
      <div className="cart-layout">
        <section className="cart-items-card" aria-label="Cart items">
          <div className="cart-items-heading">
            <h2>Order items</h2>
            <span>{cartItems.length} {cartItems.length === 1 ? "item" : "items"}</span>
          </div>
          <div className="cart-items-list">
            {cartItems.map((item) => (
              <article className="cart-item" key={`${item.restaurantId}-${item.id}`}>
                <div className="cart-item-art" aria-hidden="true">
                  <span>{item.name?.charAt(0)?.toUpperCase() || "F"}</span>
                </div>
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  {item.restaurantName && <p>{item.restaurantName}</p>}
                  <span className="cart-item-unit-price">{formatCurrency(item.price)} each</span>
                </div>
                <div className="cart-item-controls">
                  <label htmlFor={`quantity-${item.restaurantId}-${item.id}`}>Quantity</label>
                  <input
                    id={`quantity-${item.restaurantId}-${item.id}`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) => handleChange(item.id, item.restaurantId, event)}
                  />
                </div>
                <div className="cart-item-subtotal">
                  <span>Subtotal</span>
                  <strong>{formatCurrency(item.price * item.quantity)}</strong>
                </div>
                <button
                  className="cart-remove-button"
                  type="button"
                  onClick={() => removeItem(item.id, item.restaurantId)}
                  aria-label={`Remove ${item.name} from cart`}
                  title="Remove item"
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                  </svg>
                </button>
              </article>
            ))}
          </div>
          <Link to="/restaurants" className="cart-add-more-link">
            <span aria-hidden="true">+</span> Add more items
          </Link>
        </section>
        <aside className="cart-summary-card">
          <span className="cart-eyebrow">ALMOST THERE</span>
          <h2>Order summary</h2>
          <div className="cart-summary-row">
            <span>Subtotal · {cartItems.length} {cartItems.length === 1 ? "item" : "items"}</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <p className="cart-summary-note">Delivery and taxes are calculated at checkout.</p>
          <div className="cart-summary-total">
            <span>Subtotal</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
          <Link to="/checkout" className="checkout-button">
            Continue to checkout <span aria-hidden="true">→</span>
          </Link>
          <p className="cart-secure-note">
            <span aria-hidden="true">✓</span> Your order details are safe with us
          </p>
        </aside>
      </div>
    </main>
  );
};

export default Cart;
