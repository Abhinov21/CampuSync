import { useEffect } from 'react';
import { useWebSocketStore } from '../store/websocketStore';
import { useAuthStore } from '../store/authStore';

export const useWebSocket = () => {
  const { socket, isConnected, connect, disconnect, addEvent } = useWebSocketStore();
  const { token } = useAuthStore();

  useEffect(() => {
    if (token && !socket) {
      connect(token);
    }

    return () => {
      // Don't disconnect on unmount as socket is global
    };
  }, [token, socket, connect]);

  const joinSession = (sessionId) => {
    if (socket && isConnected) {
      socket.emit('join-session', sessionId);
    }
  };

  const leaveSession = (sessionId) => {
    if (socket && isConnected) {
      socket.emit('leave-session', sessionId);
    }
  };

  const onSessionEvent = (callback) => {
    if (socket) {
      socket.on('session-event', callback);
    }
  };

  const onAnomalyAlert = (callback) => {
    if (socket) {
      socket.on('anomaly-alert', callback);
    }
  };

  return {
    socket,
    isConnected,
    joinSession,
    leaveSession,
    onSessionEvent,
    onAnomalyAlert,
    connect,
    disconnect,
    addEvent,
  };
};
