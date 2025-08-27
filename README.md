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
  npm i @mistralai/mistralai
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

## Stripe Test Mode Setup

1. **Install SDKs**
   - Server (`server/`): `npm install stripe`
   - Client (`client/`): `npm install @stripe/stripe-js @stripe/react-stripe-js`

2. **Get Test API Keys**
   - Visit https://dashboard.stripe.com/test/apikeys
   - Copy your keys: `sk_test_...` (Secret), `pk_test_...` (Publishable)

3. **Configure server/.env**
   - Set:
     ```env
     STRIPE_SECRET_KEY=sk_test_your_key
     STRIPE_PUBLISHABLE_KEY=pk_test_your_key
     CLIENT_URL=http://localhost:5173
     ```

4. **How Payments Work (Unified Checkout)**
  - Create Checkout Session (courses or books): `POST /api/payments/create-checkout-session` with payload:
    ```json
    { "type": "course" | "book", "itemId": "...", "studentId": "..." }
    ```
  - Backend responds with `{ success, url, paymentId }`; redirect the browser to `url`.
  - Webhook handles `checkout.session.completed` at `POST /api/payments/stripe/webhook` to finalize enrollments/purchases.
  - Client has redirect routes: `/payment-success` and `/payment-cancel`.

5. **Test Card**
   - Use `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.

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

## Appointments & Exams (Highlights)
- Educators can create available time slots and manage appointments.
- Exams can be created per course with MCQ questions and auto-grading.
- Student-side features include taking exams with timers, immediate results, and submitting course evaluations.

Key API endpoints:
- Appointments: `POST /api/appointments/slots`, `GET /api/appointments/slots/:educatorId`
- Exams: `POST /api/exams`, `GET /api/exams?studentId=...`, `POST /api/exams/submit`, `GET /api/students/:id/grades`

## CORS
Server uses a shared `corsOptions` applied to both `app.use` and `app.options`, with a small middleware to set headers and short-circuit `OPTIONS`.

## Dependencies Status
- No new dependencies required beyond those listed in `server/package.json` and `client/package.json` (Stripe SDKs already included).
- Run `npm install` in both `server/` and `client/` after pulling updates.