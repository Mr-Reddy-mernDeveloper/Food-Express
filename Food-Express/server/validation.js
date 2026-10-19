export const allowedRoles = new Set([
  "customer",
  "restaurant_partner",
  "delivery_partner",
]);

export const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

export const isValidIndianPhone = (phone) =>
  typeof phone === "string" && /^\+?91\d{10}$/.test(phone.replace(/\s/g, ""));

export const validateRegistration = (body) => {
  if (!body || typeof body !== "object") return "Provide registration details.";
  if (typeof body.name !== "string" || !body.name.trim()) return "Name is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(body.email))) {
    return "Enter a valid email address.";
  }
  if (typeof body.password !== "string" || body.password.length < 8) {
    return "Password must contain at least 8 characters.";
  }
  if (!allowedRoles.has(body.role)) return "Select a valid account type.";

  if (body.role === "restaurant_partner") {
    const details = body.restaurantDetails;
    if (
      !details ||
      typeof details.name !== "string" ||
      !details.name.trim() ||
      typeof details.cuisine !== "string" ||
      !details.cuisine.trim() ||
      typeof details.address !== "string" ||
      !details.address.trim()
    ) {
      return "Restaurant name, cuisine, address, and phone are required.";
    }
    if (!isValidIndianPhone(details.phone)) {
      return "Restaurant phone must contain exactly 10 digits after +91.";
    }
  }
  if (
    body.role === "delivery_partner" &&
    (typeof body.phone !== "string" || !/^\+91\d{10}$/.test(body.phone))
  ) {
    return "Delivery contact number must contain exactly 10 digits after +91.";
  }
  return null;
};

export const validateCustomerProfile = (profile) => {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    return "Provide customer profile details.";
  }
  if (
    typeof profile.name !== "string" ||
    !profile.name.trim() ||
    profile.name.length > 100
  ) {
    return "Name is required.";
  }
  if (
    typeof profile.email !== "string" ||
    profile.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(profile.email))
  ) {
    return "Enter a valid email address.";
  }
  if (typeof profile.phone !== "string" || !/^\+91\d{10}$/.test(profile.phone)) {
    return "Phone number must contain exactly 10 digits after +91.";
  }
  if (!Array.isArray(profile.addresses) || profile.addresses.length > 10) {
    return "Save no more than 10 delivery addresses.";
  }
  const addressIds = new Set();
  let defaultAddressCount = 0;
  for (const address of profile.addresses) {
    if (
      !address ||
      typeof address.id !== "string" ||
      !address.id.trim() ||
      address.id.length > 100 ||
      addressIds.has(address.id) ||
      typeof address.label !== "string" ||
      !address.label.trim() ||
      address.label.length > 40 ||
      typeof address.address !== "string" ||
      !address.address.trim() ||
      address.address.length > 500 ||
      typeof address.isDefault !== "boolean"
    ) {
      return "Each saved address needs a label and delivery address.";
    }
    addressIds.add(address.id);
    if (address.isDefault) defaultAddressCount += 1;
  }
  if (
    (profile.addresses.length > 0 && defaultAddressCount !== 1) ||
    (profile.addresses.length === 0 && defaultAddressCount !== 0)
  ) {
    return "Choose exactly one default delivery address.";
  }
  return null;
};

export const validateRestaurantUpdates = (updates) => {
  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    return "Provide restaurant updates.";
  }
  const allowedKeys = new Set([
    "name",
    "cuisine",
    "address",
    "phone",
    "online",
    "profileImage",
    "menu",
  ]);
  if (Object.keys(updates).some((key) => !allowedKeys.has(key))) {
    return "The update contains unsupported fields.";
  }
  for (const key of ["name", "cuisine", "address"]) {
    if (key in updates && (typeof updates[key] !== "string" || !updates[key].trim())) {
      return `${key} must not be empty.`;
    }
  }
  if ("phone" in updates && !isValidIndianPhone(updates.phone)) {
    return "Restaurant phone must contain exactly 10 digits after +91.";
  }
  if ("online" in updates && typeof updates.online !== "boolean") {
    return "Restaurant online status must be true or false.";
  }
  if (
    "profileImage" in updates &&
    typeof updates.profileImage !== "string"
  ) {
    return "Profile image must be a string.";
  }
  if ("menu" in updates) {
    if (!Array.isArray(updates.menu) || updates.menu.length > 500) {
      return "Menu must be a list with no more than 500 items.";
    }
    const validFoodTypes = new Set(["veg", "egg", "non-veg"]);
    for (const item of updates.menu) {
      if (
        !item ||
        typeof item.id !== "string" ||
        typeof item.name !== "string" ||
        !item.name.trim() ||
        !Number.isFinite(item.price) ||
        item.price <= 0 ||
        !validFoodTypes.has(item.foodType)
      ) {
        return "Each menu item needs an id, name, positive price, and valid food type.";
      }
    }
  }
  return null;
};

export const validateOrderRequest = (body) => {
  if (!body || typeof body !== "object") return "Provide order details.";
  if (typeof body.restaurantId !== "string" || !body.restaurantId) {
    return "A restaurant is required.";
  }
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 100) {
    return "An order must contain between 1 and 100 items.";
  }
  if (
    typeof body.customer?.name !== "string" ||
    !body.customer.name.trim() ||
    !isValidIndianPhone(body.customer.phone) ||
    typeof body.customer.address !== "string" ||
    !body.customer.address.trim()
  ) {
    return "Customer name, valid phone, and delivery address are required.";
  }
  if (
    body.items.some(
      (item) =>
        typeof item?.id !== "string" ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 99,
    )
  ) {
    return "Each order item must have a valid menu id and quantity.";
  }
  return null;
};
