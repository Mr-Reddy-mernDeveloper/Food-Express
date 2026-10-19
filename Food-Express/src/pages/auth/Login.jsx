import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authLoading } = useAuth();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const registrationMessage = location.state?.registrationMessage;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const authenticatedUser = await login(email, password);
      const roleHome = {
        customer: '/',
        restaurant_partner: '/dashboard/restaurant',
        delivery_partner: '/dashboard/delivery',
      };
      const destination = authenticatedUser.role === 'customer' && location.state?.from
        ? location.state.from
        : roleHome[authenticatedUser.role] || '/';
      navigate(destination, { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page login-page">
      <section className="login-welcome" aria-label="Welcome to FoodExpress">
        <span className="login-welcome-mark" aria-hidden="true">F</span>
        <div>
          <span className="login-eyebrow">GOOD FOOD, GOOD MOOD</span>
          <h1>Your next favourite meal is just around the corner.</h1>
          <p>Sign in to find something delicious and follow every order right to your door.</p>
        </div>
        <div className="login-food-art" aria-hidden="true">
          <span className="login-food-art-inner" />
          <span className="login-food-art-spark login-food-art-spark-one">✦</span>
          <span className="login-food-art-spark login-food-art-spark-two">✧</span>
        </div>
        <span className="login-welcome-caption">Made fresh. Delivered with care.</span>
      </section>
      <section className="login-card" aria-labelledby="login-title">
        <span className="login-eyebrow">WELCOME BACK</span>
        <h2 id="login-title">Sign in to FoodExpress</h2>
        <p className="login-card-description">Enter your details to continue to your account.</p>
        <form onSubmit={handleSubmit} className="login-form">
          {registrationMessage && (
            <p className="registration-message" role="status">
              {registrationMessage}
            </p>
          )}
          {error && <p className="error" role="alert">{error}</p>}
          <div className="form-group">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={authLoading || isSubmitting}>
            {isSubmitting ? 'Signing in…' : <>Sign in <span aria-hidden="true">→</span></>}
          </button>
          <p className="login-register-prompt">
            New to FoodExpress? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </section>
    </div>
  );
};

export default Login;
