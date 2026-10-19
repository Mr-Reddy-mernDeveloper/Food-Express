import "dotenv/config";
import { randomUUID } from "node:crypto";
import process from "node:process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { MongoClient, ObjectId } from "mongodb";
import { rateLimit } from "express-rate-limit";
import {
  normalizeEmail,
  validateCustomerProfile,
  validateOrderRequest,
  validateRegistration,
  validateRestaurantUpdates,
} from "./validation.js";

const requiredEnvironment = ["MONGODB_URI", "JWT_SECRET"];
const missingEnvironment = requiredEnvironment.filter((key) => !process.env[key]);
if (missingEnvironment.length) {
  throw new Error(`Missing required environment variables: ${missingEnvironment.join(", ")}`);
}
if (process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long.");
}

const app = express();
const client = new MongoClient(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
});
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frontendBuildDirectory = path.join(appRoot, "dist");
const databaseName = new URL(process.env.MONGODB_URI).pathname.slice(1) || "food_express";
const db = client.db(databaseName);
const users = db.collection("users");
const orders = db.collection("orders");
const configuredOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const developmentOrigins = process.env.NODE_ENV === "production"
  ? []
  : ["http://localhost:5173", "http://127.0.0.1:5173"];
const allowedOrigins = new Set([...configuredOrigins, ...developmentOrigins]);

app.disable("x-powered-by");
app.use(cors((req, callback) => {
  const origin = req.get("Origin");
  const requestOrigin = `${req.protocol}://${req.get("host")}`;
  if (!origin || origin === requestOrigin || allowedOrigins.has(origin)) {
    callback(null, { origin: true });
    return;
  }
  callback(new Error("This website is not allowed to access the API."));
}));
app.use(express.json({ limit: "8mb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

const publicUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  role: user.role,
  ...(user.role === "customer" ? { addresses: user.addresses || [] } : {}),
  restaurant: user.restaurant || null,
});

const createToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d", issuer: "food-express-api" },
  );

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }
  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "food-express-api",
    });
    if (!ObjectId.isValid(claims.sub)) {
      res.status(401).json({ error: "Your session is invalid. Sign in again." });
      return;
    }
    const user = await users.findOne({ _id: new ObjectId(claims.sub) });
    if (!user || user.role !== claims.role) {
      res.status(401).json({ error: "Your session is no longer valid. Sign in again." });
      return;
    }
    req.account = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Your session has expired. Sign in again." });
      return;
    }
    next(error);
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.account.role)) {
    res.status(403).json({ error: "Your account is not allowed to perform this action." });
    return;
  }
  next();
};

const getRestaurants = async () => {
  const partners = await users.find(
    { role: "restaurant_partner", restaurant: { $ne: null } },
    { projection: { name: 1, restaurant: 1 } },
  ).toArray();
  return partners.map(({ _id, name, restaurant }) => ({
    ...restaurant,
    ownerId: _id.toString(),
    partnerName: name,
  }));
};

const getRestaurantForOrder = async (restaurantId) => {
  const partner = await users.findOne(
    { role: "restaurant_partner", "restaurant.id": restaurantId },
    { projection: { restaurant: 1 } },
  );
  return partner?.restaurant || null;
};

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/auth/register", authLimiter, async (req, res, next) => {
  const validationError = validateRegistration(req.body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  try {
    const email = normalizeEmail(req.body.email);
    const user = {
      name: req.body.name.trim(),
      email,
      passwordHash: await bcrypt.hash(req.body.password, 12),
      phone: req.body.role === "delivery_partner" ? req.body.phone : "",
      role: req.body.role,
      createdAt: new Date(),
      ...(req.body.role === "restaurant_partner"
        ? {
            restaurant: {
              id: `restaurant-${randomUUID()}`,
              name: req.body.restaurantDetails.name.trim(),
              cuisine: req.body.restaurantDetails.cuisine.trim(),
              address: req.body.restaurantDetails.address.trim(),
              phone: `+91${req.body.restaurantDetails.phone.replace(/\D/g, "").slice(-10)}`,
              rating: 0,
              priceRange: "—",
              online: true,
              image: "",
              menu: [],
            },
          }
        : { restaurant: null }),
    };
    const result = await users.insertOne(user);
    res.status(201).json({ user: publicUser({ ...user, _id: result.insertedId }) });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({
        error: "This email is already registered. Sign in or use a different email.",
      });
      return;
    }
    next(error);
  }
});

