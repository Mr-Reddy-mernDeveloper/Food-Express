import { useEffect, useMemo, useState } from "react";
import { useOrders } from "../../context/useOrders";
import { useAuth } from "../../context/useAuth";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/currency";
import OrderDetails from "../../components/orders/OrderDetails";
import OrderTimeline from "../../components/orders/OrderTimeline";
import FoodTypeSymbol from "../../components/FoodTypeSymbol";
import { formatTimestamp } from "../../utils/dateTime";
import { resizeImageForStorage } from "../../utils/imageUpload";
import {
  getIndianPhoneDigits,
  isValidIndianPhone,
} from "../../utils/indianPhone";
import "./Dashboard.css";

const MENU_FOOD_TYPES = [
  { value: "veg", label: "Veg" },
  { value: "egg", label: "Egg" },
  { value: "non-veg", label: "Non-veg" },
];

const CANCELLATION_REASONS = [
  "Item not available right now",
  "Unable to prepare the order",
  "Restaurant is temporarily closed",
  "Technical issues",
  "Other",
];

const RestaurantDashboard = () => {
  const { orders, updateOrder } = useOrders();
  const { user, updateRestaurant } = useAuth();
  const navigate = useNavigate();
  const [menuItemName, setMenuItemName] = useState("");
  const [menuItemPrice, setMenuItemPrice] = useState("");
  const [menuItemFoodType, setMenuItemFoodType] = useState("");
  const [menuItemImage, setMenuItemImage] = useState("");
  const [menuError, setMenuError] = useState("");
  const [menuImageError, setMenuImageError] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [cancellationOrderId, setCancellationOrderId] = useState("");
  const [cancellationReasonOption, setCancellationReasonOption] = useState("");
  const [customCancellationReason, setCustomCancellationReason] = useState("");
  const [cancellationError, setCancellationError] = useState("");
  const [activeTab, setActiveTab] = useState("orders");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.restaurant?.name || "");
  const [profileCuisine, setProfileCuisine] = useState(
    user?.restaurant?.cuisine || "",
  );
  const [profileAddress, setProfileAddress] = useState(
    user?.restaurant?.address || "",
  );
  const [profilePhone, setProfilePhone] = useState(
    getIndianPhoneDigits(user?.restaurant?.phone),
  );
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileImageError, setProfileImageError] = useState("");
  const restaurant = user?.restaurant;
  const restaurantId = restaurant?.id;
  const restaurantOrders = useMemo(
    () => orders.filter((order) => order.restaurantId === restaurantId),
    [orders, restaurantId],
  );
  const pendingOrderCount = restaurantOrders.filter(
    (order) => order.status === "pending",
  ).length;
  const activeOrderCount = restaurantOrders.filter(
    (order) => !["delivered", "rejected"].includes(order.status),
  ).length;

  const toggleOnline = async () => {
    if (restaurant) {
      try {
        await updateRestaurant(restaurant.id, { online: !restaurant.online });
      } catch (error) {
        setProfileError(error.message);
      }
    }
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    if (
      !profileName.trim() ||
      !profileCuisine.trim() ||
      !profileAddress.trim() ||
      !profilePhone.trim()
    ) {
      setProfileError("Complete each restaurant profile field before saving.");
      return;
    }
    if (!isValidIndianPhone(profilePhone)) {
      setProfileError(
        "Restaurant phone must contain exactly 10 digits after +91.",
      );
      return;
    }

    try {
      const updated = await updateRestaurant(restaurant.id, {
        name: profileName.trim(),
        cuisine: profileCuisine.trim(),
        address: profileAddress.trim(),
        phone: `+91${profilePhone}`,
      });
      if (!updated) {
        setProfileError("Your restaurant profile could not be updated.");
        return;
      }
      setProfileError("");
      setProfileMessage("Restaurant profile updated.");
      setIsEditingProfile(false);
    } catch {
      setProfileError(
        "Could not save your profile. Please try again or free up browser storage.",
      );
    }
  };

  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setProfileImageError("");
    setProfileMessage("");
    try {
      const profileImage = await resizeImageForStorage(file);
      const updated = await updateRestaurant(restaurant.id, { profileImage });
      if (!updated) {
        setProfileImageError(
          "Your restaurant profile image could not be saved.",
        );
        return;
      }
      setProfileMessage("Restaurant profile image updated.");
    } catch (error) {
      setProfileImageError(
        error instanceof Error
          ? error.message
          : "Could not update the profile image.",
      );
    }
  };

  const handleProfileImageRemove = async () => {
    setProfileImageError("");
    setProfileMessage("");
    try {
      const updated = await updateRestaurant(restaurant.id, {
        profileImage: "",
      });
      if (!updated) {
        setProfileImageError(
          "Your restaurant profile photo could not be removed.",
        );
        return;
      }
      setProfileMessage("Restaurant profile photo removed.");
    } catch {
      setProfileImageError(
        "Could not remove the profile photo. Please try again.",
      );
    }
  };

  const handleMenuImageChange = async (event, itemId) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setMenuImageError("");
    try {
      const image = await resizeImageForStorage(file);
      const updated = await updateRestaurant(restaurant.id, {
        menu: restaurant.menu.map((item) =>
          item.id === itemId ? { ...item, image } : item,
        ),
      });
      if (!updated) {
        setMenuImageError("The food image could not be saved.");
      }
    } catch (error) {
      setMenuImageError(
        error instanceof Error
          ? error.message
          : "Could not update the food image.",
      );
    }
  };

  const handleMenuImageRemove = async (itemId) => {
    setMenuImageError("");
    try {
      const updated = await updateRestaurant(restaurant.id, {
        menu: restaurant.menu.map((item) =>
          item.id === itemId ? { ...item, image: "" } : item,
        ),
      });
      if (!updated) {
        setMenuImageError("The food photo could not be removed.");
      }
    } catch {
      setMenuImageError("Could not remove the food photo. Please try again.");
    }
  };

  const handleMenuFoodTypeChange = async (itemId, foodType) => {
    setMenuImageError("");
    try {
      const updated = await updateRestaurant(restaurant.id, {
        menu: restaurant.menu.map((item) =>
          item.id === itemId ? { ...item, foodType } : item,
        ),
      });
      if (!updated) {
        setMenuImageError("The menu item food type could not be updated.");
      }
    } catch {
      setMenuImageError("Could not update the food type. Please try again.");
    }
  };

  const handleNewMenuImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setMenuImageError("");
    try {
      setMenuItemImage(await resizeImageForStorage(file));
    } catch (error) {
      setMenuImageError(
        error instanceof Error
          ? error.message
          : "Could not load the food image.",
      );
    }
  };

  const handleAddMenuItem = async (event) => {
    event.preventDefault();
    const price = Number(menuItemPrice);
    if (
      !menuItemName.trim() ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !menuItemFoodType
    ) {
      setMenuError(
        "Enter an item name, a valid price, and choose a food type.",
      );
      return;
    }
    try {
      const updated = await updateRestaurant(restaurant.id, {
        menu: [
          ...restaurant.menu,
          {
            id: `${restaurant.id}-item-${Date.now()}`,
            name: menuItemName.trim(),
            price,
            image: menuItemImage,
            foodType: menuItemFoodType,
          },
        ],
      });
      if (!updated) {
        setMenuError("The menu item could not be saved.");
        return;
      }
      setMenuItemName("");
      setMenuItemPrice("");
      setMenuItemFoodType("");
      setMenuItemImage("");
      setMenuError("");
      setMenuImageError("");
    } catch {
      setMenuError(
        "Could not save this menu item. Please try again with a smaller image or free up browser storage.",
      );
    }
  };

  const handleAccept = (orderId) => {
    updateOrder(orderId, { status: "accepted" });
  };
  const handleReject = async (event) => {
    event.preventDefault();
    const reason =
      cancellationReasonOption === "Other"
        ? customCancellationReason.trim()
        : cancellationReasonOption;
    if (!cancellationReasonOption || !reason) {
      setCancellationError(
        cancellationReasonOption === "Other"
          ? "Enter a custom cancellation reason before confirming."
          : "Select a cancellation reason before confirming.",
      );
      return;
    }
    const updatedOrder = await updateOrder(cancellationOrderId, {
      status: "rejected",
      cancellationReasonCategory: cancellationReasonOption,
      cancellationReason: reason,
    });
    if (!updatedOrder) {
      setCancellationError(
        "The order could not be cancelled. Please try again.",
      );
      return;
    }
    setCancellationOrderId("");
    setCancellationReasonOption("");
    setCustomCancellationReason("");
    setCancellationError("");
  };

  const openCancellationDialog = (orderId) => {
    setCancellationOrderId(orderId);
    setCancellationReasonOption("");
    setCustomCancellationReason("");
    setCancellationError("");
  };

  const closeCancellationDialog = () => {
    setCancellationOrderId("");
    setCancellationReasonOption("");
    setCustomCancellationReason("");
    setCancellationError("");
  };

  useEffect(() => {
    if (!cancellationOrderId) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setCancellationOrderId("");
        setCancellationReasonOption("");
        setCustomCancellationReason("");
        setCancellationError("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cancellationOrderId]);

  const handleReadyForPickup = (orderId) => {
    const order = restaurantOrders.find(
      (candidate) => candidate.id === orderId,
    );
    updateOrder(orderId, {
      readyForPickup: true,
      status: order?.deliveryPartner ? "delivery_assigned" : "ready_for_pickup",
    });
  };

  if (!restaurant) {
    return (
      <div className="restaurant-dashboard">
        <section className="restaurant-profile-missing">
          <span className="restaurant-dashboard-eyebrow">PARTNER ACCOUNT</span>
          <h1>Restaurant profile not found</h1>
          <p>This account is not linked to a restaurant profile.</p>
          <button type="button" onClick={() => navigate("/login")}>
            Return to login
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="restaurant-dashboard">
      <header className="restaurant-dashboard-header">
        <div>
          <span className="restaurant-dashboard-eyebrow">
            RESTAURANT PARTNER
          </span>
          <h1>Restaurant dashboard</h1>
          <p>
            Welcome back. Manage your menu and keep track of incoming orders.
          </p>
        </div>
        <div
          className={`restaurant-online-indicator${restaurant.online ? " is-online" : ""}`}
        >
          <span />
          {restaurant.online ? "Currently online" : "Currently offline"}
        </div>
      </header>

      <section className="restaurant-stats" aria-label="Restaurant overview">
        <article className="restaurant-stat-card">
          <span className="restaurant-stat-icon" aria-hidden="true">
            ↗
          </span>
          <div>
            <span>All orders</span>
            <strong>{restaurantOrders.length}</strong>
          </div>
        </article>
        <article className="restaurant-stat-card">
          <span className="restaurant-stat-icon is-warm" aria-hidden="true">
            ◷
          </span>
          <div>
            <span>Awaiting response</span>
            <strong>{pendingOrderCount}</strong>
          </div>
        </article>
        <article className="restaurant-stat-card">
          <span className="restaurant-stat-icon is-green" aria-hidden="true">
            ✓
          </span>
          <div>
            <span>Active orders</span>
            <strong>{activeOrderCount}</strong>
          </div>
        </article>
        <article className="restaurant-stat-card">
          <span className="restaurant-stat-icon is-purple" aria-hidden="true">
            ≡
          </span>
          <div>
            <span>Menu items</span>
            <strong>{restaurant.menu.length}</strong>
          </div>
        </article>
      </section>

      <nav className="restaurant-dashboard-tabs" aria-label="Restaurant dashboard sections">
        <button
          type="button"
          className={activeTab === "orders" ? "is-active" : ""}
          aria-pressed={activeTab === "orders"}
          onClick={() => setActiveTab("orders")}
        >
          Orders
          <span>{restaurantOrders.length}</span>
          {pendingOrderCount > 0 && (
            <span className="restaurant-tab-pending-count">
              {pendingOrderCount} new
            </span>
          )}
        </button>
        <button
          type="button"
          className={activeTab === "menu" ? "is-active" : ""}
          aria-pressed={activeTab === "menu"}
          onClick={() => setActiveTab("menu")}
        >
          Menu management
          <span>{restaurant.menu.length}</span>
        </button>
        <button
          type="button"
          className={activeTab === "profile" ? "is-active" : ""}
          aria-pressed={activeTab === "profile"}
          onClick={() => setActiveTab("profile")}
        >
          Restaurant profile
        </button>
      </nav>

      {activeTab === "profile" && (
      <section
        className="status-section"
        aria-label="Restaurant profile"
      >
        <div className="restaurant-profile-card">
          <div className="restaurant-profile-avatar-upload">
            <span className="restaurant-profile-avatar">
              {restaurant.profileImage ? (
                <img
                  src={restaurant.profileImage}
                  alt={`${restaurant.name} profile`}
                />
              ) : (
                restaurant.name.charAt(0).toUpperCase()
              )}
            </span>
            <div className="restaurant-profile-photo-actions">
              <label className="restaurant-profile-avatar-action">
                {restaurant.profileImage ? "Change photo" : "Add photo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  aria-label="Upload restaurant profile photo"
                  onChange={handleProfileImageChange}
                />
              </label>
              {restaurant.profileImage && (
                <button
                  type="button"
                  className="restaurant-profile-avatar-remove"
                  onClick={handleProfileImageRemove}
                  aria-label="Remove restaurant profile photo"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <div className="restaurant-profile-info">
            <span className="restaurant-dashboard-eyebrow">
              YOUR RESTAURANT
            </span>
            <h2>{restaurant.name}</h2>
            <p>{restaurant.cuisine || "Cuisine not set"}</p>
            <div className="restaurant-profile-meta">
              <span>{restaurant.address}</span>
              <span>{restaurant.phone}</span>
            </div>
          </div>
          <div className="restaurant-profile-actions">
            <button
              className="restaurant-edit-profile-button"
              type="button"
              onClick={() => {
                setProfileName(restaurant.name || "");
                setProfileCuisine(restaurant.cuisine || "");
                setProfileAddress(restaurant.address || "");
                setProfilePhone(getIndianPhoneDigits(restaurant.phone));
                setProfileMessage("");
                setProfileError("");
                setIsEditingProfile((editing) => !editing);
              }}
              aria-expanded={isEditingProfile}
            >
              {isEditingProfile ? "Cancel editing" : "Edit profile"}
            </button>
            <button
              className={`restaurant-toggle-button${restaurant.online ? " is-online" : ""}`}
              type="button"
              onClick={toggleOnline}
              aria-pressed={restaurant.online}
            >
              {restaurant.online
                ? "Set restaurant offline"
                : "Set restaurant online"}
            </button>
          </div>
        </div>
        {(profileError || profileImageError || profileMessage) && (
          <p
            className={`restaurant-profile-feedback${profileError || profileImageError ? " is-error" : ""}`}
            role={profileError || profileImageError ? "alert" : "status"}
          >
            {profileError || profileImageError || profileMessage}
          </p>
        )}
        {isEditingProfile && (
          <form
            className="restaurant-profile-edit-form"
            onSubmit={handleProfileSave}
          >
            <div className="restaurant-profile-edit-heading">
              <div>
                <h3>Edit restaurant profile</h3>
                <p>Keep your restaurant details up to date for customers.</p>
              </div>
            </div>
            <div className="restaurant-profile-edit-fields">
              <div>
                <label htmlFor="profile-restaurant-name">Restaurant name</label>
                <input
                  id="profile-restaurant-name"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  maxLength={80}
                  required
                />
              </div>
              <div>
                <label htmlFor="profile-restaurant-cuisine">Cuisine</label>
                <input
                  id="profile-restaurant-cuisine"
                  value={profileCuisine}
                  onChange={(event) => setProfileCuisine(event.target.value)}
                  maxLength={60}
                  required
                />
              </div>
              <div>
                <label htmlFor="profile-restaurant-address">
                  Restaurant address
                </label>
                <input
                  id="profile-restaurant-address"
                  value={profileAddress}
                  onChange={(event) => setProfileAddress(event.target.value)}
                  maxLength={160}
                  required
                />
              </div>
              <div>
                <label htmlFor="profile-restaurant-phone">
                  Restaurant phone
                </label>
                <div className="indian-phone-input">
                  <span aria-hidden="true">+91</span>
                  <input
                    id="profile-restaurant-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    pattern="[0-9]{10}"
                    minLength={10}
                    maxLength={10}
                    aria-describedby="profile-restaurant-phone-hint"
                    value={profilePhone}
                    onChange={(event) =>
                      setProfilePhone(
                        getIndianPhoneDigits(event.target.value).slice(0, 10),
                      )
                    }
                    required
                  />
                </div>
                <small
                  id="profile-restaurant-phone-hint"
                  className="phone-number-hint"
                >
                  Please enter a valid 10-digit phone number.
                </small>
              </div>
            </div>
            {profileError && (
              <p className="error" role="alert">
                {profileError}
              </p>
            )}
            <button className="restaurant-profile-save-button" type="submit">
              Save profile
            </button>
          </form>
        )}
      </section>
      )}

      {activeTab === "menu" && (
      <section className="menu-section" aria-label="Menu management">
        <div className="restaurant-section-heading">
          <div>
            <span className="restaurant-dashboard-eyebrow">KEEP IT FRESH</span>
            <h2>Menu management</h2>
          </div>
          <span className="restaurant-section-count">
            {restaurant.menu.length}{" "}
            {restaurant.menu.length === 1 ? "item" : "items"}
          </span>
        </div>
        <div className="restaurant-menu-layout">
          <div className="restaurant-menu-card">
            <h3>Your menu</h3>
            {restaurant.menu.length === 0 ? (
              <div className="restaurant-menu-empty">
                <span aria-hidden="true">＋</span>
                <p>Your menu is waiting for its first dish.</p>
                <small>
                  Add an item using the form to let customers start ordering.
                </small>
              </div>
            ) : (
              <>
                <label className="restaurant-menu-search">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="10.8" cy="10.8" r="6.8" />
                    <path d="m16 16 4.5 4.5" />
                  </svg>
                  <input
                    type="search"
                    aria-label="Search menu items"
                    placeholder="Search your menu"
                    value={menuSearch}
                    onChange={(event) => setMenuSearch(event.target.value)}
                  />
                </label>
                <div className="restaurant-menu-category-grid">
                  {MENU_FOOD_TYPES.map(({ value, label }) => {
                    const normalizedSearch = menuSearch.trim().toLowerCase();
                    const categoryItems = restaurant.menu.filter((item) => {
                      const itemType = item.foodType || "non-veg";
                      return (
                        itemType === value &&
                        item.name.toLowerCase().includes(normalizedSearch)
                      );
                    });

                    return (
                      <section
                        className={`restaurant-menu-category is-${value}`}
                        key={value}
                      >
                        <div className="restaurant-menu-category-heading">
                          <h4>
                            <FoodTypeSymbol foodType={value} />
                            {label}
                          </h4>
                          <span>{categoryItems.length}</span>
                        </div>
                        <div className="restaurant-menu-category-scroll">
                          {categoryItems.length === 0 ? (
                            <p className="restaurant-menu-category-empty">
                              {menuSearch.trim()
                                ? "No matching items"
                                : `No ${label.toLowerCase()} items yet`}
                            </p>
                          ) : (
                            <ul className="restaurant-menu-list">
                              {categoryItems.map((item) => (
                                <li key={item.id}>
                                  <span className="restaurant-menu-item-photo">
                                    {item.image ? (
                                      <img src={item.image} alt="" />
                                    ) : (
                                      <span aria-hidden="true">
                                        {item.name.charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                  </span>
                                  <span className="restaurant-menu-item-name">
                                    {item.name}
                                  </span>
                                  <strong>{formatCurrency(item.price)}</strong>
                                  <div
                                    className="restaurant-food-type-options"
                                    role="group"
                                    aria-label={`Food type for ${item.name}`}
                                  >
                                    {MENU_FOOD_TYPES.map((foodType) => (
                                      <button
                                        key={foodType.value}
                                        type="button"
                                        className={`restaurant-food-type-option${(item.foodType || "non-veg") === foodType.value ? " is-selected" : ""}`}
                                        aria-label={`${foodType.label} food`}
                                        aria-pressed={
                                          (item.foodType || "non-veg") ===
                                          foodType.value
                                        }
                                        title={foodType.label}
                                        onClick={() =>
                                          handleMenuFoodTypeChange(
                                            item.id,
                                            foodType.value,
                                          )
                                        }
                                      >
                                        <FoodTypeSymbol
                                          foodType={foodType.value}
                                        />
                                        <span>{foodType.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                  <div className="restaurant-menu-photo-actions">
                                    <label className="restaurant-menu-photo-button">
                                      {item.image
                                        ? "Change photo"
                                        : "Add photo"}
                                      <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        aria-label={`${item.image ? "Change" : "Add"} photo for ${item.name}`}
                                        onChange={(event) =>
                                          handleMenuImageChange(event, item.id)
                                        }
                                      />
                                    </label>
                                    {item.image && (
                                      <button
                                        type="button"
                                        className="restaurant-menu-photo-remove"
                                        onClick={() =>
                                          handleMenuImageRemove(item.id)
                                        }
                                        aria-label={`Remove photo for ${item.name}`}
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </>
            )}
            {menuImageError && (
              <p className="error restaurant-menu-image-error" role="alert">
                {menuImageError}
              </p>
            )}
          </div>
          <div className="restaurant-add-menu-card">
            <h3>Add a menu item</h3>
            <p>Share another customer favourite.</p>
            <form className="menu-form" onSubmit={handleAddMenuItem}>
              <label htmlFor="menu-item-name">Item name</label>
              <input
                id="menu-item-name"
                placeholder="e.g. Garden veggie bowl"
                value={menuItemName}
                onChange={(event) => setMenuItemName(event.target.value)}
                required
              />
              <label htmlFor="menu-item-price">Price</label>
              <div className="restaurant-price-input">
                <span>₹</span>
                <input
                  id="menu-item-price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={menuItemPrice}
                  onChange={(event) => setMenuItemPrice(event.target.value)}
                  required
                />
              </div>
              <span className="menu-form-field-label">Food type</span>
              <div
                className="restaurant-food-type-options"
                role="group"
                aria-label="Choose the food type"
              >
                {MENU_FOOD_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`restaurant-food-type-option${menuItemFoodType === value ? " is-selected" : ""}`}
                    aria-pressed={menuItemFoodType === value}
                    onClick={() => setMenuItemFoodType(value)}
                  >
                    <FoodTypeSymbol foodType={value} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <label htmlFor="menu-item-image">
                Food photo <span>(optional)</span>
              </label>
              <label
                className="restaurant-menu-upload"
                htmlFor="menu-item-image"
              >
                {menuItemImage ? (
                  <span className="restaurant-menu-upload-preview">
                    <img src={menuItemImage} alt="Selected food item preview" />
                    <span>Photo selected — click to change</span>
                  </span>
                ) : (
                  <span className="restaurant-menu-upload-placeholder">
                    <span aria-hidden="true">＋</span>
                    <span>Choose a food photo</span>
                    <small>JPG, PNG, WebP or GIF · up to 8 MB</small>
                  </span>
                )}
                <input
                  id="menu-item-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleNewMenuImageChange}
                />
              </label>
              {menuItemImage && (
                <button
                  className="restaurant-new-menu-photo-remove"
                  type="button"
                  onClick={() => setMenuItemImage("")}
                >
                  Remove selected photo
                </button>
              )}
              {menuImageError && (
                <p className="error" role="alert">
                  {menuImageError}
                </p>
              )}
              {menuError && (
                <p className="error" role="alert">
                  {menuError}
                </p>
              )}
              <button type="submit">
                Add to menu <span aria-hidden="true">→</span>
              </button>
            </form>
          </div>
        </div>
      </section>
      )}

      {activeTab === "orders" && (
      <section className="orders-section" aria-label="Incoming orders">
        <div className="orders-heading">
          <div>
            <span className="restaurant-dashboard-eyebrow">
              SERVICE AT A GLANCE
            </span>
            <h2>Incoming orders</h2>
            <p>Review requests and keep customers updated.</p>
          </div>
          <span className="restaurant-section-count">
            {restaurantOrders.length}{" "}
            {restaurantOrders.length === 1 ? "order" : "orders"}
          </span>
        </div>
        {restaurantOrders.length === 0 && (
          <div className="restaurant-orders-empty">
            <span className="restaurant-orders-empty-icon" aria-hidden="true">
              ⌁
            </span>
            <div>
              <h3>All caught up</h3>
              <p>
                New customer orders will appear here as soon as they come in.
              </p>
            </div>
          </div>
        )}
        {[...restaurantOrders].reverse().map((o) => (
          <div key={o.id} className="order-card">
            <div className="restaurant-order-card-heading">
              <div>
                <span className="restaurant-order-id">ORDER {o.id}</span>
                <h3>{o.customer?.name || "Customer"}</h3>
              </div>
              <span className={`restaurant-order-status status-${o.status}`}>
                {o.status === "in_transit"
                  ? "Awaiting pickup"
                  : o.status === "ready_for_pickup"
                    ? "Ready for pickup"
                    : o.status === "delivery_assigned"
                      ? "Partner assigned"
                      : o.status === "picked_up"
                        ? "Out for delivery"
                        : o.status.replaceAll("_", " ")}
              </span>
            </div>
            <OrderDetails>
              {o.createdAt && (
                <p>
                  <strong>Order placed:</strong>{" "}
                  <time dateTime={o.createdAt}>
                    {formatTimestamp(o.createdAt)}
                  </time>
                </p>
              )}
              <p>
                <strong>Customer contact:</strong>{" "}
                {o.customer?.phone || "Not provided"}
              </p>
              <p>
                <strong>Delivery address:</strong>{" "}
                {o.customer?.address || "Not provided"}
              </p>
              <p>
                <strong>Items:</strong>
              </p>
              <ul>
                {o.items.map((i) => (
                  <li key={i.id}>
                    {i.name} × {i.quantity} —{" "}
                    {formatCurrency(i.price * i.quantity)}
                  </li>
                ))}
              </ul>
              {o.specialInstructions && (
                <p>
                  <strong>Special Instructions:</strong> {o.specialInstructions}
                </p>
              )}
              {o.cancellationReason && (
                <p className="restaurant-cancellation-reason">
                  <strong>Cancellation reason:</strong> {o.cancellationReason}
                </p>
              )}
              <p>
                <strong>Order Total:</strong> {formatCurrency(o.total)}
              </p>
              <OrderTimeline order={o} />
              {o.deliveryPartner && (
                <div className="delivery-partner-contact">
                  <p>
                    <strong>Delivery partner:</strong> {o.deliveryPartner.name}
                  </p>
                  <p>
                    <strong>Contact number:</strong>{" "}
                    {o.deliveryPartner.phone || "Not provided"}
                  </p>
                </div>
              )}
            </OrderDetails>
            {["accepted", "delivery_assigned"].includes(o.status) &&
              !o.readyForPickup && (
                <div className="actions">
                  <button onClick={() => handleReadyForPickup(o.id)}>
                    Mark prepared and ready for pickup
                  </button>
                </div>
              )}
            {o.status === "pending" && (
              <div className="actions">
                <button onClick={() => handleAccept(o.id)}>Accept</button>
                <button
                  type="button"
                  onClick={() => openCancellationDialog(o.id)}
                >
                  Cancel order
                </button>
              </div>
            )}
          </div>
        ))}
      </section>
      )}
      {cancellationOrderId && (
        <div
          className="restaurant-cancellation-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCancellationDialog();
          }}
        >
          <section
            className="restaurant-cancellation-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="restaurant-cancellation-title"
          >
            <div className="restaurant-cancellation-heading">
              <span className="restaurant-dashboard-eyebrow">
                ORDER CANCELLATION
              </span>
              <h2 id="restaurant-cancellation-title">
                Why are you cancelling?
              </h2>
              <p>Choose a reason so the customer understands what happened.</p>
            </div>
            <form onSubmit={handleReject}>
              <label htmlFor="restaurant-cancellation-reason">
                Cancellation reason
              </label>
              <select
                id="restaurant-cancellation-reason"
                autoFocus
                value={cancellationReasonOption}
                onChange={(event) => {
                  setCancellationReasonOption(event.target.value);
                  setCancellationError("");
                }}
                required
              >
                <option value="">Select a reason</option>
                {CANCELLATION_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              {cancellationReasonOption === "Other" && (
                <>
                  <label htmlFor="restaurant-cancellation-custom-reason">
                    Tell us the reason
                  </label>
                  <textarea
                    id="restaurant-cancellation-custom-reason"
                    value={customCancellationReason}
                    onChange={(event) => {
                      setCustomCancellationReason(event.target.value);
                      setCancellationError("");
                    }}
                    maxLength={500}
                    placeholder="Enter the cancellation reason"
                    required
                  />
                </>
              )}
              {cancellationError && (
                <p className="restaurant-cancellation-error" role="alert">
                  {cancellationError}
                </p>
              )}
              <div className="restaurant-cancellation-actions">
                <button
                  type="button"
                  className="restaurant-cancellation-keep"
                  onClick={closeCancellationDialog}
                >
                  Keep order
                </button>
                <button
                  type="submit"
                  className="restaurant-cancellation-confirm"
                >
                  Confirm cancellation
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default RestaurantDashboard;
