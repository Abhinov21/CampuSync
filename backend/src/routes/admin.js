/**
 * Admin Routes
 * GET /api/admin/sessions/active - Get all active sessions
 * GET /api/admin/mqtt-logs - Get MQTT event logs
 * GET /api/admin/anomalies - Get detected anomalies
 * GET /api/admin/devices - Get device registry
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticateToken = require('../utils/auth').authenticateToken;
const authorizeAdmin = require('../utils/auth').authorizeAdmin;

/**
 * GET /api/admin/sessions/active
 * Get all currently active sessions across system
 */
router.get(
  '/sessions/active',
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      // Get all active sessions
      const activeSessions = await prisma.session.findMany({
        where: { sessionStatus: 'ACTIVE' },
        include: {
          course: { include: { professor: { include: { user: true } } } },
          attendanceSessions: {
            where: { sessionStatus: 'ACTIVE' },
          },
        },
      });

      const formattedSessions = await Promise.all(
        activeSessions.map(async (session) => {
          const totalEnrolled = await prisma.enrollment.count({
            where: { courseId: session.courseId },
          });

          const presentCount = session.attendanceSessions.filter(
            (s) => s.sessionStatus === 'ACTIVE'
          ).length;

          return {
            id: session.id,
            courseId: session.courseId,
            courseName: session.course.name,
            professorName: session.course.professor.user.email.split('@')[0],
            sessionStartTime: session.scheduledStartTime.toISOString(),
            enrolledStudents: totalEnrolled,
            presentCount,
            absentCount: totalEnrolled - presentCount,
          };
        })
      );

      res.status(200).json({
        status: 'success',
        message: 'Active sessions fetched',
        sessions: formattedSessions,
        total: formattedSessions.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in GET /admin/sessions/active:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch active sessions',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/admin/mqtt-logs
 * Get MQTT event logs with pagination
 */
router.get(
  '/mqtt-logs',
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 100, 500);
      const offset = parseInt(req.query.offset) || 0;

      const total = await prisma.mQTTEventLog.count();

      const logs = await prisma.mQTTEventLog.findMany({
        include: {
          device: {
            include: { student: { include: { user: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      });

      const formattedLogs = logs.map((log) => ({
        id: log.id,
        deviceId: log.device.deviceId,
        eventType: log.eventType,
        studentId: log.device.student?.id || null,
        studentName: log.device.student?.user.email || 'N/A',
        confidence: (log.payload?.confidence || 0),
        timestamp: log.createdAt.toISOString(),
        createdAt: log.createdAt.toISOString(),
        processed: log.status === 'processed',
      }));

      res.status(200).json({
        status: 'success',
        message: 'MQTT logs fetched',
        logs: formattedLogs,
        total,
        limit,
        offset,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in GET /admin/mqtt-logs:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch MQTT logs',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/admin/anomalies
 * Get detected anomalies with pagination
 */
router.get(
  '/anomalies',
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 50, 500);
      const offset = parseInt(req.query.offset) || 0;
      const severity = req.query.severity; // Optional filter: LOW, MEDIUM, HIGH

      const where = severity ? { severity } : {};

      const total = await prisma.anomalyLog.count({ where });

      const anomalies = await prisma.anomalyLog.findMany({
        where,
        include: {
          device: true,
          student: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      });

      const formattedAnomalies = anomalies.map((anom) => ({
        id: anom.id,
        type: anom.anomalyType,
        severity: anom.severity,
        description: anom.description,
        deviceId: anom.device?.deviceId || null,
        studentId: anom.student?.id || null,
        studentName: anom.student?.user.email || 'N/A',
        timestamp: anom.createdAt,
      }));

      res.status(200).json({
        status: 'success',
        message: 'Anomalies fetched',
        anomalies: formattedAnomalies,
        total,
        limit,
        offset,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in GET /admin/anomalies:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch anomalies',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/admin/devices
 * Get all devices in system
 */
router.get(
  '/devices',
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 100, 500);
      const offset = parseInt(req.query.offset) || 0;

      const total = await prisma.device.count();

      const devices = await prisma.device.findMany({
        include: {
          student: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      });

      const formattedDevices = devices.map((device) => ({
        id: device.id,
        deviceId: device.deviceId,
        status: device.isActive ? 'ACTIVE' : 'INACTIVE',
        studentId: device.student?.id || null,
        studentName: device.student?.user.email || 'Unassigned',
        batteryLevel: 85, // Mock value - would come from actual device
        lastPingTime: new Date(), // Mock value
        createdAt: device.createdAt,
      }));

      res.status(200).json({
        status: 'success',
        message: 'Devices fetched',
        devices: formattedDevices,
        total,
        limit,
        offset,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in GET /admin/devices:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch devices',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/admin/analytics/overview
 * Get analytics overview with stats
 */
router.get(
  '/analytics/overview',
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 999999; // Default to all time
      const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Total sessions
      const totalSessions = await prisma.session.count({
        where: {
          createdAt: { gte: daysAgo },
        },
      });

      // Total students
      const totalStudents = await prisma.student.count();

      // Total attendance records
      const totalAttendanceRecords = await prisma.attendanceSession.count({
        where: {
          createdAt: { gte: daysAgo },
        },
      });

      // Active courses
      const activeCourses = await prisma.course.count({
        where: {
          sessions: {
            some: {
              createdAt: { gte: daysAgo },
            },
          },
        },
      });

      // Average attendance percentage
      const attendanceSessions = await prisma.attendanceSession.findMany({
        where: {
          createdAt: { gte: daysAgo },
        },
      });

      const averageAttendance =
        attendanceSessions.length > 0
          ? Math.round(
              (attendanceSessions.filter((a) => a.sessionStatus === 'COMPLETED').length /
                attendanceSessions.length) *
                100
            )
          : 0;

      // Average duration
      const sessions = await prisma.session.findMany({
        where: { createdAt: { gte: daysAgo } },
      });

      let averageDuration = 0;
      if (sessions.length > 0) {
        const totalDuration = sessions.reduce((sum, session) => {
          if (session.scheduledStartTime && session.actualEndTime) {
            return (
              sum +
              (new Date(session.actualEndTime) -
                new Date(session.scheduledStartTime)) /
                (1000 * 60)
            ); // minutes
          }
          return sum;
        }, 0);
        averageDuration = Math.round(totalDuration / sessions.length);
      }

      res.status(200).json({
        status: 'success',
        message: 'Analytics overview fetched',
        stats: {
          totalSessions,
          totalStudents,
          averageAttendance,
          averageDuration,
          activeCourses,
          totalAttendanceRecords,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in GET /admin/analytics/overview:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch analytics overview',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/admin/system-status
 * Get overall system status
 */
router.get(
  '/system-status',
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const activeSessions = await prisma.session.count({
        where: { sessionStatus: 'ACTIVE' },
      });

      const totalStudents = await prisma.student.count();
      const totalDevices = await prisma.device.count();
      const activeDevices = await prisma.device.count({
        where: { isActive: true },
      });

      const recentAnomalies = await prisma.anomalyLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'System status fetched',
        data: {
          activeSessions,
          totalStudents,
          totalDevices,
          activeDevices,
          recentAnomalies24h: recentAnomalies,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in GET /admin/system-status:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch system status',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/admin/analytics/overview
 * Get analytics summary for admin dashboard
 */
router.get(
  '/analytics/overview',
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const days = Math.min(parseInt(req.query.days) || 7,  90);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get stats
      const totalSessions = await prisma.session.count();
      const activeSessions = await prisma.session.count({
        where: { sessionStatus: 'ACTIVE' },
      });

      const completedSessions = await prisma.session.count({
        where: { sessionStatus: 'COMPLETED', actualEndTime: { gte: startDate } },
      });

      const totalAttendanceRecords = await prisma.attendanceSession.count();
      const avgDuration = await prisma.attendanceSession.aggregate({
        _avg: { totalDurationSeconds: true },
      });

      const totalStudents = await prisma.student.count();
      const totalDevices = await prisma.device.count();

      res.status(200).json({
        status: 'success',
        stats: {
          totalSessions,
          activeSessions,
          completedSessions,
          totalAttendanceRecords,
          averageDurationSeconds: Math.round(avgDuration._avg.totalDurationSeconds || 0),
          totalStudents,
          totalDevices,
          dateRange: days,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in GET /admin/analytics/overview:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch analytics',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/admin/students
 * Get list of all students
 */
router.get(
  '/students',
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const students = await prisma.student.findMany({
        include: {
          user: true,
          device: true,
          enrollments: { include: { course: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = students.map(s => ({
        id: s.id,
        userId: s.userId,
        name: s.name,
        email: s.user.email,
        rollNumber: s.rollNumber,
        department: s.department,
        year: s.year,
        device: s.device ? {
          id: s.device.id,
          deviceId: s.device.deviceId,
          status: s.device.deviceStatus,
        } : null,
        enrollmentCount: s.enrollments.length,
      }));

      res.status(200).json({
        status: 'success',
        data: formatted,
        total: formatted.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in GET /admin/students:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch students',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

module.exports = router;
