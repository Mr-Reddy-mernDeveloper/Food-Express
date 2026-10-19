import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import {
  getIndianPhoneDigits,
  isValidIndianPhone,
} from "../../utils/indianPhone";
import "./Profile.css";

const createAddress = (isDefault = false) => ({
  id: crypto.randomUUID(),
  label: "",
  address: "",
  isDefault,
});

const CustomerProfile = () => {
  const { user, updateCustomerProfile } = useAuth();
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(getIndianPhoneDigits(user.phone));
  const [addresses, setAddresses] = useState(
    (user.addresses || []).map((address) => ({
      id: address.id,
      label: address.label || "",
      address: address.address || "",
      isDefault: Boolean(address.isDefault),
    })),
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateAddress = (id, field, value) => {
    setAddresses((current) =>
      current.map((address) =>
        address.id === id ? { ...address, [field]: value } : address,
      ),
    );
  };

  const setDefaultAddress = (id) => {
    setAddresses((current) =>
      current.map((address) => ({ ...address, isDefault: address.id === id })),
    );
  };

  const removeAddress = (id) => {
    setAddresses((current) => {
      const remaining = current.filter((address) => address.id !== id);
      if (
        remaining.length > 0 &&
        current.some((address) => address.id === id && address.isDefault)
      ) {
        remaining[0] = { ...remaining[0], isDefault: true };
      }
      return remaining;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaved(false);
    if (!isValidIndianPhone(phone)) {
      setError("Phone number must contain exactly 10 digits after +91.");
      return;
    }
    if (
      addresses.length > 0 &&
      addresses.some(
        (address) => !address.label.trim() || !address.address.trim(),
      )
    ) {
      setError("Complete or remove each saved delivery address before saving.");
      return;
    }

    setIsSaving(true);
    try {
      await updateCustomerProfile({
        name,
        email,
        phone: `+91${getIndianPhoneDigits(phone)}`,
        addresses,
      });
      setSaved(true);
    } catch (profileError) {
      setError(profileError.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="customer-profile">
      <header className="profile-heading">
        <div>
          <span className="profile-eyebrow">YOUR ACCOUNT</span>
          <h1>Profile &amp; addresses</h1>
          <p>Keep your contact details and delivery addresses up to date.</p>
        </div>
        <Link to="/orders" className="profile-orders-link">
          View your orders <span aria-hidden="true">→</span>
        </Link>
      </header>

      <form className="profile-form" onSubmit={handleSubmit}>
        <section
          className="profile-section"
          aria-labelledby="profile-details-heading"
        >
          <div className="profile-section-heading">
            <span className="profile-section-icon" aria-hidden="true">
              01
            </span>
            <div>
              <h2 id="profile-details-heading">Personal details</h2>
              <p>Used for account updates and delivery contact.</p>
            </div>
          </div>
          <div className="profile-fields">
            <div className="form-group">
              <label htmlFor="profile-name">Full name</label>
              <input
                id="profile-name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="profile-email">Email address</label>
              <input
                id="profile-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="profile-phone">Phone number</label>
              <div className="indian-phone-input">
                <span aria-hidden="true">+91</span>
                <input
                  id="profile-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  pattern="[0-9]{10}"
                  minLength={10}
                  maxLength={10}
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      getIndianPhoneDigits(event.target.value).slice(0, 10),
                    )
                  }
                  required
                />
              </div>
              <small className="profile-hint">
                Please enter a valid 10-digit phone number.
              </small>
            </div>
          </div>
        </section>

        <section
          className="profile-section"
          aria-labelledby="profile-addresses-heading"
        >
          <div className="profile-section-heading">
            <span className="profile-section-icon" aria-hidden="true">
              02
            </span>
            <div>
              <h2 id="profile-addresses-heading">Delivery addresses</h2>
              <p>
                Save places you order to and choose one to prefill checkout.
              </p>
            </div>
          </div>
          {addresses.length === 0 ? (
            <p className="profile-empty-addresses">No saved addresses yet.</p>
          ) : (
            <div className="profile-address-list">
              {addresses.map((address, index) => (
                <article className="profile-address-card" key={address.id}>
                  <div className="profile-address-card-heading">
                    <div className="form-group">
                      <label htmlFor={`address-label-${address.id}`}>
                        Address label
                      </label>
                      <input
                        id={`address-label-${address.id}`}
                        value={address.label}
                        onChange={(event) =>
                          updateAddress(address.id, "label", event.target.value)
                        }
                        placeholder="Home, work, or another place"
                        maxLength={40}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      className="profile-remove-address"
                      onClick={() => removeAddress(address.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="form-group">
                    <label htmlFor={`address-value-${address.id}`}>
                      Full delivery address
                    </label>
                    <textarea
                      id={`address-value-${address.id}`}
                      value={address.address}
                      onChange={(event) =>
                        updateAddress(address.id, "address", event.target.value)
                      }
                      rows={3}
                      maxLength={500}
                      required
                    />
                  </div>
                  <label className="profile-default-choice">
                    <input
                      type="radio"
                      name="default-delivery-address"
                      checked={address.isDefault}
                      onChange={() => setDefaultAddress(address.id)}
                    />
                    <span>Use as default address</span>
                    {address.isDefault && <strong>DEFAULT</strong>}
                  </label>
                  <span className="sr-only">Saved address {index + 1}</span>
                </article>
              ))}
            </div>
          )}
          <button
            type="button"
            className="profile-add-address"
            disabled={addresses.length >= 10}
            onClick={() =>
              setAddresses((current) => [
                ...current,
                createAddress(current.length === 0),
              ])
            }
          >
            <span aria-hidden="true">+</span> Add another address
          </button>
          {addresses.length >= 10 && (
            <small className="profile-hint">
              You can save up to 10 addresses.
            </small>
          )}
        </section>

        {error && (
          <p className="profile-message is-error" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p className="profile-message is-success" role="status">
            Your profile has been saved.
          </p>
        )}
        <div className="profile-save-row">
          <button
            type="submit"
            className="profile-save-button"
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </main>
  );
};

export default CustomerProfile;
