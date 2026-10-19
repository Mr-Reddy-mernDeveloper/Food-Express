import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/useAuth";
import { useOrders } from "./context/useOrders";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import Home from "./pages/customer/Home";
import RestaurantList from "./pages/customer/RestaurantList";
import RestaurantDetail from "./pages/customer/RestaurantDetail";
import DishSearchResults from "./pages/customer/DishSearchResults";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import OrderConfirmation from "./pages/customer/OrderConfirmation";
import Orders from "./pages/customer/Orders";
import CustomerProfile from "./pages/customer/Profile";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import RestaurantDashboard from "./pages/restaurant/Dashboard";
import DeliveryDashboard from "./pages/delivery/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";

const RoleRoute = ({ role, children }) => {
  const { user, authLoading } = useAuth();
  if (authLoading) return <p role="status">Checking your session…</p>;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== role) {
    const homeByRole = {
      customer: "/",
      restaurant_partner: "/dashboard/restaurant",
      delivery_partner: "/dashboard/delivery",
    };
    return <Navigate to={homeByRole[user.role] || "/"} replace />;
  }
  return children;
};

const CustomerRoute = ({ children }) => {
  const { user } = useAuth();
  if (user && user.role !== "customer") {
    const dashboardByRole = {
      restaurant_partner: "/dashboard/restaurant",
      delivery_partner: "/dashboard/delivery",
    };
    return <Navigate to={dashboardByRole[user.role] || "/"} replace />;
  }
  return children;
};

const RequireCustomerLogin = ({ children }) => {
  const { user, authLoading } = useAuth();
  const location = useLocation();
  if (authLoading) return <p role="status">Checking your session…</p>;
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }
  if (user.role !== "customer") {
    return <Navigate to="/" replace />;
  }
  return children;
};

const GuestRoute = ({ children }) => {
  const { user, authLoading } = useAuth();
  if (authLoading) return <p role="status">Checking your session…</p>;
  if (!user) {
    return children;
  }
  const homeByRole = {
    customer: "/",
    restaurant_partner: "/dashboard/restaurant",
    delivery_partner: "/dashboard/delivery",
  };
  return <Navigate to={homeByRole[user.role] || "/"} replace />;
};

const AppContent = () => {
  const { apiError: authError, clearApiError: clearAuthError } = useAuth();
  const { apiError: ordersError, clearApiError: clearOrdersError } = useOrders();
  const apiError = authError || ordersError;

  const clearError = () => {
    clearAuthError();
    clearOrdersError();
  };

  return (
    <>
      <Header />
      {apiError && (
        <div className="app-api-error" role="alert">
          <span>{apiError}</span>
          <button type="button" onClick={clearError} aria-label="Dismiss error">×</button>
        </div>
      )}
      <div className="app-content">
        <Routes>
          <Route path="/" element={<CustomerRoute><Home /></CustomerRoute>} />
          <Route path="/restaurants" element={<CustomerRoute><RestaurantList /></CustomerRoute>} />
          <Route path="/restaurants/:id" element={<CustomerRoute><RestaurantDetail /></CustomerRoute>} />
          <Route path="/dishes/:dishName" element={<CustomerRoute><DishSearchResults /></CustomerRoute>} />
          <Route path="/cart" element={<CustomerRoute><Cart /></CustomerRoute>} />
          <Route
            path="/checkout"
            element={
              <RequireCustomerLogin>
                <Checkout />
              </RequireCustomerLogin>
            }
          />
          <Route path="/order-confirmation" element={<CustomerRoute><OrderConfirmation /></CustomerRoute>} />
          <Route path="/orders" element={<CustomerRoute><Orders /></CustomerRoute>} />
          <Route
            path="/profile"
            element={
              <RequireCustomerLogin>
                <CustomerProfile />
              </RequireCustomerLogin>
            }
          />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route
            path="/dashboard/restaurant"
            element={
              <RoleRoute role="restaurant_partner">
                <RestaurantDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard/delivery"
            element={
              <RoleRoute role="delivery_partner">
                <DeliveryDashboard />
              </RoleRoute>
            }
          />
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
      <Footer />
    </>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
