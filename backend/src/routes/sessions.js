/**
 * Session Management Routes (Professor)
 * POST /api/sessions/start - Start new attendance session
 * PATCH /api/sessions/:sessionId/end - End attendance session
 * GET /api/sessions/:sessionId/live - Get live attendance view
 * GET /api/sessions/:sessionId/report - Get attendance report
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticateToken = require('../utils/auth').authenticateToken;
const authorizeRole = require('../utils/auth').authorizeRole;

/**
 * POST /api/sessions/start
 * Start new attendance session for a course (Professor only)
 */
router.post('/start', authenticateToken, authorizeRole(['PROFESSOR']), async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.userId;

    if (!courseId) {
      return res.status(400).json({
        status: 'error',
        message: 'courseId is required',
        error: 'MISSING_FIELDS',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify professor owns this course
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

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        professorId: professor.id,
      },
    });

    if (!course) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not teach this course',
        error: 'FORBIDDEN',
        timestamp: new Date().toISOString(),
      });
    }

    // Get enrolled students count
    const enrolledCount = await prisma.enrollment.count({
      where: { courseId },
    });

    // Create new session
    const now = new Date();
    const defaultEndTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    const session = await prisma.session.create({
      data: {
        courseId,
        scheduledStartTime: now,
        scheduledEndTime: defaultEndTime,
        sessionStatus: 'ACTIVE',
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Session started',
      data: {
        session: {
          id: session.id,
          courseId: session.courseId,
          courseName: course.name,
          sessionStartTime: session.scheduledStartTime,
          sessionStatus: session.sessionStatus,
          enrolledStudents: enrolledCount,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in POST /sessions/start:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to start session',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PATCH /api/sessions/:sessionId/end
 * End an active attendance session (Professor only)
 */
router.patch(
  '/:sessionId/end',
  authenticateToken,
  authorizeRole(['PROFESSOR']),
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.userId;

      // Get professor
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

      // Get session and verify ownership
      const session = await prisma.session.findFirst({
        where: {
          id: sessionId,
          course: { professorId: professor.id },
        },
        include: { course: true },
      });

      if (!session) {
        return res.status(404).json({
          status: 'error',
          message: 'Session not found or access denied',
          error: 'NOT_FOUND',
          timestamp: new Date().toISOString(),
        });
      }

      // End session
      const endTime = new Date();
      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: {
          sessionStatus: 'COMPLETED',
          actualEndTime: endTime,
        },
      });

      // CRITICAL: Update all AttendanceSession records to ENDED status
      // This ensures they appear in student's attendance history
      
      // First, get all ACTIVE attendance sessions
      const activeAttendanceSessions = await prisma.attendanceSession.findMany({
        where: { 
          sessionId,
          sessionStatus: 'ACTIVE'
        },
      });

      // Calculate duration for each student if not already set
      for (const att of activeAttendanceSessions) {
        let durationSeconds = att.totalDurationSeconds;
        
        // If duration wasn't set by MQTT, calculate it now
        if (durationSeconds === 0 || !durationSeconds) {
          durationSeconds = Math.floor((endTime - att.sessionStartTime) / 1000);
        }

        // Update with duration and ENDED status
        await prisma.attendanceSession.update({
          where: { id: att.id },
          data: { 
            sessionStatus: 'ENDED',
            sessionEndTime: endTime,
            totalDurationSeconds: durationSeconds
          },
        });
      }

      // Get all attendance data for response
      const attendanceSessions = await prisma.attendanceSession.findMany({
        where: { sessionId },
        include: { student: { include: { user: true } } },
      });

      // Calculate session duration for 65% threshold
      const sessionDurationSeconds = endTime && session.scheduledStartTime
        ? Math.floor((endTime - new Date(session.scheduledStartTime)) / 1000)
        : 0;
      const attendanceThreshold = sessionDurationSeconds > 0 ? Math.ceil(sessionDurationSeconds * 0.65) : 0;

      const studentAttendance = attendanceSessions.map((att) => ({
        studentId: att.student.id,
        name: att.student.user.email.split('@')[0],
        // Apply 65% threshold: present if totalDuration >= threshold
        attended: sessionDurationSeconds > 0 && att.totalDurationSeconds >= attendanceThreshold,
        durationSeconds: att.totalDurationSeconds,
        attendancePercentage: sessionDurationSeconds > 0 && att.totalDurationSeconds > 0
          ? Math.round((att.totalDurationSeconds / sessionDurationSeconds) * 100)
          : 0,
      }));

      res.status(200).json({
        status: 'success',
        message: 'Session ended',
        data: {
          session: {
            id: updatedSession.id,
            courseId: updatedSession.courseId,
            sessionStartTime: updatedSession.scheduledStartTime,
            sessionEndTime: endTime,
            sessionStatus: updatedSession.sessionStatus,
            studentAttendance,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in PATCH /sessions/:sessionId/end:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to end session',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/sessions/:sessionId/live
 * Get live attendance view for ongoing session (Professor only)
 */
router.get(
  '/:sessionId/live',
  authenticateToken,
  authorizeRole(['PROFESSOR']),
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.userId;

      // Get professor
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

      // Get session
      const session = await prisma.session.findFirst({
        where: {
          id: sessionId,
          course: { professorId: professor.id },
        },
        include: { course: true },
      });

      if (!session) {
        return res.status(404).json({
          status: 'error',
          message: 'Session not found',
          error: 'NOT_FOUND',
          timestamp: new Date().toISOString(),
        });
      }

      // Get live attendance
      const attendanceSessions = await prisma.attendanceSession.findMany({
        where: { sessionId },
        include: { student: { include: { user: true } } },
        orderBy: { sessionStartTime: 'desc' },
      });

      // Get enrolled count
      const enrolledCount = await prisma.enrollment.count({
        where: { courseId: session.courseId },
      });

      const formattedAttendance = attendanceSessions.map((att) => ({
        id: att.id,
        studentId: att.student.id,
        name: att.student.user.email.split('@')[0],
        fullName: att.student.name,
        rollNumber: att.student.rollNumber,
        status: att.sessionStatus === 'ACTIVE' ? 'present' : 'ended',
        duration: att.totalDurationSeconds || 0,
        lastPing: att.lastPingTime ? att.lastPingTime.toISOString() : null,
        sessionStartTime: att.sessionStartTime.toISOString(),
      }));

      res.status(200).json({
        status: 'success',
        message: 'Live attendance fetched',
        data: {
          session: {
            id: session.id,
            courseName: session.course.name,
            sessionStartTime: session.scheduledStartTime.toISOString(),
            sessionStatus: session.sessionStatus,
            enrolledCount,
            presentCount: formattedAttendance.filter(a => a.status === 'present').length,
          },
          attendance: formattedAttendance,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in GET /sessions/:sessionId/live:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch live attendance',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/sessions/:sessionId/report
 * Get attendance report for ended session (Professor only)
 */
router.get(
  '/:sessionId/report',
  authenticateToken,
  authorizeRole(['PROFESSOR']),
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.userId;

      // Get professor
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

      // Get session
      const session = await prisma.session.findFirst({
        where: {
          id: sessionId,
          course: { professorId: professor.id },
        },
        include: { course: true },
      });

      if (!session) {
        return res.status(404).json({
          status: 'error',
          message: 'Session not found',
          error: 'NOT_FOUND',
          timestamp: new Date().toISOString(),
        });
      }

      // Get enrollment count
      const totalEnrolled = await prisma.enrollment.count({
        where: { courseId: session.courseId },
      });

      // Get attendance data
      const attendanceSessions = await prisma.attendanceSession.findMany({
        where: { sessionId },
        include: { student: { include: { user: true } } },
      });

      // Calculate session duration using actualEndTime if available
      const endTime = session.actualEndTime || session.scheduledEndTime;
      const startTime = session.scheduledStartTime;
      
      const sessionDurationSeconds = endTime && startTime
        ? Math.floor((new Date(endTime) - new Date(startTime)) / 1000)
        : 0;

      // Threshold: 65% of session duration
      const attendanceThresholdSeconds = sessionDurationSeconds > 0 
        ? Math.ceil(sessionDurationSeconds * 0.65)
        : 0;

      // Count as attended only if duration >= 65% of session
      const attendanceStatusWithThreshold = attendanceSessions.map(att => ({
        ...att,
        isPresent: att.totalDurationSeconds > 0 && att.totalDurationSeconds >= attendanceThresholdSeconds
      }));

      const attended = attendanceStatusWithThreshold.filter(s => s.isPresent).length;
      const absent = totalEnrolled - attended;

      // Calculate durations from students who met threshold (attended)
      const attendedStudents = attendanceStatusWithThreshold.filter(s => s.isPresent);
      const durations = attendedStudents.map((s) => s.totalDurationSeconds);
      const averageDuration =
        durations.length > 0
          ? Math.round(
              durations.reduce((a, b) => a + b, 0) / durations.length
            )
          : 0;
      const shortestDuration =
        durations.length > 0 ? Math.min(...durations) : 0;
      const longestDuration =
        durations.length > 0 ? Math.max(...durations) : 0;

      const students = attendanceStatusWithThreshold.map((att) => ({
        studentId: att.student.id,
        name: att.student.user.email.split('@')[0],
        rollNumber: att.student.rollNumber,
        attended: att.isPresent,
        durationSeconds: att.totalDurationSeconds,
        attendancePercentage: sessionDurationSeconds > 0 
          ? Math.round((att.totalDurationSeconds / sessionDurationSeconds) * 100)
          : 0,
        isAboveThreshold: att.isPresent,
      }));

      const attendancePercentage =
        totalEnrolled > 0
          ? Math.round((attended / totalEnrolled) * 100 * 100) / 100
          : 0;

      res.status(200).json({
        status: 'success',
        message: 'Report generated',
        data: {
          session: {
            id: session.id,
            courseName: session.course.name,
            sessionStartTime: session.scheduledStartTime,
            sessionEndTime: session.actualEndTime || session.scheduledEndTime,
          },
          report: {
            totalEnrolled,
            attended,
            absent,
            attendancePercentage,
            averageDuration,
            shortestDuration,
            longestDuration,
            students,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in GET /sessions/:sessionId/report:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate report',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/sessions/active
 * Get currently active session for professor (if any) with full attendance data
 */
router.get('/active', authenticateToken, authorizeRole(['PROFESSOR']), async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get professor
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

    // Find active session for this professor's courses
    const activeSession = await prisma.session.findFirst({
      where: {
        course: { professorId: professor.id },
        sessionStatus: 'ACTIVE',
      },
      include: {
        course: true,
      },
    });

    if (!activeSession) {
      return res.status(404).json({
        status: 'error',
        message: 'No active session',
        error: 'NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    // Get all enrolled students
    const enrolledStudents = await prisma.enrollment.findMany({
      where: { courseId: activeSession.courseId },
      include: { student: { include: { user: true } } },
    });

    // Get students with active attendance in this session
    const attendanceSessions = await prisma.attendanceSession.findMany({
      where: { sessionId: activeSession.id },
      include: { student: { include: { user: true } } },
    });

    const attendanceMap = new Map();
    attendanceSessions.forEach(att => {
      attendanceMap.set(att.student.id, {
        studentId: att.student.id,
        name: att.student.user.email.split('@')[0],
        fullName: att.student.name,
        rollNumber: att.student.rollNumber,
        status: att.sessionStatus === 'ACTIVE' ? 'present' : 'ended',
        duration: att.totalDurationSeconds || 0,
        lastPing: att.lastPingTime,
      });
    });

    // Build full attendance list (enrolled + present)
    const attendance = enrolledStudents.map(enrollment => {
      const student = enrollment.student;
      if (attendanceMap.has(student.id)) {
        return attendanceMap.get(student.id);
      } else {
        return {
          studentId: student.id,
          name: student.user.email.split('@')[0],
          fullName: student.name,
          rollNumber: student.rollNumber,
          status: 'absent',
          duration: 0,
          lastPing: null,
        };
      }
    });

    const presentCount = attendance.filter(s => s.status === 'present').length;

    res.status(200).json({
      status: 'success',
      message: 'Active session found',
      data: {
        id: activeSession.id,
        courseId: activeSession.courseId,
        courseName: activeSession.course.name,
        sessionStartTime: activeSession.scheduledStartTime.toISOString(),
        sessionEndTime: activeSession.scheduledEndTime.toISOString(),
        sessionStatus: activeSession.sessionStatus,
        enrolledCount: enrolledStudents.length,
        presentCount,
        absentCount: enrolledStudents.length - presentCount,
        attendance,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /sessions/active:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch active session',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/sessions/history
 * Get all sessions (active and completed) for professor's courses
 */
router.get('/history', authenticateToken, authorizeRole(['PROFESSOR']), async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get professor
    const professor = await prisma.professor.findUnique({
      where: { userId },
      include: { courses: true },
    });

    if (!professor) {
      return res.status(404).json({
        status: 'error',
        message: 'Professor profile not found',
        error: 'PROFESSOR_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    const courseIds = professor.courses.map(c => c.id);

    // Get all sessions
    const sessions = await prisma.session.findMany({
      where: {
        courseId: { in: courseIds },
      },
      include: {
        course: true,
        _count: { select: { attendanceSessions: true } },
      },
      orderBy: { scheduledStartTime: 'desc' },
    });

    const formattedSessions = sessions.map(session => ({
      id: session.id,
      courseName: session.course.name,
      courseCode: session.course.code,
      sessionStartTime: session.scheduledStartTime.toISOString(),
      sessionEndTime: session.scheduledEndTime?.toISOString() || null,
      status: session.sessionStatus,
      studentCount: session._count.attendanceSessions,
    }));

    res.status(200).json({
      status: 'success',
      message: 'Session history fetched',
      data: {
        sessions: formattedSessions,
        total: formattedSessions.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /sessions/history:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch session history',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * DEBUG ENDPOINT: GET /api/sessions/debug/db-state?courseId=xxx
 * View current session states in database (for debugging stale sessions)
 * DO NOT USE IN PRODUCTION
 */
router.get('/debug/db-state', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({
        status: 'error',
        message: 'courseId query parameter is required',
      });
    }

    // Get all sessions for this course
    const sessions = await prisma.session.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { name: true } },
        attendanceSessions: {
          select: {
            id: true,
            studentId: true,
            sessionStatus: true,
            sessionStartTime: true,
            totalDurationSeconds: true,
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Database state for course',
      data: {
        courseId,
        sessionsFound: sessions.length,
        sessions: sessions.map((s) => ({
          id: s.id,
          courseName: s.course.name,
          sessionStatus: s.sessionStatus,
          scheduledStartTime: s.scheduledStartTime,
          scheduledEndTime: s.scheduledEndTime,
          actualEndTime: s.actualEndTime,
          createdAt: s.createdAt,
          attendanceCount: s.attendanceSessions.length,
          attendanceSessions: s.attendanceSessions.map((a) => ({
            id: a.id,
            studentId: a.studentId,
            status: a.sessionStatus,
            startTime: a.sessionStartTime,
            duration: a.totalDurationSeconds,
          })),
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /debug/db-state:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch debug info',
      error: error.message,
    });
  }
});

/**
 * DEBUG ENDPOINT: POST /api/sessions/debug/cleanup
 * DANGEROUS: Clears all ACTIVE sessions and attendance from database
 * Only for testing/development - IRREVERSIBLE
 */
router.post('/debug/cleanup', authenticateToken, async (req, res) => {
  try {
    console.log('🧹 CLEANUP: Starting database cleanup...');

    // Count before cleanup
    const activeSessions = await prisma.session.count({
      where: { sessionStatus: 'ACTIVE' },
    });

    const activeAttendance = await prisma.attendanceSession.count({
      where: { sessionStatus: 'ACTIVE' },
    });

    console.log(`🧹 CLEANUP: Found ${activeSessions} ACTIVE sessions and ${activeAttendance} ACTIVE attendance records`);

    // End all ACTIVE attendance sessions
    const attendanceUpdated = await prisma.attendanceSession.updateMany({
      where: { sessionStatus: 'ACTIVE' },
      data: { sessionStatus: 'ENDED' },
    });

    // Complete all ACTIVE sessions
    const sessionsUpdated = await prisma.session.updateMany({
      where: { sessionStatus: 'ACTIVE' },
      data: { 
        sessionStatus: 'COMPLETED',
        actualEndTime: new Date(),
      },
    });

    console.log(`✅ CLEANUP: Updated ${sessionsUpdated.count} sessions and ${attendanceUpdated.count} attendance records`);

    res.status(200).json({
      status: 'success',
      message: 'Database cleanup completed',
      data: {
        sessionsCompleted: sessionsUpdated.count,
        attendanceEnded: attendanceUpdated.count,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in POST /debug/cleanup:', error);
    res.status(500).json({
      status: 'error',
      message: 'Cleanup failed',
      error: error.message,
    });
  }
});

/**
 * DEBUG ENDPOINT: GET /api/sessions/debug/cleanup-confirm
 * Shows what WILL be cleaned up without making changes
 */
router.get('/debug/cleanup-confirm', authenticateToken, async (req, res) => {
  try {
    const activeSessions = await prisma.session.findMany({
      where: { sessionStatus: 'ACTIVE' },
      include: {
        course: { select: { name: true } },
        attendanceSessions: {
          select: {
            id: true,
            studentId: true,
            sessionStatus: true,
          },
        },
      },
    });

    const activeAttendance = await prisma.attendanceSession.count({
      where: { sessionStatus: 'ACTIVE' },
    });

    res.status(200).json({
      status: 'success',
      message: 'Preview of what will be cleaned up',
      data: {
        activeSessions: activeSessions.length,
        activeAttendanceRecords: activeAttendance,
        sessions: activeSessions.map((s) => ({
          id: s.id,
          course: s.course.name,
          created: s.createdAt,
          attendance: s.attendanceSessions.length,
        })),
      },
      warning: 'POST to /debug/cleanup to apply changes (IRREVERSIBLE)',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /debug/cleanup-confirm:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch cleanup preview',
      error: error.message,
    });
  }
});

module.exports = router;
