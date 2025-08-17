# Shikkha.com
edtech platform for everyone

## Prerequisites
- Node.js 18+ and npm
- MongoDB running locally or a MongoDB URI

## Install Dependencies
Install separately for server and client.

- Server (`server/`):
  ```bash
  npm install
  ```
- Client (`client/`):
  ```bash
  npm install
  ```

## What gets installed
- Server (`server/package.json`): `express`, `cors`, `mongoose`, `dotenv`, `cookie-parser`, `jsonwebtoken`, `bcrypt`/`bcryptjs`, `multer`, `axios`, `stripe`, and `nodemon` (dev)
- Client (`client/package.json`): `react`, `react-dom`, `react-router-dom`, `axios`, `react-hot-toast`, `react-icons`, `framer-motion`, `date-fns`, `@tailwindcss/vite`, `tailwindcss`, `vite` and ESLint tooling

You do not need to install these one-by-one; running `npm install` in each folder will install the correct versions.

## Environment Variables (server)
Create `server/.env` with at least:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret
PORT=5000
STRIPE_SECRET_KEY=your_stripe_key   # if using payments
```

## Run
- Start the server (from `server/`):
  ```bash
  npm run server   # uses nodemon
  # or
  npm start        # node server.js
  ```
- Start the client (from `client/`):
  ```bash
  npm run dev      # starts Vite dev server
  ```

By default, client runs on a Vite port (e.g., 5173) and server on `PORT` (default 5000).