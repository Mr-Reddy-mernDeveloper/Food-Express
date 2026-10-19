import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/useCart";
import { useOrders } from "../../context/useOrders";
import { useAuth } from "../../context/useAuth";
import { formatCurrency } from "../../utils/currency";
import { getIndianPhoneDigits } from "../../utils/indianPhone";
import "./Checkout.css";

const Checkout = () => {
  const { total, clearCart, cartItems } = useCart();
  const { addOrders } = useOrders();
  const { user, availableRestaurants } = useAuth();
  const navigate = useNavigate();
  const defaultAddress = user?.addresses?.find(
    (savedAddress) => savedAddress.isDefault,
  );
  const orderGroups = useMemo(() => {
    const groups = new Map();
    cartItems.forEach((item) => {
      const items = groups.get(item.restaurantId) || [];
      items.push(item);
      groups.set(item.restaurantId, items);
    });
    return [...groups.entries()].map(([restaurantId, items]) => {
      const subtotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      const deliveryFee = subtotal > 500 ? 0 : subtotal < 200 ? 100 : 80;
      const platformFee = 10;
      const gst =
        Math.round((subtotal + deliveryFee + platformFee) * 0.18 * 100) / 100;
      return {
        restaurantId,
        items,
        subtotal,
        deliveryFee,
        platformFee,
        gst,
        total:
          Math.round((subtotal + deliveryFee + platformFee + gst) * 100) / 100,
      };
    });
  }, [cartItems]);
  const checkoutPricing = orderGroups.reduce(
    (pricing, group) => ({
      subtotal: pricing.subtotal + group.subtotal,
      deliveryFee: pricing.deliveryFee + group.deliveryFee,
      platformFee: pricing.platformFee + group.platformFee,
      gst: pricing.gst + group.gst,
      total: pricing.total + group.total,
    }),
    { subtotal: 0, deliveryFee: 0, platformFee: 0, gst: 0, total: 0 },
  );
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(() => getIndianPhoneDigits(user?.phone));
  const [addressOverride, setAddressOverride] = useState(null);
  const profileAddress = defaultAddress?.address || "";
  const address =
    addressOverride?.defaultAddressId === defaultAddress?.id &&
    addressOverride?.profileAddress === profileAddress
      ? addressOverride.value
      : profileAddress;
  const [coupon, setCoupon] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (cartItems.length === 0) {
    return (
      <div className="checkout">
        <h2>Your cart is empty</h2>
        <p>Add items to your cart before checking out.</p>
        <Link to="/restaurants">Browse restaurants</Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError("Name, phone and address are required");
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }
    const ordersToPlace = orderGroups.map((group) => ({
      ...group,
      restaurant: availableRestaurants.find(
        (restaurant) => restaurant.id === group.restaurantId,
      ),
    }));
    const offlineRestaurant = ordersToPlace.find(
      (group) => !group.restaurant?.online,
    );
    if (offlineRestaurant) {
      setError(
        `${offlineRestaurant.restaurant?.name || "A restaurant"} is currently offline. Remove its items before placing your order.`,
      );
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const placedOrders = await addOrders(
        ordersToPlace.map((group) => ({
          restaurantId: group.restaurantId,
          items: group.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
          customer: {
            name: name.trim(),
            phone: `+91${phone}`,
            address: address.trim(),
          },
          specialInstructions: specialInstructions.trim(),
          coupon: coupon.trim() || null,
        })),
      );
      const placedAt = placedOrders[0]?.createdAt || new Date().toISOString();
      const actualPricing = placedOrders.reduce(
        (pricing, order) => ({
          subtotal: pricing.subtotal + order.pricing.subtotal,
          deliveryFee: pricing.deliveryFee + order.pricing.deliveryFee,
          platformFee: pricing.platformFee + order.pricing.platformFee,
          gst: pricing.gst + order.pricing.gst,
          total: pricing.total + order.pricing.total,
        }),
        { subtotal: 0, deliveryFee: 0, platformFee: 0, gst: 0, total: 0 },
      );
      clearCart();
      navigate("/order-confirmation", {
        state: {
          orderId: placedOrders.map((order) => order.id).join(", "),
          placedAt,
          address: address.trim(),
          coupon: coupon.trim() || null,
          payment: "Cash on Delivery",
          total: actualPricing.total,
          pricing: { ...actualPricing, gstRate: 18 },
          restaurantName:
            placedOrders.length === 1
              ? placedOrders[0].restaurant.name
              : `${placedOrders.length} restaurants`,
          items: placedOrders.flatMap((order) =>
            order.items.map((item) => ({
              ...item,
              restaurantName: order.restaurant.name,
              cartKey: `${order.restaurantId}-${item.id}`,
            })),
          ),
          customerName: name.trim(),
          orders: placedOrders.map((order) => ({
            orderId: order.id,
            restaurantName: order.restaurant.name,
            total: order.total,
          })),
        },
      });
    } catch (orderError) {
      setError(orderError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout">
      <h2>Checkout</h2>
      <form onSubmit={handleSubmit} className="checkout-form">
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <div className="checkout-phone-input">
            <span aria-hidden="true">+91</span>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              pattern="[0-9]{10}"
              maxLength={10}
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
              }
              aria-describedby="phone-hint"
              required
            />
          </div>
          <small id="phone-hint" className="checkout-field-hint">
            Enter a valid 10-digit phone number to get delivery updates.
          </small>
        </div>
        <div className="form-group">
          <label htmlFor="address">Delivery Address</label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(event) =>
              setAddressOverride({
                defaultAddressId: defaultAddress?.id,
                profileAddress,
                value: event.target.value,
              })
            }
            required
          />
          <small className="checkout-field-hint">
            {user?.addresses?.some((savedAddress) => savedAddress.isDefault)
              ? "Prefilled from your default address. Manage saved addresses in your profile."
              : "Save delivery addresses from your profile to prefill checkout."}
          </small>
        </div>
        <div className="form-group">
          <label htmlFor="instructions">Special Instructions (optional)</label>
          <textarea
            id="instructions"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="coupon">Coupon (optional)</label>
          <input
            id="coupon"
            type="text"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
          />
        </div>
        <div className="form-group">
          <span>Payment Method</span>
          <p className="checkout-payment-method">Cash on Delivery</p>
          <small className="checkout-payment-note">
            Pay your delivery partner in cash when your order arrives.
          </small>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="summary">
          <p>
            <span>Food subtotal</span>
            <span>{formatCurrency(total)}</span>
          </p>
          <p>
            <span>
              Delivery fee · {orderGroups.length}{" "}
              {orderGroups.length === 1 ? "restaurant" : "restaurants"}
            </span>
            <span>
              {checkoutPricing.deliveryFee === 0
                ? "FREE"
                : formatCurrency(checkoutPricing.deliveryFee)}
            </span>
          </p>
          <p>
            <span>Platform fee</span>
            <span>{formatCurrency(checkoutPricing.platformFee)}</span>
          </p>
          <p>
            <span>GST (18%)</span>
            <span>{formatCurrency(checkoutPricing.gst)}</span>
          </p>
          <p className="summary-total">
            <strong>Final amount to pay</strong>
            <strong>{formatCurrency(checkoutPricing.total)}</strong>
          </p>
          <small>
            Fees and delivery are calculated separately for each restaurant
            order. Orders above ₹500 get free delivery.
          </small>
        </div>
        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? "Placing order…" : "Place Order"}
        </button>
      </form>
    </div>
  );
};

export default Checkout;
