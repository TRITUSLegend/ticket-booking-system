const API = 'https://ticket-booking-system-0z7p.onrender.com/api';

async function run() {
  const events = await fetch(API + '/events').then(r => r.json());
  const showId = await fetch(API + '/shows/event/' + events.data[0].id).then(r => r.json()).then(d => d.data[0].id);
  
  const showSeatsData = await fetch(API + '/seats/show/' + showId).then(r => r.json());
  const seatId = showSeatsData.data.find(s => s.status === 'AVAILABLE')?.seatId;
  if (!seatId) return console.log('No available seats');

  const email = 'test' + Date.now() + '@example.com';
  let res = await fetch(API + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test', email, password: 'password123', role: 'CUSTOMER' })
  });
  let data = await res.json();
  const token = data.data?.accessToken;
  
  res = await fetch(API + '/seats/hold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ showId, seatIds: [seatId] })
  });
  data = await res.json();
  if (data.status !== 'success') return console.log('Hold failed', data);

  res = await fetch(API + '/bookings/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ showId, seatIds: [seatId] })
  });
  data = await res.json();
  console.log('CHECKOUT RESPONSE:', data);
}
run();
