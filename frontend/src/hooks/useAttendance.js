import { useAttendanceStore } from '../store/attendanceStore';
import api from '../utils/api';

export const useAttendance = () => {
  const { currentSession, activeSessions, allSessions, setCurrentSession, setActiveSessions, setAllSessions } = useAttendanceStore();

  const fetchCurrentSession = async () => {
    try {
      const response = await api.get('/api/attendance/current');
      setCurrentSession(response.data.data?.currentSession || null);
      return response.data.data;
    } catch (error) {
      console.log('No active session');
      setCurrentSession(null);
      return null;
    }
  };

  const fetchCourseHistory = async (courseId) => {
    try {
      const response = await api.get(`/api/attendance/course/${courseId}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch course history:', error);
      throw error;
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const response = await api.get('/api/attendance/history');
      setAllSessions(response.data.data?.sessions || []);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch attendance history:', error);
      throw error;
    }
  };

  const fetchLiveAttendance = async (courseId) => {
    try {
      const response = await api.get(`/api/attendance/course/${courseId}/live`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch live attendance:', error);
      throw error;
    }
  };

  return {
    currentSession,
    activeSessions,
    allSessions,
    fetchCurrentSession,
    fetchCourseHistory,
    fetchAttendanceHistory,
    fetchLiveAttendance,
  };
};
