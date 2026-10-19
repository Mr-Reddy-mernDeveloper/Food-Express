import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useCart } from '../../context/useCart';
import FoodTypeSymbol from '../../components/FoodTypeSymbol';
import { formatCurrency } from '../../utils/currency';
import './RestaurantList.css';

const RestaurantList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCart();
  const [addedItemId, setAddedItemId] = useState('');
  const search = searchParams.get('search') || '';
  const { availableRestaurants } = useAuth();
  const normalizedSearch = search.trim().toLowerCase();
  const setSearch = (value) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (value) {
      nextSearchParams.set('search', value);
    } else {
      nextSearchParams.delete('search');
    }
    setSearchParams(nextSearchParams, { replace: true });
  };
  const matchingMenuItems = normalizedSearch
    ? availableRestaurants.flatMap((restaurant) =>
        (restaurant.menu || [])
          .filter((item) => item.name?.toLowerCase().includes(normalizedSearch))
          .map((item) => ({ ...item, restaurant })),
      )
    : [];
  const matchingRestaurants = availableRestaurants.filter((restaurant) =>
    [restaurant.name, restaurant.cuisine]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedSearch)),
  );

  useEffect(() => {
    if (!addedItemId) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setAddedItemId(''), 1800);
    return () => window.clearTimeout(timeout);
  }, [addedItemId]);

  const handleAddToCart = (item) => {
    const { restaurant, ...menuItem } = item;
    if (addItem(restaurant.id, { ...menuItem, restaurantName: restaurant.name })) {
      setAddedItemId(`${restaurant.id}-${item.id}`);
    }
  };

  return (
    <main className="restaurant-list">
      <section className="restaurant-list-hero">
        <div>
          <span className="restaurant-list-eyebrow">A GOOD MEAL IS CLOSER THAN YOU THINK</span>
          <h1>Restaurants</h1>
          <p>Find a new favourite and let the good food come to you.</p>
        </div>
        <label className="restaurant-search">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            type="search"
            aria-label="Search restaurants by name, cuisine, or menu item"
            placeholder="Search restaurant, cuisine, or dish"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear restaurant search"
            >
              Clear
            </button>
          )}
        </label>
      </section>

      {matchingMenuItems.length > 0 ? (
        <>
          <div className="restaurant-results-heading">
            <h2>Matching food items</h2>
            <span>{matchingMenuItems.length} {matchingMenuItems.length === 1 ? 'item' : 'items'}</span>
          </div>
          <div className="restaurant-search-food-grid">
            {matchingMenuItems.map((item) => (
              <article
                key={`${item.restaurant.id}-${item.id}`}
                className="restaurant-search-food-card"
              >
                <div className="restaurant-search-food-image">
                  {item.image ? (
                    <img src={item.image} alt="" />
                  ) : (
                    <span aria-hidden="true">{item.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="restaurant-search-food-content">
                  <div className="restaurant-search-food-title">
                    <h3>
                      <Link to={`/dishes/${encodeURIComponent(item.name.trim())}`}>
                        {item.name}
                      </Link>
                    </h3>
                    {item.foodType && (
                      <span className="restaurant-search-food-type">
                        <FoodTypeSymbol foodType={item.foodType} />
                        {item.foodType === 'veg' ? 'Veg' : item.foodType === 'egg' ? 'Egg' : 'Non-veg'}
                      </span>
                    )}
                  </div>
                  <p>{item.restaurant.name}</p>
                  <strong>{formatCurrency(item.price)}</strong>
                  <button
                    type="button"
                    className="restaurant-search-add-button"
                    onClick={() => handleAddToCart(item)}
                  >
                    {addedItemId === `${item.restaurant.id}-${item.id}` ? 'Added to cart ✓' : 'Add to Cart'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : matchingRestaurants.length > 0 ? (
        <>
          <div className="restaurant-results-heading">
            <h2>{normalizedSearch ? 'Matching restaurants' : 'Explore all restaurants'}</h2>
            <span>{matchingRestaurants.length} {matchingRestaurants.length === 1 ? 'place' : 'places'}</span>
          </div>
          <div className="restaurant-list-grid">
            {matchingRestaurants.map((restaurant) => (
              <Link key={restaurant.id} to={`/restaurants/${restaurant.id}`} className="restaurant-list-card">
                <div className="restaurant-list-card-image">
                  {restaurant.image && <img src={restaurant.image} alt="" />}
                  <span className="restaurant-list-rating">
                    ★ {restaurant.rating || 'New'}
                  </span>
                </div>
                <div className="restaurant-list-card-content">
                  <div className="restaurant-list-card-title">
                    <span className="restaurant-list-card-logo">
                      {restaurant.profileImage ? (
                        <img src={restaurant.profileImage} alt="" />
                      ) : (
                        restaurant.name.charAt(0).toUpperCase()
                      )}
                    </span>
                    <h3>{restaurant.name}</h3>
                    <span aria-hidden="true">↗</span>
                  </div>
                  <p>{restaurant.cuisine || 'Local favourite'}</p>
                  {restaurant.menu?.length > 0 && (
                    <ul className="restaurant-menu-preview">
                      {restaurant.menu.slice(0, 3).map((item) => (
                        <li key={item.id}>
                          <span>{item.name}</span>
                          <span>{formatCurrency(item.price)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : normalizedSearch ? (
        <section className="restaurant-no-results" aria-live="polite">
          <div className="restaurant-empty-art" aria-hidden="true">
            <span className="restaurant-empty-plate" />
            <span className="restaurant-empty-spark restaurant-empty-spark-one">✦</span>
            <span className="restaurant-empty-spark restaurant-empty-spark-two">✧</span>
          </div>
          <span className="restaurant-list-eyebrow">NOT ON THE MENU (YET)</span>
          <h2>No matches for “{search.trim()}”</h2>
          <p>Try another restaurant, cuisine, or dish. A quick reset will bring all available places back.</p>
          <button type="button" className="restaurant-reset-button" onClick={() => setSearch('')}>
            <span aria-hidden="true">↺</span> Show all restaurants
          </button>
        </section>
      ) : (
        <section className="restaurant-no-results restaurant-no-partners" aria-live="polite">
          <div className="restaurant-empty-art" aria-hidden="true">
            <span className="restaurant-empty-plate" />
            <span className="restaurant-empty-spark restaurant-empty-spark-one">✦</span>
            <span className="restaurant-empty-spark restaurant-empty-spark-two">✧</span>
          </div>
          <span className="restaurant-list-eyebrow">WE’RE SETTING THE TABLE</span>
          <h2>Good things are cooking.</h2>
          <p>There aren’t any restaurants listed just yet. Come back soon, or help bring the first local favourite to FoodExpress.</p>
          <div className="restaurant-empty-actions">
            <Link to="/" className="restaurant-reset-button">Explore FoodExpress</Link>
            <Link to="/register" className="restaurant-empty-secondary">Join as a restaurant partner <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      )}
    </main>
  );
};

export default RestaurantList;
