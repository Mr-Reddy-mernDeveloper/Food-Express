import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useOrders } from "../../context/useOrders";
import { useAuth } from "../../context/useAuth";
import { formatCurrency } from "../../utils/currency";
import { formatTimestamp } from "../../utils/dateTime";
import OrderDetails from "../../components/orders/OrderDetails";
import OrderTimeline from "../../components/orders/OrderTimeline";
import "./Orders.css";

const orderProgress = {
  pending: "Your order is pending. It needs to be approved by the restaurant partner.",
  accepted: "Restaurant accepted your order. Waiting for a delivery partner.",
  ready_for_pickup: "Restaurant prepared your order. It is ready for pickup.",
  delivery_assigned: "A delivery partner accepted your order. Waiting for pickup.",
  in_transit: "A delivery partner accepted your order. Waiting for pickup.",
  picked_up: "Your delivery partner is on the way.",
  delivered: "Your order has been delivered.",
  rejected: "The restaurant could not accept your order.",
  rejected_by_delivery: "The delivery partner could not complete this order.",
};

const statusLabels = {
  pending: "Pending",
  accepted: "Accepted",
  ready_for_pickup: "Ready for pickup",
  delivery_assigned: "Partner assigned",
  in_transit: "Partner assigned",
  picked_up: "On the way",
  delivered: "Delivered",
  rejected: "Rejected",
  rejected_by_delivery: "Delivery unavailable",
};

const completedStatuses = new Set(["delivered"]);
const cancelledStatuses = new Set(["rejected", "rejected_by_delivery"]);

const getOrderGroup = (status) => {
  if (completedStatuses.has(status)) return "delivered";
  if (cancelledStatuses.has(status)) return "cancelled";
  return "active";
};

