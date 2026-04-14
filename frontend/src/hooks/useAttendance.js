import { useAttendanceStore } from '../store/attendanceStore';
import api from '../utils/api';
import { useState, useEffect, useCallback } from 'react';

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

/**
 * Hook for loading current session with loading/error states
 * Auto-refreshes every 30 seconds
 */
export const useCurrentSession = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/attendance/current');
      setSession(response.data.data?.currentSession || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch session');
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchSession]);

  return { session, loading, error, refetch: fetchSession };
};

/**
 * Hook for paginated attendance history with course filtering
 * 
 * @param {number} page - Page number (1-based)
 * @param {string} courseId - Optional course ID filter
 * @param {number} limit - Records per page (default 20)
 */
export const useHistoryList = (page = 1, courseId = null, limit = 20) => {
  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const offset = (page - 1) * limit;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        let url = `/api/attendance/history?limit=${limit}&offset=${offset}`;
        if (courseId) {
          url += `&courseId=${courseId}`;
        }

        const response = await api.get(url);
        const data = response.data.data;

        setRecords(data?.sessions || []);
        setTotalCount(data?.total || 0);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch attendance history');
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [page, courseId, limit, offset]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    records,
    totalCount,
    totalPages,
    currentPage: page,
    loading,
    error,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Hook for calculating attendance statistics
 * 
 * @param {Array} records - All attendance records
 */
export const useStats = (records = []) => {
  const [stats, setStats] = useState({
    totalSessions: 0,
    presentCount: 0,
    absentCount: 0,
    attendancePercentage: 0,
    currentStreak: 0,
    longestStreak: 0,
  });

  useEffect(() => {
    if (!records || records.length === 0) {
      setStats({
        totalSessions: 0,
        presentCount: 0,
        absentCount: 0,
        attendancePercentage: 0,
        currentStreak: 0,
        longestStreak: 0,
      });
      return;
    }

    // Sort by date descending (most recent first)
    const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));

    const presentCount = sorted.filter(r => r.attended === true || r.status === 'PRESENT').length;
    const absentCount = sorted.filter(r => r.attended === false || r.status === 'ABSENT').length;
    const totalSessions = sorted.length;
    const attendancePercentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

    // Calculate current streak (from most recent)
    let currentStreak = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].attended === true || sorted[i].status === 'PRESENT') {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].attended === true || sorted[i].status === 'PRESENT') {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    setStats({
      totalSessions,
      presentCount,
      absentCount,
      attendancePercentage,
      currentStreak,
      longestStreak,
    });
  }, [records]);

  return stats;
};

/**
 * Hook for exiting a session
 */
export const useExitSession = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const exitSession = useCallback(async (sessionId) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.post(`/api/attendance/${sessionId}/exit`);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to exit session');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { exitSession, loading, error };
};
