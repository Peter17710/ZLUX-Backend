# ZLUX Backend

Backend API for **ZLUX** — a premium private chauffeur booking platform. Built with Node.js, Express, MongoDB, and Stripe.

**Live API:** `https://zlux-backend.onrender.com/api/v1`

> Note: hosted on a free tier that sleeps after inactivity. The first request after idle time may take 30-50 seconds to respond.

---

## Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express
- **Database:** MongoDB with Mongoose
- **Auth:** JWT + bcrypt
- **Payments:** Stripe (Payment Intents + Webhooks)
- **File uploads:** Multer

---

## Project Structure

```
ZLUX-Backend/
├── db/
│   └── models/
│       ├── user.model.js
│       ├── vehicle.model.js
│       ├── booking.model.js
│       └── driver.model.js
├── src/
│   ├── middleware/
│   │   ├── handleAsyncError.js
│   │   └── globalErrorHandler.js
│   ├── utils/
│   │   ├── appError.js
│   │   └── generateToken.js
│   └── modules/
│       ├── auth/
│       ├── vehicle/
│       ├── booking/
│       ├── payment/
│       └── driver/
├── app.js
├── server.js
├── .env.example
└── package.json
```

---

## Getting Started

```bash
git clone https://github.com/Peter17710/ZLUX-Backend.git
cd ZLUX-Backend
npm install
cp .env.example .env
```

Fill in `.env` with real values (see table below), then run:

```bash
npm run dev
```

Server starts on `http://localhost:4000` (or the `PORT` you set).

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on (default `4000`) |
| `MONGO_URI` | MongoDB connection string (Atlas or local) |
| `JWT_SECRET` | Secret used to sign auth tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `STRIPE_SECRET_KEY` | Stripe secret key (test or live) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

---

## Authentication

- `POST /api/v1/auth/signup` — creates a `member` account (role can't be self-assigned)
- `POST /api/v1/auth/signin` — returns a JWT `accessToken`
- `GET /api/v1/auth/me` — requires `Authorization: Bearer <token>`

Admin-only routes require a user with `role: "admin"`, set manually in the database.

---

## API Endpoints

### Vehicles
| Method | Endpoint | Access |
|---|---|---|
| GET | `/vehicles` | Public |
| GET | `/vehicles/available?date=&time=&passengers=` | Public |
| GET | `/vehicles/:id` | Public |
| POST | `/vehicles` | Admin |
| PATCH | `/vehicles/:id` | Admin |
| DELETE | `/vehicles/:id` | Admin |
| POST | `/vehicles/:id/image` | Admin |

### Bookings
| Method | Endpoint | Access |
|---|---|---|
| POST | `/bookings` | Public |
| GET | `/bookings/:id` | Public |
| GET | `/bookings/reference/:ref` | Public |
| GET | `/bookings/lookup?email=&reference=` | Public |
| PATCH | `/bookings/:id/passenger` | Public |
| POST | `/bookings/:id/confirm` | Public |
| DELETE | `/bookings/:id` | Public |
| GET | `/bookings` | Admin |
| PATCH | `/bookings/:id/status` | Admin |

### Payments
| Method | Endpoint | Access |
|---|---|---|
| POST | `/payments/create-intent` | Public |
| POST | `/payments/confirm` | Public |
| POST | `/payments/refund` | Public |
| POST | `/webhooks/stripe` | Stripe only |

### Drivers
| Method | Endpoint | Access |
|---|---|---|
| GET | `/drivers` | Admin |
| POST | `/drivers` | Admin |
| PATCH | `/drivers/booking/:id` | Admin |

---

## Data Shapes

`pickupLocation` and `destination` are objects, not plain strings:

```json
{ "address": "LAX Airport", "lat": 33.9416, "lng": -118.4085 }
```

All error responses follow this shape:

```json
{ "status": "fail", "message": "Description of what went wrong" }
```

---

## Testing

A Postman collection is included: `ZLUX-Postman-Collection.json`. Import it into Postman and set the `baseUrl` variable to either:

- `http://localhost:4000/api/v1` (local)
- `https://zlux-backend.onrender.com/api/v1` (production)

---

## Frontend Integration

See `FRONTEND-INTEGRATION.md` for a full mapping between each Figma screen and the corresponding API calls.

---

## Deployment

Hosted on **Render**, connected to this GitHub repo with auto-deploy on push to `main`. Database is hosted on **MongoDB Atlas**.
