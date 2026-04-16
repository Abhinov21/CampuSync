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
 * GET /api/sessions/debug/auth-info
 * Debug endpoint to verify authentication and authorization
 */
router.get('/debug/auth-info', authenticateToken, async (req, res) => {
  try {
    // Verify user exists AND what their role is in the database
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        student: {
          select: { id: true, name: true, rollNumber: true }
        },
        professor: {
          select: { id: true, name: true, employeeId: true }
        },
        admin: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(200).json({
      status: 'info',
      message: 'Authentication debug info',
      data: {
        tokenInfo: {
          userId: req.user?.userId,
          tokenRole: req.user?.role,
          email: req.user?.email,
        },
        databaseInfo: {
          userExists: !!user,
          databaseRole: user?.role,
          email: user?.email,
          hasStudentProfile: !!user?.student,
          hasProfessorProfile: !!user?.professor,
          hasAdminProfile: !!user?.admin,
          studentProfile: user?.student || null,
          professorProfile: user?.professor || null,
          adminProfile: user?.admin || null,
        },
        roleMatch: {
          tokenRoleMatchesDatabaseRole: req.user?.role === user?.role,
          issue: req.user?.role !== user?.role ? `TOKEN HAS ROLE="${req.user?.role}" BUT DATABASE HAS ROLE="${user?.role}"` : null,
        }
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch auth info',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

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

      console.log('🔍 DEBUG: End session request');
      console.log('  Session ID:', sessionId);
      console.log('  User ID:', userId);
      console.log('  User Role:', req.user.role);
      console.log('  Full User Object:', req.user);

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
      
      // CRITICAL: Update all attendance sessions to ENDED when session ends
      // This ensures students' sessions stop showing as active
      await prisma.attendanceSession.updateMany({
        where: { sessionId },
        data: {
          sessionStatus: 'ENDED',
          sessionEndTime: endTime,
        },
      });

      console.log('✅ Updated all AttendanceSession records to ENDED');

      // Now update the main session
      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: {
          sessionStatus: 'COMPLETED',
          actualEndTime: endTime,
        },
      });

      // Get all attendance data for response
      const attendanceSessions = await prisma.attendanceSession.findMany({
        where: { sessionId },
        include: { student: { include: { user: true } } },
      });

      const studentAttendance = attendanceSessions.map((att) => ({
        studentId: att.student.id,
        name: att.student.user.email.split('@')[0],
        attended: att.sessionStatus === 'ENDED' || att.sessionStatus === 'ACTIVE',
        durationSeconds: att.totalDurationSeconds,
        attendancePercentage: 100, // Will be calculated by frontend
      }));

      // 🔔 CRITICAL: Notify all students that session has ended via WebSocket
      if (req.app.locals.wsService) {
        req.app.locals.wsService.emitSessionEnded(sessionId, {
          courseId: updatedSession.courseId,
          courseName: session.course.name,
          totalStudents: attendanceSessions.length,
          presentCount: attendanceSessions.length,
        });
        console.log('📢 WebSocket event sent: session-ended to all students');
      }

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

      const formattedAttendance = attendanceSessions.map((att) => ({
        id: att.id,
        studentId: att.student.id,
        student: {
          name: att.student.user.email.split('@')[0],
          rollNumber: att.student.rollNumber,
        },
        sessionStartTime: att.sessionStartTime,
        totalDurationSeconds: att.totalDurationSeconds,
        lastPingTime: att.lastPingTime,
        status: att.sessionStatus,
      }));

      res.status(200).json({
        status: 'success',
        message: 'Live attendance fetched',
        data: {
          session: {
            id: session.id,
            courseName: session.course.name,
            sessionStartTime: session.scheduledStartTime,
            sessionStatus: session.sessionStatus,
          },
          attendanceSessions: formattedAttendance,
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

      const attended = attendanceSessions.filter(
        (s) => s.sessionStatus === 'ENDED' || s.sessionStatus === 'ACTIVE'
      ).length;
      const absent = totalEnrolled - attended;

      const durations = attendanceSessions.map((s) => s.totalDurationSeconds);
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

      const students = attendanceSessions.map((att) => ({
        studentId: att.student.id,
        name: att.student.user.email.split('@')[0],
        rollNumber: att.student.rollNumber,
        attended: att.sessionStatus === 'ENDED' || att.sessionStatus === 'ACTIVE',
        durationSeconds: att.totalDurationSeconds,
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
 * GET /api/sessions/:sessionId/check-valid
 * Check if session is still valid and not timed out
 * Auto-ends sessions that exceeded their end time
 */
router.get('/:sessionId/check-valid', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log('🔍 Checking session validity:', sessionId);

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
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

    const now = new Date();
    const isExpired = session.scheduledEndTime && now > session.scheduledEndTime;
    
    // AUTO-TIMEOUT: If session exceeded end time and still ACTIVE, mark it COMPLETED
    if (isExpired && session.sessionStatus === 'ACTIVE') {
      console.log('⏰ AUTO-TIMEOUT: Session exceeded end time, marking COMPLETED');
      console.log('   Session End Time:', session.scheduledEndTime);
      console.log('   Current Time:', now);
      
      // Update session status
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          sessionStatus: 'COMPLETED',
          actualEndTime: now,
        },
      });

      // Update all attendance sessions to ENDED
      await prisma.attendanceSession.updateMany({
        where: { sessionId },
        data: {
          sessionStatus: 'ENDED',
          sessionEndTime: now,
        },
      });

      console.log('✅ Auto-ended session and all attendance records');
    }

    res.status(200).json({
      status: 'success',
      message: 'Session validity check',
      data: {
        sessionId,
        isValid: !isExpired,
        isExpired,
        sessionStatus: session.sessionStatus,
        scheduledEndTime: session.scheduledEndTime,
        currentTime: now,
        minutesRemaining: isExpired ? 0 : Math.floor((session.scheduledEndTime - now) / 60000),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /sessions/:sessionId/check-valid:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check session validity',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/sessions/cleanup/auto
 * Remove all expired/orphaned sessions older than 24 hours
 * Called periodically or on demand
 */
router.get('/cleanup/auto', authenticateToken, async (req, res) => {
  try {
    console.log('🧹 Running session cleanup...');
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Find old COMPLETED sessions
    const oldSessions = await prisma.session.findMany({
      where: {
        sessionStatus: 'COMPLETED',
        actualEndTime: { lt: oneDayAgo },
      },
    });

    console.log(`Found ${oldSessions.length} old completed sessions to archive`);

    // Archive metrics but keep for reporting
    // In production: could archive to separate table
    // For now: just mark as observation
    
    res.status(200).json({
      status: 'success',
      message: 'Cleanup completed',
      data: {
        cleanedSessions: oldSessions.length,
        lastCleanedTime: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /sessions/cleanup/auto:', error);
    res.status(500).json({
      status: 'error',
      message: 'Cleanup failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Get ALL currently active sessions for professor
 * IMPORTANT: This lets professor see all their running sessions
 */
router.get('/all-active', authenticateToken, authorizeRole(['PROFESSOR']), async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('📊 GET /sessions/all-active - Fetching for professor:', userId);

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

    // Find ALL active sessions for this professor's courses
    const activeSessions = await prisma.session.findMany({
      where: {
        course: { professorId: professor.id },
        sessionStatus: 'ACTIVE',
      },
      include: {
        course: true,
      },
      orderBy: {
        scheduledStartTime: 'desc',
      },
    });

    console.log(`✅ Found ${activeSessions.length} active sessions for professor`);

    // Get student count for each session
    const sessionsWithCounts = await Promise.all(
      activeSessions.map(async (session) => {
        const studentCount = await prisma.attendanceSession.count({
          where: { sessionId: session.id },
        });
        return {
          id: session.id,
          courseId: session.courseId,
          courseName: session.course.name,
          courseCode: session.course.code,
          sessionStartTime: session.scheduledStartTime,
          sessionEndTime: session.scheduledEndTime,
          sessionStatus: session.sessionStatus,
          studentCount,
          actualStartTime: session.actualStartTime,
        };
      })
    );

    res.status(200).json({
      status: 'success',
      message: activeSessions.length > 0 ? 'Active sessions found' : 'No active sessions',
      data: {
        sessions: sessionsWithCounts,
        total: sessionsWithCounts.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /sessions/all-active:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch active sessions',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/sessions/active
 * Get currently active session for professor (if any)
 * Returns the most recent active session
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

    // Find MOST RECENT active session for this professor's courses
    const activeSession = await prisma.session.findFirst({
      where: {
        course: { professorId: professor.id },
        sessionStatus: 'ACTIVE',
      },
      include: {
        course: true,
      },
      orderBy: {
        scheduledStartTime: 'desc',
      },
    });

    if (!activeSession) {
      console.log('ℹ️ No active session for professor:', userId);
      return res.status(404).json({
        status: 'error',
        message: 'No active session',
        error: 'NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    // Get student counts
    const presentCount = await prisma.attendanceSession.count({
      where: { sessionId: activeSession.id },
    });

    // Get total enrolled students in the course
    const enrolledCount = await prisma.enrollment.count({
      where: { courseId: activeSession.courseId },
    });

    const absentCount = Math.max(0, enrolledCount - presentCount);

    console.log('✅ Found active session:', activeSession.id, 'Present:', presentCount, 'Enrolled:', enrolledCount, 'Absent:', absentCount);

    res.status(200).json({
      status: 'success',
      message: 'Active session found',
      data: {
        id: activeSession.id,
        courseId: activeSession.courseId,
        courseName: activeSession.course.name,
        scheduledStartTime: activeSession.scheduledStartTime,
        scheduledEndTime: activeSession.scheduledEndTime,
        sessionStatus: activeSession.sessionStatus,
        presentCount,
        enrolledCount,
        absentCount,
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

module.exports = router;