app.post("/api/auth/login", authLimiter, async (req, res, next) => {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;
  if (!email || typeof password !== "string") {
    res.status(400).json({ error: "Enter your email and password." });
    return;
  }
  try {
    const user = await users.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    res.json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", authenticate, (req, res) => {
  res.json({ user: publicUser(req.account) });
});

app.patch("/api/customer/profile", authenticate, requireRole("customer"), async (req, res, next) => {
  const validationError = validateCustomerProfile(req.body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  try {
    const updates = {
      name: req.body.name.trim(),
      email: normalizeEmail(req.body.email),
      phone: req.body.phone,
      addresses: req.body.addresses.map((address) => ({
        id: address.id,
        label: address.label.trim(),
        address: address.address.trim(),
        isDefault: address.isDefault,
      })),
    };
    await users.updateOne({ _id: req.account._id }, { $set: updates });
    const updatedUser = await users.findOne({ _id: req.account._id });
    res.json({ user: publicUser(updatedUser) });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({
        error: "This email is already registered. Use a different email.",
      });
      return;
    }
    next(error);
  }
});

app.get("/api/restaurants", async (req, res, next) => {
  try {
    res.json({ restaurants: await getRestaurants() });
  } catch (error) {
    next(error);
  }
});

app.patch(
  "/api/restaurants/:restaurantId",
  authenticate,
  requireRole("restaurant_partner"),
  async (req, res, next) => {
    if (req.account.restaurant?.id !== req.params.restaurantId) {
      res.status(404).json({ error: "Restaurant not found." });
      return;
    }
    const validationError = validateRestaurantUpdates(req.body);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }
    try {
      const updates = { ...req.body };
      for (const key of ["name", "cuisine", "address"]) {
        if (key in updates) updates[key] = updates[key].trim();
      }
      if (updates.phone) {
        updates.phone = `+91${updates.phone.replace(/\D/g, "").slice(-10)}`;
      }
      await users.updateOne(
        { _id: req.account._id, "restaurant.id": req.params.restaurantId },
        { $set: Object.fromEntries(
          Object.entries(updates).map(([key, value]) => [`restaurant.${key}`, value]),
        ) },
      );
      const updatedUser = await users.findOne({ _id: req.account._id });
      res.json({ user: publicUser(updatedUser), restaurant: updatedUser.restaurant });
    } catch (error) {
      next(error);
    }
  },
);

