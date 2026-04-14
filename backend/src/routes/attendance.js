/**
 * Student Attendance Routes
 * GET /api/attendance/current - Get current active session
 * GET /api/attendance/history - Get attendance history
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware to verify token (expects it in auth routes)
const { authenticateToken } = require('../utils/auth');

/**
 * GET /api/attendance/current
 * Get current active attendance session for logged-in student
 */
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get student ID from User
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student profile not found',
        error: 'STUDENT_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    // Find current active attendance session
    const attendanceSession = await prisma.attendanceSession.findFirst({
      where: {
        studentId: student.id,
        sessionStatus: 'ACTIVE',
      },
      include: {
        session: {
          include: { course: true },
        },
      },
    });

    if (!attendanceSession) {
      return res.status(200).json({
        status: 'success',
        message: 'No active session',
        data: {
          currentSession: null,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Format response
    const currentSession = {
      id: attendanceSession.id,
      courseId: attendanceSession.session.courseId,
      courseName: attendanceSession.session.course.name,
      studentId: student.id,
      deviceId: attendanceSession.deviceId,
      sessionStartTime: attendanceSession.sessionStartTime,
      totalDurationSeconds: attendanceSession.totalDurationSeconds,
      sessionStatus: attendanceSession.sessionStatus,
      lastPingTime: attendanceSession.lastPingTime,
    };

    res.status(200).json({
      status: 'success',
      message: 'Current session fetched',
      data: {
        currentSession,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /attendance/current:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch current session',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/attendance/history
 * Get attendance history for student with pagination
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    // Get student ID
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student profile not found',
        error: 'STUDENT_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    // Get total count
    const total = await prisma.attendanceSession.count({
      where: {
        studentId: student.id,
        sessionStatus: { in: ['ACTIVE', 'ENDED'] },
      },
    });

    // Fetch attendance sessions with pagination
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        studentId: student.id,
        sessionStatus: { in: ['ACTIVE', 'ENDED'] },
      },
      include: {
        session: {
          include: { course: true },
        },
      },
      orderBy: { sessionStartTime: 'desc' },
      skip: offset,
      take: limit,
    });

    // Calculate attendance percentage for each session
    const formattedSessions = sessions.map((att) => {
      // Calculate session duration safely
      let sessionDuration = 0;
      if (att.session.scheduledStartTime && att.session.scheduledEndTime) {
        try {
          sessionDuration = Math.floor(
            (new Date(att.session.scheduledEndTime) - new Date(att.session.scheduledStartTime)) /
              1000
          );
        } catch (e) {
          sessionDuration = 0;
        }
      }

      const attendancePercentage =
        sessionDuration > 0 && att.totalDurationSeconds > 0
          ? Math.round(
              (att.totalDurationSeconds / sessionDuration) * 100 * 100
            ) / 100
          : 0;

      return {
        id: att.id,
        courseId: att.session.courseId,
        courseName: att.session.course.name,
        sessionStartTime: att.session.scheduledStartTime,
        sessionEndTime: att.session.scheduledEndTime,
        totalDurationSeconds: att.totalDurationSeconds,
        sessionStatus: att.sessionStatus,
        attendancePercentage,
      };
    });

    res.status(200).json({
      status: 'success',
      message: 'Attendance history fetched',
      data: {
        sessions: formattedSessions,
        total,
        limit,
        offset,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /attendance/history:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch attendance history',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/attendance/course/:courseId
 * Get attendance for a specific course
 */
router.get('/course/:courseId', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    // Get student ID
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student profile not found',
        error: 'STUDENT_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: student.id,
        courseId,
      },
    });

    if (!enrollment) {
      return res.status(403).json({
        status: 'error',
        message: 'Not enrolled in this course',
        error: 'NOT_ENROLLED',
        timestamp: new Date().toISOString(),
      });
    }

    // Get all attendance sessions for this course
    const attendanceSessions = await prisma.attendanceSession.findMany({
      where: {
        studentId: student.id,
        session: { courseId },
        sessionStatus: { in: ['ACTIVE', 'ENDED'] },
      },
      include: { session: true },
      orderBy: { sessionStartTime: 'desc' },
    });

    // Get total course sessions
    const totalSessions = await prisma.session.count({
      where: { courseId },
    });

    const attendedSessions = attendanceSessions.filter(
      (s) => s.sessionStatus === 'ENDED' || s.sessionStatus === 'ACTIVE'
    ).length;

    const attendancePercentage =
      totalSessions > 0
        ? Math.round((attendedSessions / totalSessions) * 100 * 100) / 100
        : 0;

    res.status(200).json({
      status: 'success',
      message: 'Course attendance fetched',
      data: {
        courseId,
        totalSessions,
        attendedSessions,
        attendancePercentage,
        sessions: attendanceSessions.map((att) => ({
          id: att.id,
          sessionDate: att.session.scheduledStartTime,
          durationSeconds: att.totalDurationSeconds,
          status: att.sessionStatus,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /attendance/course/:courseId:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch course attendance',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/attendance/course/:courseId/report
 * Get attendance report for a course (for analytics)
 */
router.get('/course/:courseId/report', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    // Get professor to verify ownership
    const professor = await prisma.professor.findUnique({
      where: { userId },
    });

    if (!professor) {
      return res.status(404).json({
        status: 'error',
        message: 'Professor profile not found',
        error: 'PROFESSOR_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify professor owns this course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course || course.professorId !== professor.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to this course',
        error: 'FORBIDDEN',
        timestamp: new Date().toISOString(),
      });
    }

    // Get all sessions for this course with attendance data
    const sessions = await prisma.session.findMany({
      where: { courseId },
      include: {
        attendanceSessions: true,
      },
    });

    // Calculate statistics
    let totalStudents = 0;
    let totalAttendanceRecords = 0;
    const sessionStats = [];

    for (const session of sessions) {
      const attendanceCount = session.attendanceSessions.filter(
        (a) => a.sessionStatus === 'PRESENT' || a.sessionStatus === 'CHECKED_IN'
      ).length;
      
      sessionStats.push({
        id: session.id,
        scheduledDate: session.scheduledStartTime,
        totalEnrolled: session.attendanceSessions.length,
        attended: attendanceCount,
        absent: session.attendanceSessions.length - attendanceCount,
        attendanceRate:
          session.attendanceSessions.length > 0
            ? ((attendanceCount / session.attendanceSessions.length) * 100).toFixed(2)
            : 0,
      });

      totalStudents = Math.max(totalStudents, session.attendanceSessions.length);
      totalAttendanceRecords += attendanceCount;
    }

    // Calculate overall statistics
    const overallAttendanceRate = sessions.length > 0
      ? ((totalAttendanceRecords / (totalStudents * sessions.length)) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      status: 'success',
      message: 'Attendance report retrieved',
      data: {
        courseId,
        courseName: course.name,
        totalSessions: sessions.length,
        totalStudents,
        overallAttendanceRate: parseFloat(overallAttendanceRate),
        sessions: sessionStats,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /attendance/course/:courseId/report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch attendance report',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
