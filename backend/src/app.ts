import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config';
import { errorHandler } from './middleware';

// Routes
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import venuesRoutes from './modules/venues/venues.routes';
import eventsRoutes from './modules/events/events.routes';
import showsRoutes from './modules/shows/shows.routes';
import seatsRoutes from './modules/seats/seats.routes';
import bookingsRoutes from './modules/bookings/bookings.routes';
import waitlistRoutes from './modules/waitlist/waitlist.routes';
import adminRoutes from './modules/admin/admin.routes';
import organiserRoutes from './modules/organiser/organiser.routes';

const app = express();

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/venues', venuesRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/shows', showsRoutes);
app.use('/api/seats', seatsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/organiser', organiserRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Global Error Handler
app.use(errorHandler);

export default app;
