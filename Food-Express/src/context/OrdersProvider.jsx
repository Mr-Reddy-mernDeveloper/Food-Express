import { useCallback, useEffect, useState } from "react";
import { OrdersContext } from "./OrdersContext";
import { useAuth } from "./useAuth";
import { apiRequest } from "../utils/api";

const OrdersProvider = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersOwnerEmail, setOrdersOwnerEmail] = useState("");
  const [apiError, setApiError] = useState("");

  const refreshOrders = useCallback(async () => {
    if (!user) {
      return;
    }
    try {
      const result = await apiRequest("/orders");
      setOrders(result.orders);
      setOrdersOwnerEmail(user.email);
      setApiError("");
    } catch (error) {
      setApiError(error.message);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }
    const initialRefresh = window.setTimeout(() => {
      void refreshOrders();
    }, 0);
    const refreshInterval = window.setInterval(() => {
      void refreshOrders();
    }, 10000);
    const refreshOnFocus = () => {
      void refreshOrders();
    };
    window.addEventListener("focus", refreshOnFocus);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [user, refreshOrders]);

  const addOrders = useCallback(async (newOrders) => {
    try {
      const result = await apiRequest("/orders/batch", {
        method: "POST",
        body: { orders: newOrders },
      });
      setOrders((currentOrders) => [...result.orders, ...currentOrders]);
      setOrdersOwnerEmail(user.email);
      setApiError("");
      return result.orders;
    } catch (error) {
      setApiError(error.message);
      throw error;
    }
  }, [user]);

  const updateOrder = useCallback(async (orderId, updates) => {
    try {
      const result = await apiRequest(`/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        body: updates,
      });
      setOrders((currentOrders) =>
        currentOrders.map((order) => order.id === orderId ? result.order : order),
      );
      setApiError("");
      return result.order;
    } catch (error) {
      setApiError(error.message);
      return null;
    }
  }, []);

  const visibleOrders = user?.email === ordersOwnerEmail ? orders : [];

  return (
    <OrdersContext.Provider
      value={{
        orders: visibleOrders,
        apiError,
        clearApiError: () => setApiError(""),
        refreshOrders,
        addOrders,
        updateOrder,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
};

export default OrdersProvider;
