import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "../../context/useCart";
import { useAuth } from "../../context/useAuth";
import { formatCurrency } from "../../utils/currency";
import FoodTypeSymbol from "../../components/FoodTypeSymbol";
import "./RestaurantDetail.css";

const RestaurantDetail = () => {
  const { id } = useParams();
  const { availableRestaurants } = useAuth();
  const restaurant = availableRestaurants.find((r) => r.id === id);
  const { addItem } = useCart();
  const [addedItemId, setAddedItemId] = useState(null);
  const [cartFeedback, setCartFeedback] = useState("");

  useEffect(() => {
    if (!addedItemId) return undefined;
    const timeout = window.setTimeout(() => setAddedItemId(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [addedItemId]);

  if (!restaurant) {
    return <p>Restaurant not found.</p>;
  }

  const handleAdd = (item) => {
    const wasAdded = addItem(restaurant.id, { ...item, restaurantName: restaurant.name });
    if (!wasAdded) return;
    setAddedItemId(item.id);
    setCartFeedback(`${item.name} added to your cart.`);
  };

  return (
    <div className="restaurant-detail">
      <Link to="/restaurants" className="back-link">
        ← Back to list
      </Link>
      {restaurant.profileImage && (
        <img
          src={restaurant.profileImage}
          alt={`${restaurant.name} profile`}
          className="restaurant-profile-image"
        />
      )}
      <h1>{restaurant.name}</h1>
      <p>
        {restaurant.cuisine} • Rating: {restaurant.rating} •{" "}
        {restaurant.priceRange}
      </p>
      <img
        src={restaurant.image}
        alt={restaurant.name}
        className="restaurant-image"
      />
      <h2>Menu</h2>
      <p className="restaurant-cart-feedback" role="status" aria-live="polite">
        {cartFeedback}
      </p>
      {restaurant.menu.length === 0 ? (
          <p>This restaurant has not added any menu items yet.</p>
      ) : (
          <div className="menu-grid">
            {restaurant.menu.map((item) => (
              <div key={item.id} className="menu-item">
                <img src={item.image} alt={item.name} />
                <div className="menu-item-heading">
                  <h3>{item.name}</h3>
                  {item.foodType && (
                    <span className="food-type-badge">
                      <FoodTypeSymbol foodType={item.foodType} />
                      <span>{item.foodType === "veg" ? "Veg" : item.foodType === "egg" ? "Egg" : "Non-veg"}</span>
                    </span>
                  )}
                </div>
                <p>{formatCurrency(item.price)}</p>
                <button type="button" onClick={() => handleAdd(item)}>
                  {addedItemId === item.id ? "Added to cart ✓" : "Add to Cart"}
                </button>
              </div>
            ))}
          </div>
      )}
    </div>
  );
};

export default RestaurantDetail;
