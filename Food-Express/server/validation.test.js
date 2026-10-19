import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidIndianPhone,
  normalizeEmail,
  validateCustomerProfile,
  validateOrderRequest,
  validateRegistration,
  validateRestaurantUpdates,
} from "./validation.js";

test("normalizes email addresses for case-insensitive account lookup", () => {
  assert.equal(normalizeEmail(" Person@Example.COM "), "person@example.com");
});

test("validates Indian phone numbers with exactly ten local digits", () => {
  assert.equal(isValidIndianPhone("+919876543210"), true);
  assert.equal(isValidIndianPhone("919876543210"), true);
  assert.equal(isValidIndianPhone("+91987654321"), false);
  assert.equal(isValidIndianPhone("+9198765432100"), false);
});

test("requires strong enough registration fields and restaurant details", () => {
  const base = {
    name: "Partner",
    email: "partner@example.com",
    password: "password123",
    role: "restaurant_partner",
    restaurantDetails: {
      name: "Sample Kitchen",
      cuisine: "Indian",
      address: "Main Street",
      phone: "+919876543210",
    },
  };
  assert.equal(validateRegistration(base), null);
  assert.match(validateRegistration({ ...base, password: "short" }), /8 characters/);
  assert.match(
    validateRegistration({
      ...base,
      restaurantDetails: { ...base.restaurantDetails, phone: "+91987654321" },
    }),
    /exactly 10 digits/,
  );
});

test("requires delivery partner phone numbers to include +91 and exactly 10 digits", () => {
  const registration = {
    name: "Delivery Partner",
    email: "delivery@example.com",
    password: "password123",
    role: "delivery_partner",
    phone: "+919876543210",
  };

  assert.equal(validateRegistration(registration), null);
  for (const phone of ["9876543210", "+91987654321", "+9198765432100"]) {
    assert.match(
      validateRegistration({ ...registration, phone }),
      /exactly 10 digits after \+91/,
    );
  }
  assert.match(
    validateRegistration({ ...registration, phone: undefined }),
    /exactly 10 digits after \+91/,
  );
});

test("validates customer profile details and saved default addresses", () => {
  const profile = {
    name: "Customer",
    email: "customer@example.com",
    phone: "+919876543210",
    addresses: [
      {
        id: "home",
        label: "Home",
        address: "12 Main Street",
        isDefault: true,
      },
    ],
  };

  assert.equal(validateCustomerProfile(profile), null);
  assert.match(
    validateCustomerProfile({ ...profile, phone: "+91987654321" }),
    /exactly 10 digits after \+91/,
  );
  assert.match(
    validateCustomerProfile({
      ...profile,
      addresses: [{ ...profile.addresses[0], isDefault: false }],
    }),
    /exactly one default/,
  );
  assert.match(
    validateCustomerProfile({
      ...profile,
      addresses: [{ ...profile.addresses[0], address: "  " }],
    }),
    /label and delivery address/,
  );
});

test("rejects invalid restaurant updates and menu entries", () => {
  assert.equal(validateRestaurantUpdates({ online: false }), null);
  assert.match(validateRestaurantUpdates({ isAdmin: true }), /unsupported fields/);
  assert.match(
    validateRestaurantUpdates({
      menu: [{ id: "dish", name: "Dish", price: 0, foodType: "veg" }],
    }),
    /positive price/,
  );
});

test("requires valid customer and line-item data for orders", () => {
  const order = {
    restaurantId: "restaurant-1",
    customer: {
      name: "Customer",
      phone: "+919876543210",
      address: "Main Street",
    },
    items: [{ id: "dish-1", quantity: 2 }],
  };
  assert.equal(validateOrderRequest(order), null);
  assert.match(
    validateOrderRequest({ ...order, items: [{ id: "dish-1", quantity: 0 }] }),
    /valid menu id and quantity/,
  );
});
