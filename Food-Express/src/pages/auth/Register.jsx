import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import {
  getIndianPhoneDigits,
  isValidIndianPhone,
} from "../../utils/indianPhone";
import "./Login.css";

const Register = () => {
  const navigate = useNavigate();
  const { register, authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("customer");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantCuisine, setRestaurantCuisine] = useState("");
  const [restaurantAddress, setRestaurantAddress] = useState("");
  const [restaurantPhone, setRestaurantPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (role === "restaurant_partner" && !isValidIndianPhone(restaurantPhone)) {
      setError("Restaurant phone must contain exactly 10 digits after +91.");
      return;
    }
    if (role === "delivery_partner" && !isValidIndianPhone(deliveryPhone)) {
      setError(
        "Delivery contact number must contain exactly 10 digits after +91.",
      );
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const restaurantDetails =
      role === "restaurant_partner"
        ? {
            name: restaurantName,
            cuisine: restaurantCuisine,
            address: restaurantAddress,
            phone: `+91${getIndianPhoneDigits(restaurantPhone)}`,
          }
        : undefined;
    setIsSubmitting(true);
    try {
      await register({
        name,
        email,
        password,
        phone:
          role === "delivery_partner"
            ? `+91${getIndianPhoneDigits(deliveryPhone)}`
            : undefined,
        role,
        restaurantDetails,
      });
      navigate("/login", {
        state: {
          registrationMessage:
            "Account created. Log in using your email and password.",
          email: email.trim().toLowerCase(),
        },
      });
    } catch (registrationError) {
      setError(registrationError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page register-page">
      <h2>Create an account</h2>
      <form onSubmit={handleSubmit} className="login-form">
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-group">
          <label htmlFor="register-name">Name</label>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="register-role">I want to register as</label>
          <select
            id="register-role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            required
          >
            <option value="customer">Customer</option>
            <option value="restaurant_partner">Restaurant Partner</option>
            <option value="delivery_partner">Delivery Partner</option>
          </select>
        </div>
        {role === "delivery_partner" && (
          <div className="form-group">
            <label htmlFor="delivery-phone">Delivery contact number</label>
            <div className="indian-phone-input">
              <span aria-hidden="true">+91</span>
              <input
                id="delivery-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                pattern="[0-9]{10}"
                minLength={10}
                maxLength={10}
                aria-describedby="delivery-phone-hint"
                value={deliveryPhone}
                onChange={(event) =>
                  setDeliveryPhone(
                    getIndianPhoneDigits(event.target.value).slice(0, 10),
                  )
                }
                required
              />
            </div>
            <small id="delivery-phone-hint" className="phone-number-hint">
              Enter a valid 10-digit phone number for delivery contact.
            </small>
          </div>
        )}
        {role === "restaurant_partner" && (
          <fieldset className="restaurant-registration-fields">
            <legend>Restaurant details</legend>
            <div className="form-group">
              <label htmlFor="restaurant-name">Restaurant name</label>
              <input
                id="restaurant-name"
                value={restaurantName}
                onChange={(event) => setRestaurantName(event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="restaurant-cuisine">Cuisine type</label>
              <input
                id="restaurant-cuisine"
                value={restaurantCuisine}
                onChange={(event) => setRestaurantCuisine(event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="restaurant-address">Restaurant address</label>
              <input
                id="restaurant-address"
                value={restaurantAddress}
                onChange={(event) => setRestaurantAddress(event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="restaurant-phone">Restaurant phone</label>
              <div className="indian-phone-input">
                <span aria-hidden="true">+91</span>
                <input
                  id="restaurant-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  pattern="[0-9]{10}"
                  minLength={10}
                  maxLength={10}
                  aria-describedby="restaurant-phone-hint"
                  value={restaurantPhone}
                  onChange={(event) =>
                    setRestaurantPhone(
                      getIndianPhoneDigits(event.target.value).slice(0, 10),
                    )
                  }
                  required
                />
              </div>
              <small id="restaurant-phone-hint" className="phone-number-hint">
                Please enter a valid 10-digit phone number.
              </small>
            </div>
          </fieldset>
        )}
        <div className="form-group">
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirm-password">Confirm password</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={authLoading || isSubmitting}>
          {isSubmitting ? "Creating account…" : "Register"}
        </button>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
