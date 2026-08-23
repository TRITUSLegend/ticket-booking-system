import { io, Socket } from 'socket.io-client';
import { env } from './env';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return null;

    socket = io(env.NEXT_PUBLIC_API_URL, {
      auth: { token },
      autoConnect: true,
      withCredentials: true,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
