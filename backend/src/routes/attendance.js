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
    const userId = req.user.id;

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
    const userId = req.user.id;
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
        sessionStatus: { in: ['PRESENT', 'INCOMPLETE'] },
      },
    });

    // Fetch attendance sessions with pagination
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        studentId: student.id,
        sessionStatus: { in: ['PRESENT', 'INCOMPLETE'] },
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
      const sessionDuration = att.session.scheduledEndTime
        ? Math.floor(
            (att.session.scheduledEndTime - att.session.scheduledStartTime) /
              1000
          )
        : 0;

      const attendancePercentage =
        sessionDuration > 0
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
    const userId = req.user.id;

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
        sessionStatus: { in: ['PRESENT', 'INCOMPLETE'] },
      },
      include: { session: true },
      orderBy: { sessionStartTime: 'desc' },
    });

    // Get total course sessions
    const totalSessions = await prisma.session.count({
      where: { courseId },
    });

    const attendedSessions = attendanceSessions.filter(
      (s) => s.sessionStatus === 'PRESENT'
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

module.exports = router;
