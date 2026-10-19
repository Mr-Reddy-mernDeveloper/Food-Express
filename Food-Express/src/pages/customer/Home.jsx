import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import FoodTypeSymbol from '../../components/FoodTypeSymbol';
import { formatCurrency } from '../../utils/currency';
import './Home.css';

const Home = () => {
  const { availableRestaurants } = useAuth();
  const menuItems = availableRestaurants
    .flatMap((restaurant) =>
      (restaurant.menu || []).map((item) => ({ ...item, restaurant })),
    )
    .filter((item) => item.name?.trim());
  const uniqueItemsByName = new Map();
  menuItems.forEach((item) => {
    const key = item.name.trim().toLowerCase();
    const existingItem = uniqueItemsByName.get(key);
    if (!existingItem || item.price < existingItem.price) {
      uniqueItemsByName.set(key, item);
    }
  });
  const uniqueFoodItems = [...uniqueItemsByName.values()];
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/restaurants?search=${encodeURIComponent(query)}` : '/restaurants');
  };

  return (
    <main className="home">
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="home-eyebrow">GOOD FOOD, MADE EASY</span>
          <h1>Find your next<br />favourite meal.</h1>
          <p>Discover local restaurants and get the food you love delivered to your door.</p>
          <form className="home-search" role="search" onSubmit={handleSearch}>
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
            <button type="submit">Search</button>
          </form>
          <Link to="/restaurants" className="home-cta">Explore restaurants</Link>
        </div>
        <div className="home-hero-art" aria-hidden="true">
          <span className="home-hero-art-ring" />
          <span className="home-hero-art-label">Fresh choices.<br />Right around you.</span>
        </div>
      </section>
      <section className="home-food-section">
          <div className="home-section-heading">
            <div>
              <span className="home-eyebrow">A TASTE OF WHAT’S COOKING</span>
              <h2>Explore our menu</h2>
            </div>
            <Link to="/restaurants" className="home-section-link">
              Find restaurants <span aria-hidden="true">→</span>
            </Link>
          </div>
          {uniqueFoodItems.length > 0 ? (
            <div className="home-food-grid">
              {uniqueFoodItems.map((item) => (
                <Link
                  key={item.name.trim().toLowerCase()}
                  to={`/dishes/${encodeURIComponent(item.name.trim())}`}
                  className="home-food-card"
                >
                  <div className="home-food-image">
                    {item.image ? (
                      <img src={item.image} alt="" />
                    ) : (
                      <span aria-hidden="true">{item.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="home-food-content">
                    <div className="home-food-title">
                      <h3>{item.name}</h3>
                      {item.foodType && (
                        <span className="home-food-type">
                          <FoodTypeSymbol foodType={item.foodType} />
                          {item.foodType === 'veg' ? 'Veg' : item.foodType === 'egg' ? 'Egg' : 'Non-veg'}
                        </span>
                      )}
                    </div>
                    <p>From {item.restaurant.name}</p>
                    <strong>{formatCurrency(item.price)}</strong>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="home-food-empty">
              <h3>Fresh choices are on the way</h3>
              <p>Menu items will show up here as restaurants add them.</p>
            </div>
          )}
      </section>
    </main>
  );
};

export default Home;
