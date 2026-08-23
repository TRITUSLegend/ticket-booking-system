# Ticket Booking System

A production-quality ticket booking system for movies and concerts with real-time seat selection, concurrency-safe holds, automated waitlist management, and QR-based confirmation emails.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS, Socket.io-client |
| Backend | Node.js + Express, TypeScript |
| Database | PostgreSQL via Neon (free serverless) |
| ORM | Prisma |
| Cache/Queue | Upstash Redis + BullMQ |
| Real-time | Socket.io |
| Auth | JWT (access + refresh tokens), bcrypt |
| QR Codes | `qrcode` npm package |
| Email | Brevo transactional email HTTP API |

## Setup Instructions

### Prerequisites
- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database (free tier)
- An [Upstash](https://upstash.com) Redis database (free tier)
- A [Brevo](https://brevo.com) account with an API key and a verified sender address (free tier)

### 1. Clone & Install

```bash
git clone <repo-url>
cd ticket-booking-system

# Backend
cd backend
npm install
cp .env.example .env  # Fill in your credentials

# Frontend
cd ../frontend
npm install
cp .env.example .env
```

### 2. Configure Environment

**Backend `.env`** — see `.env.example` for all variables. Key ones:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `REDIS_URL` — Upstash Redis connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — 32+ char secrets
- `SMTP_USER` — Verified sender address shown on outgoing mail
- `BREVO_API_KEY` — Brevo API key; without it the app runs but skips email sends
- `HMAC_SECRET` — 32+ char secret for QR/waitlist signing

**Frontend `.env`**:
- `NEXT_PUBLIC_API_URL` — Backend URL (default: `http://localhost:4000`)

### 3. Database Setup

```bash
cd backend
npx prisma migrate dev --schema=src/prisma/schema.prisma
npm run db:seed
```

After the initial migration, apply the partial unique index. Prisma cannot express
partial unique indexes natively, so it ships as raw SQL in
[`backend/src/prisma/migrations/partial_unique_index.sql`](backend/src/prisma/migrations/partial_unique_index.sql):

```sql
CREATE UNIQUE INDEX IF NOT EXISTS "ShowSeat_active_idx"
ON "show_seats" ("showId", "seatId")
WHERE status IN ('HELD', 'BOOKED');
```

### 4. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Backend runs on `http://localhost:4000`, Frontend on `http://localhost:3000`.

### 5. Seed Data

Default seed users (password: `password123`):
- `admin@test.com` (ADMIN)
- `organiser@test.com` (ORGANISER)
- `customer@test.com` (CUSTOMER)

---

## API Documentation

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register user `{ email, password, name, role }` |
| POST | `/api/auth/login` | No | Login `{ email, password }` → access token + refresh cookie |
| POST | `/api/auth/refresh` | Cookie | Refresh access token via httpOnly cookie |
| POST | `/api/auth/logout` | Bearer | Logout, invalidate refresh token |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/profile` | Bearer | Get current user profile |

### Venues (Admin)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/venues` | Admin | Create venue with layout `{ name, address, layout: {rows, columns}, categoryAssignments }` |
| GET | `/api/venues` | Bearer | List all venues |
| GET | `/api/venues/:id` | Bearer | Get venue details with seats |
| PUT | `/api/venues/:id/categories` | Admin | Update seat category assignments for a venue |

### Events
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/events` | Organiser | Create event `{ title, description, type }` |
| GET | `/api/events` | Public | List events (query: `?type=MOVIE&search=rock`) |
| GET | `/api/events/:id` | Public | Get event with shows |
| DELETE | `/api/events/:id` | Organiser | Delete an event the organiser owns |

### Shows
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/shows` | Organiser | Create show `{ eventId, venueId, date, time, pricing }` |
| GET | `/api/shows/:id` | Public | Get show details |
| GET | `/api/shows/event/:eventId` | Public | List shows for an event |
| DELETE | `/api/shows/:id` | Organiser | Delete a show the organiser owns |

### Seats
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/seats/:showId` | Public | Get seat map (with lazy-expiry resolution) |
| POST | `/api/seats/hold` | Bearer | Hold seats `{ showId, seatIds }` → 201 or 409 |
| POST | `/api/seats/release` | Bearer | Release held seats `{ showId, seatIds }` |

### Bookings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/bookings/checkout` | Customer | Checkout held seats `{ showId, seatIds }` → QR + email |
| GET | `/api/bookings/history` | Bearer | Get booking history |
| POST | `/api/bookings/:id/cancel` | Customer | Cancel booking (triggers waitlist) |

### Waitlist
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/waitlist/join` | Customer | Join waitlist `{ showId, category }` |
| POST | `/api/waitlist/offer/complete` | Customer | Complete offer `{ token }` |

### Organiser
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/organiser/dashboard` | Organiser | Revenue dashboard |
| GET | `/api/organiser/events/:id/summary` | Organiser | Event booking summary |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/stats` | Admin | System-wide statistics |

---

## Socket.io Event Contract

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `joinShow` | `showId: string` | Join a show's real-time room |
| `leaveShow` | `showId: string` | Leave a show's room |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `seat:status-changed` | `{ showId, seatId, status, heldBy? }` | Broadcast to room `show:{showId}` when any seat status changes |

Clients authenticate via `socket.handshake.auth.token` (JWT access token).

---

## Seat Hold Logic

See [system-design.md](system-design.md) for the full explanation. In summary:

1. `SELECT ... FOR UPDATE` acquires row-level locks inside a Prisma transaction
2. Lazy expiry checks evaluate `holdExpiresAt` against current time on every read
3. BullMQ delayed jobs proactively release seats and broadcast Socket.io events
4. A partial unique index prevents double-holds at the database level
5. Idempotent holds don't error on double-click

Key files:
- [`backend/src/modules/seats/seats.service.ts`](backend/src/modules/seats/seats.service.ts) — Core hold logic
- [`backend/src/jobs/hold-expiry.worker.ts`](backend/src/jobs/hold-expiry.worker.ts) — Proactive release worker

## Waitlist Logic

1. Customer joins waitlist for a sold-out category
2. On cancellation: oldest `WAITING` entry gets an `OFFERED` seat with a signed email link
3. Offer expires → cascades to next in line automatically
4. `SKIP LOCKED` prevents race conditions on concurrent cancellations

Key files:
- [`backend/src/modules/waitlist/waitlist.service.ts`](backend/src/modules/waitlist/waitlist.service.ts) — Join, cascade, offer completion
- [`backend/src/jobs/offer-expiry.worker.ts`](backend/src/jobs/offer-expiry.worker.ts) — Offer expiry worker

---

## Tests

All three scripts talk to a real database — point `DATABASE_URL` at a scratch
database, not production. Each one cleans up the rows it creates.

```bash
cd backend

npm run test:concurrency   # 20 simultaneous holds on one seat
npm run test:core          # double-book prevention, waitlist join, offer cascade
npm run test:smoke         # end-to-end register → hold → checkout
```

- **`test:concurrency`** ([`tests/concurrency.test.ts`](backend/tests/concurrency.test.ts)) fires 20 simultaneous
  hold requests for the same seat and asserts exactly 1 succeeds with 19 clean rejections.
- **`test:core`** ([`tests/core-mechanics.test.ts`](backend/tests/core-mechanics.test.ts)) covers the three
  domain mechanisms end to end: concurrent double-hold rejection, joining a waitlist
  on a sold-out category, and the offer cascade after a hold expires.
- **`test:smoke`** ([`scripts/smoke-test.js`](backend/scripts/smoke-test.js)) runs against a live instance.
  Defaults to `http://localhost:4000`; override with an argument or `API_URL`:

  ```bash
  npm run test:smoke -- https://your-backend.onrender.com
  API_URL=https://your-backend.onrender.com npm run test:smoke
  ```

---

## Database Schema

See [docs/er-diagram.md](docs/er-diagram.md) for the full ER diagram.

Key tables: `User`, `Venue`, `SeatLayout`, `Seat`, `Event`, `Show`, `ShowSeatPricing`, `ShowSeat`, `Booking`, `BookingSeat`, `Waitlist`

---

## Deployment

### Frontend → Vercel
1. Connect GitHub repo to Vercel
2. Set root directory to `frontend`
3. Set env: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`
4. Deploy

### Backend → Render
1. Create a new Web Service on Render
2. Set root directory to `backend`
3. Build command: `npm install && npx prisma generate --schema=src/prisma/schema.prisma && npm run build`
4. Start command: `npm start`
5. Set all env variables from `.env.example`

### Database → Neon
- Free tier PostgreSQL, connection string in `DATABASE_URL`

### Redis → Upstash
- Free tier Redis, connection string in `REDIS_URL`
