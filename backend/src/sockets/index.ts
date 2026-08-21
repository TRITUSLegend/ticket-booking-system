import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from '../lib/jwt';
import { env } from '../config';

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.data.user.userId})`);

    socket.on('joinShow', (showId: string) => {
      socket.join(`show:${showId}`);
      console.log(`Socket ${socket.id} joined room show:${showId}`);
    });

    socket.on('leaveShow', (showId: string) => {
      socket.leave(`show:${showId}`);
      console.log(`Socket ${socket.id} left room show:${showId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}
