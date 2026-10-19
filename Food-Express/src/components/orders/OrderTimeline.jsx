import { formatTimestamp } from "../../utils/dateTime";
import "./OrderTimeline.css";

const statusLabels = {
  placed: "Order placed",
  accepted: "Restaurant accepted",
  ready_for_pickup: "Ready for pickup",
  delivery_assigned: "Delivery partner assigned",
  picked_up: "Picked up",
  delivered: "Delivered",
};

const timelineSteps = [
  { status: "placed", label: statusLabels.placed, rank: 0 },
  { status: "accepted", label: statusLabels.accepted, rank: 1 },
  { status: "ready_for_pickup", label: statusLabels.ready_for_pickup, rank: 2 },
  { status: "delivery_assigned", label: statusLabels.delivery_assigned, rank: 3 },
  { status: "picked_up", label: statusLabels.picked_up, rank: 4 },
  { status: "delivered", label: statusLabels.delivered, rank: 5 },
];

const statusRank = {
  pending: 0,
  accepted: 1,
  ready_for_pickup: 2,
  delivery_assigned: 3,
  in_transit: 4,
  picked_up: 4,
  delivered: 5,
};

const OrderTimeline = ({ order }) => {
  const history = order.statusHistory || [];
  const currentRank = statusRank[order.status] ?? -1;
  const isRejected = ["rejected", "rejected_by_delivery"].includes(order.status);
  const rejectionStatus = order.status;
  const rejectionEvent = history.find((entry) => entry.status === rejectionStatus);

  return (
    <section className="order-timeline" aria-label="Order status history">
      <h4>Order timeline</h4>
      <ol>
        {timelineSteps.map((step) => {
          const event = history.find(
            (entry) =>
              entry.status === step.status ||
              (step.status === "picked_up" && entry.status === "in_transit"),
          );
          const inferredComplete =
            step.status === "ready_for_pickup"
              ? order.readyForPickup
              : currentRank >= step.rank && !isRejected;
          const complete = Boolean(event) || inferredComplete;
          const timestamp = event?.at || (
            step.status === "placed" ? order.createdAt : null
          );
          const current =
            !isRejected &&
            (order.status === step.status ||
              (step.status === "picked_up" && order.status === "in_transit"));

          return (
            <li
              key={step.status}
              className={`order-timeline-step${complete ? " is-complete" : ""}${current ? " is-current" : ""}`}
            >
              <span>{step.label}</span>
              {timestamp && !Number.isNaN(new Date(timestamp).getTime()) ? (
                <time dateTime={timestamp}>{formatTimestamp(timestamp)}</time>
              ) : (
                <span className="order-timeline-time">
                  {complete ? "Timestamp unavailable for this earlier update" : "Not yet completed"}
                </span>
              )}
            </li>
          );
        })}
        {isRejected && (
          <li className="order-timeline-step is-complete is-current">
            <span>
              {rejectionStatus === "rejected_by_delivery"
                ? "Rejected by delivery partner"
                : "Rejected by restaurant"}
            </span>
            {rejectionEvent?.at ? (
              <time
                dateTime={rejectionEvent.at}
              >
                {formatTimestamp(rejectionEvent.at)}
              </time>
            ) : (
              <span className="order-timeline-time">Timestamp unavailable</span>
            )}
          </li>
        )}
      </ol>
    </section>
  );
};

export default OrderTimeline;
