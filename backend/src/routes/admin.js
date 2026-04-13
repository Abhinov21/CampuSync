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
            sessionStartTime: session.scheduledStartTime,
            enrolledStudents: totalEnrolled,
            presentCount,
            absentCount: totalEnrolled - presentCount,
          };
        })
      );

      res.status(200).json({
        status: 'success',
        message: 'Active sessions fetched',
        data: {
          activeSessions: formattedSessions,
          total: formattedSessions.length,
        },
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
        timestamp: log.createdAt,
        processed: log.status === 'processed',
      }));

      res.status(200).json({
        status: 'success',
        message: 'MQTT logs fetched',
        data: {
          logs: formattedLogs,
          total,
          limit,
          offset,
        },
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
        data: {
          anomalies: formattedAnomalies,
          total,
          limit,
          offset,
        },
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
        data: {
          devices: formattedDevices,
          total,
          limit,
          offset,
        },
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

module.exports = router;