app.get("/api/orders", authenticate, async (req, res, next) => {
  try {
    let filter;
    if (req.account.role === "customer") {
      filter = { customerId: req.account._id };
    } else if (req.account.role === "restaurant_partner") {
      filter = { restaurantId: req.account.restaurant?.id };
    } else if (req.account.role === "delivery_partner") {
      filter = {
        $or: [
          {
            status: { $in: ["accepted", "ready_for_pickup"] },
            $or: [
              { deliveryPartner: null },
              { deliveryPartner: { $exists: false } },
            ],
            rejectedDeliveryPartnerEmails: { $nin: [req.account.email] },
          },
          { "deliveryPartner.email": req.account.email },
        ],
      };
    } else {
      filter = {};
    }
    const result = await orders.find(filter).sort({ createdAt: -1 }).toArray();
    res.json({
      orders: result.map((order) => ({ ...order, id: order._id.toString(), _id: undefined })),
    });
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/orders/batch",
  authenticate,
  requireRole("customer"),
  async (req, res, next) => {
    const requestedOrders = req.body?.orders;
    if (!Array.isArray(requestedOrders) || requestedOrders.length === 0 || requestedOrders.length > 20) {
      res.status(400).json({ error: "Provide between 1 and 20 restaurant orders." });
      return;
    }
    const validationErrors = requestedOrders.map(validateOrderRequest);
    const invalidIndex = validationErrors.findIndex(Boolean);
    if (invalidIndex !== -1) {
      res.status(400).json({ error: validationErrors[invalidIndex] });
      return;
    }
    try {
      const prepared = [];
      for (const request of requestedOrders) {
        const restaurant = await getRestaurantForOrder(request.restaurantId);
        if (!restaurant) {
          res.status(404).json({ error: "A restaurant in this order no longer exists." });
          return;
        }
        if (!restaurant.online) {
          res.status(409).json({ error: `${restaurant.name} is currently offline.` });
          return;
        }
        const items = [];
        for (const requestedItem of request.items) {
          const menuItem = restaurant.menu.find((item) => item.id === requestedItem.id);
          if (!menuItem) {
            res.status(409).json({ error: `An item from ${restaurant.name} is no longer available.` });
            return;
          }
          items.push({
            id: menuItem.id,
            name: menuItem.name,
            quantity: requestedItem.quantity,
            price: menuItem.price,
          });
        }
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const deliveryFee = subtotal > 500 ? 0 : subtotal < 200 ? 100 : 80;
        const platformFee = 10;
        const gst = Math.round((subtotal + deliveryFee + platformFee) * 0.18 * 100) / 100;
        const total = Math.round((subtotal + deliveryFee + platformFee + gst) * 100) / 100;
        const createdAt = new Date();
        prepared.push({
          id: `order-${randomUUID()}`,
          customerId: req.account._id,
          restaurantId: restaurant.id,
          restaurant: {
            name: restaurant.name,
            address: restaurant.address || "",
            phone: restaurant.phone || "",
          },
          customer: {
            name: request.customer.name.trim(),
            phone: request.customer.phone,
            address: request.customer.address.trim(),
            email: req.account.email,
          },
          items,
          specialInstructions: typeof request.specialInstructions === "string"
            ? request.specialInstructions.trim()
            : "",
          coupon: typeof request.coupon === "string" ? request.coupon.trim() : null,
          payment: "Cash on Delivery",
          pricing: { subtotal, deliveryFee, platformFee, gstRate: 18, gst, total },
          total,
          status: "pending",
          deliveryPartner: null,
          deliveryPartnerId: null,
          rejectedDeliveryPartnerEmails: [],
          createdAt,
          statusHistory: [{ status: "placed", at: createdAt.toISOString() }],
        });
      }
      const result = await orders.insertMany(prepared, { ordered: true });
      res.status(201).json({
        orders: prepared.map((order, index) => ({
          ...order,
          _id: undefined,
          id: result.insertedIds[index].toString(),
        })),
      });
    } catch (error) {
      next(error);
    }
  },
);

app.patch("/api/orders/:orderId", authenticate, async (req, res, next) => {
  if (!ObjectId.isValid(req.params.orderId)) {
    res.status(400).json({ error: "Invalid order id." });
    return;
  }
  const order = await orders.findOne({ _id: new ObjectId(req.params.orderId) });
  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }

  const updates = req.body;
  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    res.status(400).json({ error: "Provide order updates." });
    return;
  }
  const fields = new Set([
    "status",
    "readyForPickup",
    "deliveryPartner",
    "deliveryEarnings",
    "rejectedDeliveryPartnerEmails",
    "cancellationReason",
    "cancellationReasonCategory",
  ]);
  if (Object.keys(updates).some((key) => !fields.has(key))) {
    res.status(400).json({ error: "The update contains unsupported fields." });
    return;
  }

  const set = {};
  if (req.account.role === "restaurant_partner") {
    if (order.restaurantId !== req.account.restaurant?.id) {
      res.status(403).json({ error: "You cannot update this order." });
      return;
    }
    if (updates.status === "rejected") {
      if (order.status !== "pending") {
        res.status(409).json({ error: "Only pending orders can be cancelled." });
        return;
      }
      if (
        typeof updates.cancellationReason !== "string" ||
        !updates.cancellationReason.trim() ||
        ![
          "Item not available right now",
          "Unable to prepare the order",
          "Restaurant is temporarily closed",
          "Technical issues",
          "Other",
        ].includes(updates.cancellationReasonCategory) ||
        (updates.cancellationReasonCategory === "Other" &&
          !updates.cancellationReason.trim())
      ) {
        res.status(400).json({ error: "A cancellation reason is required." });
        return;
      }
      set.status = "rejected";
      set.cancellationReason = updates.cancellationReason.trim().slice(0, 500);
      set.cancellationReasonCategory = updates.cancellationReasonCategory;
    } else if (updates.status === "accepted" && order.status === "pending") {
      set.status = "accepted";
    } else if (
      updates.readyForPickup === true &&
      ["accepted", "delivery_assigned"].includes(order.status) &&
      !order.readyForPickup
    ) {
      set.readyForPickup = true;
      set.status = order.deliveryPartner ? "delivery_assigned" : "ready_for_pickup";
    } else {
      res.status(400).json({ error: "This order update is not valid for the restaurant." });
      return;
    }
  } else if (req.account.role === "delivery_partner") {
    if (Array.isArray(updates.rejectedDeliveryPartnerEmails)) {
      if (
        !["accepted", "ready_for_pickup"].includes(order.status) ||
        order.deliveryPartner
      ) {
        res.status(409).json({ error: "This delivery is no longer available to pass." });
        return;
      }
      set.rejectedDeliveryPartnerEmails = [
        ...new Set([...(order.rejectedDeliveryPartnerEmails || []), req.account.email]),
      ];
    } else if (
      updates.status === "delivery_assigned" &&
      !order.deliveryPartner &&
      ["accepted", "ready_for_pickup"].includes(order.status) &&
      !order.rejectedDeliveryPartnerEmails?.includes(req.account.email)
    ) {
      set.deliveryPartner = {
        name: req.account.name,
        email: req.account.email,
        phone: req.account.phone || "",
      };
      set.status = "delivery_assigned";
    } else if (
      updates.status === "picked_up" &&
      order.deliveryPartner?.email === req.account.email &&
      order.status === "delivery_assigned"
    ) {
      set.status = "picked_up";
    } else if (
      updates.status === "delivered" &&
      order.deliveryPartner?.email === req.account.email &&
      ["delivery_assigned", "picked_up"].includes(order.status)
    ) {
      set.status = "delivered";
      set.deliveryEarnings = Math.round(
        ((order.pricing?.deliveryFee || 0) + (order.pricing?.gst || 0)) * 100,
      ) / 100;
    } else {
      res.status(403).json({ error: "You cannot perform this update on the order." });
      return;
    }
  } else {
    res.status(403).json({ error: "Your account cannot update orders." });
    return;
  }

  const statusHistory = [...(order.statusHistory || [])];
  if (set.status && set.status !== order.status) {
    statusHistory.push({ status: set.status, at: new Date().toISOString() });
  }
  if (set.readyForPickup && (!set.status || set.status !== "ready_for_pickup")) {
    statusHistory.push({ status: "ready_for_pickup", at: new Date().toISOString() });
  }
  set.statusHistory = statusHistory;
  try {
    await orders.updateOne({ _id: order._id }, { $set: set });
    const updated = await orders.findOne({ _id: order._id });
    res.json({ order: { ...updated, id: updated._id.toString(), _id: undefined } });
  } catch (error) {
    next(error);
  }
});

app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found." });
});

app.use(express.static(frontendBuildDirectory));
app.get(/^(?!\/api(?:\/|$)).*/, (req, res, next) => {
  res.sendFile(path.join(frontendBuildDirectory, "index.html"), (error) => {
    if (error) next(error);
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  console.error("API request failed:", error);
  res.status(500).json({ error: "The server could not complete this request." });
});

const start = async () => {
  await client.connect();
  await users.createIndex({ email: 1 }, { unique: true });
  await orders.createIndex({ customerId: 1, createdAt: -1 });
  await orders.createIndex({ restaurantId: 1, createdAt: -1 });
  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => {
    console.log(`Food Express frontend and API listening on port ${port}`);
  });
};

export { app };

const isDirectExecution = process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirectExecution) {
  start().catch((error) => {
    console.error("Could not connect to MongoDB or start the API:", error.message);
    process.exitCode = 1;
  });
}
