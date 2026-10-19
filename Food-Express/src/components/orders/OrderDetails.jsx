import "./OrderDetails.css";

const OrderDetails = ({ children }) => (
  <details className="order-details">
    <summary>
      <span className="order-details-show">Show complete details</span>
      <span className="order-details-hide">Hide complete details</span>
    </summary>
    <div className="order-details-content">{children}</div>
  </details>
);

export default OrderDetails;
