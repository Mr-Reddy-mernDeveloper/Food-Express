import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCart } from '../../context/useCart';
import { useAuth } from '../../context/useAuth';
import FoodTypeSymbol from '../../components/FoodTypeSymbol';
import { formatCurrency } from '../../utils/currency';
import './DishSearchResults.css';

const DishSearchResults = () => {
  const { dishName = '' } = useParams();
  const { availableRestaurants } = useAuth();
  const { addItem } = useCart();
  const [addedItemId, setAddedItemId] = useState('');
  const [cartMessage, setCartMessage] = useState('');
  const normalizedDishName = dishName.trim().toLowerCase();
  const results = availableRestaurants.flatMap((restaurant) =>
    (restaurant.menu || [])
      .filter((item) => item.name?.trim().toLowerCase() === normalizedDishName)
      .map((item) => ({ ...item, restaurant })),
  ).sort((first, second) => first.price - second.price);

  useEffect(() => {
    if (!addedItemId) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setAddedItemId(''), 1800);
    return () => window.clearTimeout(timeout);
  }, [addedItemId]);

  const handleAddToCart = (item) => {
    const { restaurant, ...menuItem } = item;
    const wasAdded = addItem(restaurant.id, {
      ...menuItem,
      restaurantName: restaurant.name,
    });
    if (wasAdded) {
      setCartMessage(`${item.name} added from ${restaurant.name}.`);
      setAddedItemId(`${restaurant.id}-${item.id}`);
    }
  };

  return (
    <main className="dish-search-results">
      <Link
        to={`/restaurants?search=${encodeURIComponent(dishName)}`}
        className="dish-search-back-link"
      >
        <span aria-hidden="true">←</span> Back to search
      </Link>
      <header className="dish-search-heading">
        <span className="restaurant-list-eyebrow">AVAILABLE NEAR YOU</span>
        <h1>{dishName}</h1>
        <p>
          Compare this dish at {results.length} {results.length === 1 ? 'restaurant' : 'restaurants'}.
          Prices are shown from lowest to highest.
        </p>
      </header>
      {cartMessage && (
        <p className="dish-search-cart-message" role="status" aria-live="polite">
          {cartMessage}
        </p>
      )}

      {results.length > 0 ? (
        <div className="dish-search-result-grid">
          {results.map((item) => (
            <article className="dish-search-result-card" key={`${item.restaurant.id}-${item.id}`}>
              <div className="dish-search-result-image">
                {item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  <span aria-hidden="true">{item.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="dish-search-result-content">
                <div className="dish-search-result-title">
                  <h2>{item.name}</h2>
                  {item.foodType && (
                    <span className="restaurant-dish-food-type">
                      <FoodTypeSymbol foodType={item.foodType} />
                      {item.foodType === 'veg' ? 'Veg' : item.foodType === 'egg' ? 'Egg' : 'Non-veg'}
                    </span>
                  )}
                </div>
                <p className="dish-search-restaurant-name">{item.restaurant.name}</p>
                <p className="dish-search-cuisine">{item.restaurant.cuisine || 'Local favourite'}</p>
                <div className="dish-search-result-footer">
                  <strong>{formatCurrency(item.price)}</strong>
                  <Link to={`/restaurants/${item.restaurant.id}`}>View restaurant <span aria-hidden="true">→</span></Link>
                </div>
                <button
                  type="button"
                  className="dish-search-add-button"
                  onClick={() => handleAddToCart(item)}
                >
                  {addedItemId === `${item.restaurant.id}-${item.id}` ? 'Added to cart ✓' : 'Add to Cart'}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="dish-search-empty" aria-live="polite">
          <h2>This dish is no longer available</h2>
          <p>Search again to find other restaurants and menu items.</p>
          <Link to={`/restaurants?search=${encodeURIComponent(dishName)}`} className="restaurant-reset-button">
            Back to search
          </Link>
        </section>
      )}
    </main>
  );
};

export default DishSearchResults;
