import { useOrders } from "../../context/useOrders";
import { useAuth } from "../../context/useAuth";
import { formatCurrency } from "../../utils/currency";
import { formatTimestamp } from "../../utils/dateTime";
import OrderDetails from "../../components/orders/OrderDetails";
import OrderTimeline from "../../components/orders/OrderTimeline";
import "./Dashboard.css";

const DeliveryDashboard = () => {
  const { orders, updateOrder } = useOrders();
  const { user, availableRestaurants } = useAuth();
  const availableOrders = orders.filter((order) => {
    const restaurant = availableRestaurants.find(
      (candidate) => candidate.id === order.restaurantId,
    );
    return restaurant &&
      ["accepted", "ready_for_pickup"].includes(order.status) &&
      !order.deliveryPartner &&
      !order.rejectedDeliveryPartnerEmails?.includes(user?.email);
  });
  const assignedOrders = orders.filter(
    (order) => order.deliveryPartner?.email === user?.email,
  );
  const activeOrders = assignedOrders.filter((order) => order.status !== "delivered");
  const completedOrders = assignedOrders.filter((order) => order.status === "delivered");
  const earningsAmountFor = (order) => Math.round(
    (
      Number(order.pricing?.deliveryFee || 0) +
      Number(order.pricing?.gst || 0)
    ) * 100,
  ) / 100;
  const getRecordedEarnings = (order) => order.deliveryEarnings ?? earningsAmountFor(order);
  const completedEarnings = completedOrders.reduce(
    (total, order) => total + getRecordedEarnings(order),
    0,
  );

  const handleAccept = (orderId) => {
    updateOrder(orderId, {
      deliveryPartner: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      status: "delivery_assigned",
    });
  };

  const handlePickupComplete = (orderId) => {
    updateOrder(orderId, { status: "picked_up" });
  };

  const handleDelivered = (order) => {
    updateOrder(order.id, {
      status: "delivered",
      deliveryEarnings: earningsAmountFor(order),
    });
  };

  const handleReject = (order) => {
    updateOrder(order.id, {
      rejectedDeliveryPartnerEmails: [
        ...(order.rejectedDeliveryPartnerEmails || []),
        user.email,
      ],
    });
  };

  const earningsFor = (order) => formatCurrency(earningsAmountFor(order));

  const getRestaurant = (order) => order.restaurant || availableRestaurants.find(
    (candidate) => candidate.id === order.restaurantId,
  );

  const getStatusLabel = (status) => ({
    delivery_assigned: "Accepted · awaiting pickup",
    picked_up: "On the way",
    delivered: "Delivered",
  }[status] || status.replaceAll("_", " "));

  return (
    <div className="delivery-dashboard">
      <header className="delivery-dashboard-header">
        <div>
          <span className="delivery-eyebrow">DELIVERY PARTNER</span>
          <h1>Good work, {user?.name || "Partner"}</h1>
          <p>Manage delivery requests and keep every order moving.</p>
        </div>
        <span className="delivery-online-status"><span /> Ready for deliveries</span>
      </header>

      <section className="delivery-stats" aria-label="Delivery summary">
        <article className="delivery-stat-card">
          <span className="delivery-stat-icon is-available" aria-hidden="true">⌖</span>
          <div><span>Available</span><strong>{availableOrders.length}</strong></div>
        </article>
        <article className="delivery-stat-card">
          <span className="delivery-stat-icon is-active" aria-hidden="true">◷</span>
          <div><span>Active deliveries</span><strong>{activeOrders.length}</strong></div>
        </article>
        <article className="delivery-stat-card">
          <span className="delivery-stat-icon is-completed" aria-hidden="true">✓</span>
          <div><span>Completed</span><strong>{completedOrders.length}</strong></div>
        </article>
        <article className="delivery-stat-card">
          <span className="delivery-stat-icon is-earnings" aria-hidden="true">₹</span>
          <div><span>Estimated earnings</span><strong>{formatCurrency(completedEarnings)}</strong></div>
        </article>
      </section>

      <section className="delivery-section">
        <div className="delivery-section-heading">
          <div>
            <span className="delivery-eyebrow">PICK UP A NEW DELIVERY</span>
            <h2>Available deliveries</h2>
          </div>
          <span className="delivery-count">{availableOrders.length} available</span>
        </div>
        {availableOrders.length === 0 ? (
          <div className="delivery-empty-state">
            <span className="delivery-empty-icon" aria-hidden="true">⌖</span>
            <div>
              <h3>{activeOrders.length ? "You’re up to date" : "No deliveries available right now"}</h3>
              <p>
                {activeOrders.length
                  ? "New requests will appear here while you complete your active deliveries."
                  : "Keep this page handy. New restaurant requests will show up here."}
              </p>
            </div>
          </div>
        ) : (
          <div className="delivery-order-grid">
            {availableOrders.map((order) => {
              const restaurant = getRestaurant(order);
              const itemCount = order.items.reduce((count, item) => count + (item.quantity || 0), 0);
              return (
                <article key={order.id} className="delivery-order-card">
                  <div className="delivery-order-card-top">
                    <span className="delivery-order-mark" aria-hidden="true">↗</span>
                    <span className="delivery-order-badge is-request">New request</span>
                  </div>
                  <p className="delivery-order-id">ORDER {order.id}</p>
                  <h3>{restaurant?.name || "Restaurant"}</h3>
                  <div className="delivery-order-facts">
                    <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                  <p className="delivery-earnings-estimate">
                    Estimated earnings <strong>{earningsFor(order)}</strong>
                  </p>
                  <OrderDetails>
                    {order.createdAt && (
                      <p><strong>Order placed:</strong> <time dateTime={order.createdAt}>{formatTimestamp(order.createdAt)}</time></p>
                    )}
                    <p><strong>Restaurant location:</strong> {restaurant?.address || "Not provided"}</p>
                    <p><strong>Restaurant contact:</strong> {restaurant?.phone || "Not provided"}</p>
                    <p><strong>Customer:</strong> {order.customer?.name} ({order.customer?.phone})</p>
                    <p><strong>Delivery address:</strong> {order.customer?.address || "Not provided"}</p>
                    <ul>{order.items.map((item) => <li key={item.id}>{item.name} × {item.quantity}</li>)}</ul>
                    {order.specialInstructions && <p><strong>Special instructions:</strong> {order.specialInstructions}</p>}
                    <OrderTimeline order={order} />
                  </OrderDetails>
                  <div className="delivery-actions">
                    <button className="delivery-primary-action" type="button" onClick={() => handleAccept(order.id)}>
                      Accept delivery
                    </button>
                    <button className="delivery-secondary-action" type="button" onClick={() => handleReject(order)}>
                      Pass
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="delivery-section">
        <div className="delivery-section-heading">
          <div>
            <span className="delivery-eyebrow">YOUR CURRENT ROUTE</span>
            <h2>Active deliveries</h2>
          </div>
          <span className="delivery-count">{activeOrders.length} active</span>
        </div>
        {activeOrders.length === 0 ? (
          <div className="delivery-empty-state is-compact">
            <span className="delivery-empty-icon is-success" aria-hidden="true">✓</span>
            <div>
              <h3>No active deliveries</h3>
              <p>Accept an available delivery to see your route here.</p>
            </div>
          </div>
        ) : (
          <div className="delivery-order-grid">
            {activeOrders.map((order) => {
              const restaurant = getRestaurant(order);
              const itemCount = order.items.reduce((count, item) => count + (item.quantity || 0), 0);
              return (
                <article className="delivery-order-card is-assigned" key={order.id}>
                  <div className="delivery-order-card-top">
                    <span className="delivery-order-mark is-route" aria-hidden="true">⌖</span>
                    <span className={`delivery-order-badge ${order.status === "picked_up" ? "is-on-route" : "is-waiting"}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <p className="delivery-order-id">ORDER {order.id}</p>
                  <h3>{restaurant?.name || "Restaurant"}</h3>
                  <div className="delivery-route-summary">
                    <div><span className="route-dot is-pickup" /><span><small>Pickup</small><strong>{restaurant?.address || "Restaurant address not provided"}</strong></span></div>
                    <div><span className="route-dot is-dropoff" /><span><small>Drop-off</small><strong>{order.customer?.address || "Customer address not provided"}</strong></span></div>
                  </div>
                  <div className="delivery-order-facts">
                    <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                  <OrderDetails>
                    {order.createdAt && (
                      <p><strong>Order placed:</strong> <time dateTime={order.createdAt}>{formatTimestamp(order.createdAt)}</time></p>
                    )}
                    <p><strong>Customer:</strong> {order.customer?.name}</p>
                    <p><strong>Customer contact:</strong> {order.customer?.phone || "Not provided"}</p>
                    <p><strong>Restaurant contact:</strong> {restaurant?.phone || "Not provided"}</p>
                    <OrderTimeline order={order} />
                    <ul>{order.items.map((item) => <li key={item.id}>{item.name} × {item.quantity}</li>)}</ul>
                  </OrderDetails>
                  {order.status === "delivery_assigned" && order.readyForPickup && (
                    <div className="delivery-actions">
                      <button className="delivery-primary-action" type="button" onClick={() => handlePickupComplete(order.id)}>
                        Mark as picked up
                      </button>
                    </div>
                  )}
                  {order.status === "picked_up" && (
                    <div className="delivery-actions">
                      <button className="delivery-primary-action" type="button" onClick={() => handleDelivered(order)}>
                        Complete delivery
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {completedOrders.length > 0 && (
        <section className="delivery-section delivery-completed-section">
          <div className="delivery-section-heading">
            <div>
              <span className="delivery-eyebrow">NICE WORK</span>
              <h2>Recently completed</h2>
            </div>
            <span className="delivery-count">{completedOrders.length} completed</span>
          </div>
          <div className="delivery-completed-list">
            {completedOrders.map((order) => {
              const restaurant = getRestaurant(order);
              return (
                <article key={order.id} className="delivery-completed-card">
                  <span className="delivery-completed-check" aria-hidden="true">✓</span>
                  <div>
                    <h3>{restaurant?.name || "Restaurant"}</h3>
                    <p>Order {order.id}</p>
                  </div>
                  <strong>{formatCurrency(getRecordedEarnings(order))}</strong>
                  <span className="delivery-completed-status">Delivered</span>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default DeliveryDashboard;
