/**
 * End-to-end smoke test against a running instance.
 *
 * Registers a throwaway customer, holds the first available seat on the first
 * show it finds, and checks out. Exits non-zero on the first failed step.
 *
 * Usage:
 *   node scripts/smoke-test.js
 *   node scripts/smoke-test.js https://your-backend.onrender.com
 *   API_URL=https://your-backend.onrender.com node scripts/smoke-test.js
 */

const BASE_URL = (process.argv[2] || process.env.API_URL || 'http://localhost:4000').replace(/\/+$/, '');
const API = `${BASE_URL}/api`;

async function call(path, options = {}) {
  const res = await fetch(API + path, options);
  const body = await res.json();
  if (body.status !== 'success') {
    throw new Error(`${options.method || 'GET'} ${path} → ${res.status}: ${JSON.stringify(body)}`);
  }
  return body.data;
}

async function run() {
  console.log(`Running smoke test against ${API}`);

  const events = await call('/events');
  if (events.length === 0) throw new Error('No events found. Run `npm run db:seed` first.');

  const shows = await call(`/shows/event/${events[0].id}`);
  if (shows.length === 0) throw new Error(`Event "${events[0].title}" has no shows.`);
  const showId = shows[0].id;

  const seats = await call(`/seats/${showId}`);
  const seat = seats.find((s) => s.status === 'AVAILABLE');
  if (!seat) throw new Error('No available seats on this show.');

  const email = `smoke-${Date.now()}@example.com`;
  const { accessToken } = await call('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Smoke Test', email, password: 'password123', role: 'CUSTOMER' }),
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };

  // seatIds are ShowSeat ids, not Seat ids
  const hold = await call('/seats/hold', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ showId, seatIds: [seat.id] }),
  });
  console.log(`Held seat ${seat.label} until ${hold.holdExpiresAt}`);

  const booking = await call('/bookings/checkout', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ showId, seatIds: [seat.id] }),
  });
  console.log('Checkout succeeded:', booking);
  console.log('Smoke test PASSED');
}

run().catch((err) => {
  console.error('Smoke test FAILED:', err.message);
  process.exit(1);
});