const Orders = () => {
  const { orders } = useOrders();
  const { availableRestaurants } = useAuth();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const customerOrders = useMemo(() => orders, [orders]);
  const recentOrders = useMemo(
    () => [...customerOrders].reverse(),
    [customerOrders],
  );
  const counts = {
    all: customerOrders.length,
    active: customerOrders.filter((order) => getOrderGroup(order.status) === "active").length,
    delivered: customerOrders.filter((order) => getOrderGroup(order.status) === "delivered").length,
    cancelled: customerOrders.filter((order) => getOrderGroup(order.status) === "cancelled").length,
  };
  const visibleOrders = recentOrders.filter((order) => {
    const restaurant = availableRestaurants.find((item) => item.id === order.restaurantId);
    const matchesFilter = filter === "all" || getOrderGroup(order.status) === filter;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      order.id?.toLowerCase().includes(query) ||
      restaurant?.name?.toLowerCase().includes(query) ||
      order.items?.some((item) => item.name?.toLowerCase().includes(query));
    return matchesFilter && matchesSearch;
  });
  const filters = [
    { value: "all", label: "All orders" },
    { value: "active", label: "In progress" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <main className="customer-orders">
      <header className="orders-page-heading">
        <div>
          <span className="orders-eyebrow">YOUR FOOD JOURNEY</span>
          <h1>Your orders</h1>
          <p>Follow your deliveries and revisit your past favourites.</p>
        </div>
        <Link to="/restaurants" className="orders-browse-link">
          Explore restaurants <span aria-hidden="true">→</span>
        </Link>
      </header>
      {customerOrders.length === 0 ? (
        <div className="orders-empty">
          <span className="orders-empty-art" aria-hidden="true">🍽</span>
          <span className="orders-eyebrow">A LITTLE SPACE FOR SOMETHING DELICIOUS</span>
          <h2>Your order story starts here</h2>
          <p>Once you place an order, you can follow every step of its journey here.</p>
          <Link to="/restaurants">Find your next favourite <span aria-hidden="true">→</span></Link>
        </div>
      ) : (
        <>
          <section className="orders-overview" aria-label="Order summary">
            <article className="orders-overview-card">
              <span className="orders-overview-icon is-total" aria-hidden="true">↗</span>
              <div><span>Total orders</span><strong>{counts.all}</strong></div>
            </article>
            <article className="orders-overview-card">
              <span className="orders-overview-icon is-active" aria-hidden="true">◷</span>
              <div><span>In progress</span><strong>{counts.active}</strong></div>
            </article>
            <article className="orders-overview-card">
              <span className="orders-overview-icon is-delivered" aria-hidden="true">✓</span>
              <div><span>Delivered</span><strong>{counts.delivered}</strong></div>
            </article>
          </section>

          <section className="orders-controls" aria-label="Find orders">
            <div className="orders-filter-list" role="group" aria-label="Filter orders">
              {filters.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`orders-filter-button${filter === option.value ? " is-selected" : ""}`}
                  aria-pressed={filter === option.value}
                  onClick={() => setFilter(option.value)}
                >
                  {option.label}<span>{counts[option.value]}</span>
                </button>
              ))}
            </div>
            <label className="orders-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search restaurant, dish or order ID"
                aria-label="Search orders by restaurant, dish or order ID"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} aria-label="Clear order search">×</button>
              )}
            </label>
          </section>

          {visibleOrders.length === 0 ? (
            <section className="orders-filter-empty" aria-live="polite">
              <span aria-hidden="true">⌕</span>
              <h2>No matching orders</h2>
              <p>Try a different search or choose another order filter.</p>
              <button type="button" onClick={() => { setSearch(""); setFilter("all"); }}>
                Show all orders
              </button>
            </section>
          ) : (
            <div className="orders-list">
              {visibleOrders.map((order) => {
            const restaurant = availableRestaurants.find(
              (item) => item.id === order.restaurantId,
            );
            const group = getOrderGroup(order.status);
            const itemCount = order.items.reduce((count, item) => count + (item.quantity || 0), 0);

            return (
              <article className={`customer-order is-${group}`} key={order.id}>
                <div className="customer-order-heading">
                  <div>
                    <span className="customer-order-restaurant-mark" aria-hidden="true">
                      {restaurant?.name?.charAt(0)?.toUpperCase() || "F"}
                    </span>
                    <div>
                      <h2>{restaurant?.name || "Restaurant"}</h2>
                      <p>Order {order.id}</p>
                    </div>
                  </div>
                  <span className={`order-status order-status-${group}`}>
                    <span aria-hidden="true">{group === "active" ? "◷" : group === "delivered" ? "✓" : "!"}</span>
                    {statusLabels[order.status] || order.status.replaceAll("_", " ")}
                  </span>
                </div>
                {order.createdAt && (
                  <p className="customer-order-date">
                    Placed <time dateTime={order.createdAt}>{formatTimestamp(order.createdAt)}</time>
                  </p>
                )}
                <p className="order-progress" role="status">
                  <span className="order-progress-dot" aria-hidden="true" />
                  {orderProgress[order.status] || statusLabels[order.status] || order.status.replaceAll("_", " ")}
                </p>
                <div className="customer-order-footer">
                  <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
                  <strong>{formatCurrency(order.total)}</strong>
                </div>
                <OrderDetails>
                  <p>
                    <strong>Restaurant:</strong>{" "}
                    {["accepted", "ready_for_pickup", "delivery_assigned", "in_transit", "picked_up", "delivered"].includes(order.status)
                      ? "Accepted"
                      : order.status === "rejected"
                        ? "Rejected"
                        : "Awaiting acceptance"}
                  </p>
                  {order.createdAt && (
                    <p>
                      <strong>Order placed:</strong>{" "}
                      <time dateTime={order.createdAt}>{formatTimestamp(order.createdAt)}</time>
                    </p>
                  )}
                  {order.cancellationReason && (
                    <p className="customer-order-cancellation-reason">
                      <strong>Cancellation reason:</strong> {order.cancellationReason}
                    </p>
                  )}
                  <OrderTimeline order={order} />
                  {order.deliveryPartner && (
                    <div className="delivery-partner-contact">
                      <p><strong>Delivery partner:</strong> {order.deliveryPartner.name}</p>
                      <p><strong>Contact number:</strong> {order.deliveryPartner.phone || "Not provided"}</p>
                    </div>
                  )}
                  <ul>
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {item.name} × {item.quantity}
                        <span>
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="customer-order-total">
                    Final amount: {formatCurrency(order.total)}
                  </p>
                  {order.pricing && (
                    <div className="order-pricing">
                      <p>Food subtotal: {formatCurrency(order.pricing.subtotal)}</p>
                      <p>Delivery fee: {formatCurrency(order.pricing.deliveryFee)}</p>
                      <p>Platform fee: {formatCurrency(order.pricing.platformFee)}</p>
                      <p>GST ({order.pricing.gstRate}%): {formatCurrency(order.pricing.gst)}</p>
                    </div>
                  )}
                  {order.customer?.address && (
                    <p className="customer-order-address">
                      Delivery address: {order.customer.address}
                    </p>
                  )}
                </OrderDetails>
              </article>
            );
          })}
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default Orders;
