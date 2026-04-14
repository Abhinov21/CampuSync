import { create } from 'zustand';
import io from 'socket.io-client';

export const useWebSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,
  events: [],

  connect: (token) => {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: {
        token: token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
      set({ isConnected: true, socket });
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      set({ isConnected: false });
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });

    set({ socket });
    return socket;
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  addEvent: (event) => {
    set((state) => ({
      events: [...state.events, event].slice(-100), // Keep last 100 events
    }));
  },

  clearEvents: () => {
    set({ events: [] });
  },
}));
