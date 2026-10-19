import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isCustomer = !user || user.role === 'customer';
  const dashboardPath = user?.role === 'restaurant_partner'
    ? '/dashboard/restaurant'
    : user?.role === 'delivery_partner'
      ? '/dashboard/delivery'
      : null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <nav className="nav">
        <Link to="/" className="logo">FoodExpress</Link>
        <ul className="nav-links">
          {isCustomer ? (
            <>
              <li><Link to="/">Home</Link></li>
              <li>
                <Link to="/restaurants" className="nav-restaurants-link">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 10v10h16V10M3 10l2-6h14l2 6" />
                    <path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 20v-6h6v6" />
                  </svg>
                  <span>Restaurants</span>
                </Link>
              </li>
              <li><Link to="/cart">Cart</Link></li>
              {user && (
                <>
                  <li><Link to="/orders">Orders</Link></li>
                  <li><Link to="/profile">Profile</Link></li>
                </>
              )}
            </>
          ) : (
            <li><Link to={dashboardPath}>Partner Dashboard</Link></li>
          )}
          <li>
            {user ? (
              <button type="button" onClick={handleLogout}>Logout</button>
            ) : (
              <Link to="/login">Login</Link>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
