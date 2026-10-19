import './FoodTypeSymbol.css';

const FoodTypeSymbol = ({ foodType }) => (
  <span className={`food-type-symbol is-${foodType}`} aria-hidden="true">
    <span />
  </span>
);

export default FoodTypeSymbol;
