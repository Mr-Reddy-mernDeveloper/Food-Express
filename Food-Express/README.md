# Food Express

Food Express uses a React/Vite client and an Express API backed by MongoDB Atlas. User accounts, restaurant profiles and menus, and orders are stored in MongoDB so they can be accessed from other browsers and devices.

## Run the combined app locally

1. In MongoDB Atlas, create a database user with access to the `food_express` database, and allow the development machine's IP address in **Network Access**.
2. Copy `.env.example` to `.env` if you do not already have a configured `.env`.
3. Set `MONGODB_URI` in `.env` to the Atlas connection string. URL-encode special characters in the database user's username and password.
4. Set `JWT_SECRET` to a long, randomly generated value. For example, generate one locally with `openssl rand -base64 48`.
5. Install packages with `npm install`.
6. Build the frontend and start the combined frontend/API server with `npm run build && npm start`.

Open the URL printed by the server (by default `http://localhost:4000`). Express serves the built frontend and API from the same origin and port; no separate frontend host or CORS configuration is needed for this setup. For frontend development with Vite hot reload, run `npm run dev` and `npm run dev:api` in separate terminals; Vite proxies `/api` requests to port 4000.

The API connects to MongoDB at startup and creates the unique email and order lookup indexes automatically. It stores users in `users` (passwords are bcrypt-hashed) and customer/restaurant order records in `orders`. Restaurant documents and menus are stored on each restaurant partner's user record. The API, not the browser, connects to MongoDB; never put the Atlas URI, database password, or JWT secret in frontend code or a `VITE_*` variable.

Customers can manage their name, email, phone number, and up to 10 saved delivery addresses from the **Profile** page. Their chosen default address and contact details prefill checkout.

For other users or browsers to share live data, deploy this combined app to an internet-accessible host with the production environment variables. Set `CLIENT_ORIGIN` to the exact public frontend origin when the production host sits behind an HTTPS reverse proxy, and allow the API host to connect in MongoDB Atlas **Network Access**. Keep the MongoDB URI and JWT secret in the host's secret manager; never publish them. The app refreshes restaurant data every 30 seconds and orders every 10 seconds.

Accounts and orders created in an older browser-only version are not imported automatically. Register accounts in this version; new accounts, menus, and orders will be shared through MongoDB.
