import { create } from 'zustand';

export const useAttendanceStore = create((set) => ({
  currentSession: null,
  activeSessions: [],
  allSessions: [],

  setCurrentSession: (session) => set({ currentSession: session }),
  setActiveSessions: (sessions) => set({ activeSessions: sessions }),
  setAllSessions: (sessions) => set({ allSessions: sessions }),
}));
