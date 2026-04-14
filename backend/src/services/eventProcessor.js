/**
 * Event Processor Service
 * Handles MQTT events and manages session lifecycle
 *
 * Responsibilities:
 * - Parse and validate MQTT payloads
 * - Route events to correct handler (AUTH, PING, RECHECK_OK, SESSION_END)
 * - Manage session lifecycle with timeout logic
 * - Create attendance records in database
 * - Log anomalies and suspicious activity
 * - Set/reset 30-second PING timeout
 *
 * Session Lifecycle:
 * No Session → AUTH → ACTIVE SESSION ← PING/RECHECK_OK → SESSION_END or TIMEOUT
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// In-memory store for active sessions and timeouts
// Key: deviceId, Value: { sessionId, studentId, sessionStartTime, lastPingTime, timeoutHandler }
const activeSessions = new Map();

class EventProcessor {
  constructor() {
    this.sessionTimeout = 30000; // 30 seconds in milliseconds
    this.wsService = null; // Will be set by server.js
  }

  /**
   * Set WebSocket service for real-time updates
   */
  setWebSocketService(wsService) {
    this.wsService = wsService;
    console.log('✅ WebSocket service attached to event processor');
  }

  /**
   * Main entry point - route incoming MQTT event to appropriate handler
   */
  async processEvent(payload) {
    console.log("📨 Processing MQTT event:", payload);

    try {
      // Validate basic structure
      if (!payload.type || !payload.device) {
        await this.logAnomaly("INVALID_PAYLOAD", payload, "Missing type or device field");
        return;
      }

      // Log raw MQTT event
      await this.logMQTTEvent(payload);

      // Validate device exists
      const device = await prisma.device.findUnique({
        where: { deviceId: payload.device },
        include: { student: true },
      });

      if (!device) {
        await this.logAnomaly("UNKNOWN_DEVICE", payload, `Device ${payload.device} not found in database`);
        return;
      }

      // Validate device is bound to a student
      if (!device.studentId) {
        await this.logAnomaly("UNBOUND_DEVICE", payload, `Device ${payload.device} not bound to any student`);
        return;
      }

      // Route to appropriate event handler
      switch (payload.type.toLowerCase()) {
        case "auth":
          await this.handleAuthEvent(payload, device);
          break;
        case "ping":
          await this.handlePingEvent(payload, device);
          break;
        case "recheck_ok":
          await this.handleRecheckEvent(payload, device);
          break;
        case "session_end":
          await this.handleSessionEndEvent(payload, device);
          break;
        default:
          await this.logAnomaly("UNKNOWN_EVENT_TYPE", payload, `Unknown event type: ${payload.type}`);
      }
    } catch (error) {
      console.error("❌ Error processing MQTT event:", error);
      await this.logAnomaly("PROCESSOR_ERROR", payload, `Event processing failed: ${error.message}`);
    }
  }

  /**
   * Handle AUTH event - Student's biometric matched, session starts
   */
  async handleAuthEvent(payload, device) {
    const deviceId = payload.device;
    const studentId = device.studentId;
    const confidence = payload.confidence || 0;

    console.log(`🔐 AUTH Event: Device ${deviceId}, Student ${studentId}, Confidence: ${confidence}%`);

    try {
      // Check if session already active for this device
      if (activeSessions.has(deviceId)) {
        await this.logAnomaly(
          "DUPLICATE_AUTH",
          payload,
          `Duplicate AUTH: Device ${deviceId} already has active session`
        );
        console.log("⚠️  Duplicate AUTH event for device", deviceId);
        return;
      }

      // Find current active session (class period)
      const currentSession = await this.findCurrentSessionForStudent(studentId);

      if (!currentSession) {
        await this.logAnomaly(
          "NO_ACTIVE_SESSION",
          payload,
          `Student ${studentId} has no active class session`
        );
        console.log("⚠️  No active class session for student", studentId);
        return;
      }

      // Check if already attended this session
      const existingAttendance = await prisma.attendanceSession.findFirst({
        where: {
          studentId,
          sessionId: currentSession.id,
        },
      });

      if (existingAttendance && existingAttendance.status === "PRESENT") {
        await this.logAnomaly(
          "DUPLICATE_ATTENDANCE",
          payload,
          `Student ${studentId} already marked present in session ${currentSession.id}`
        );
        console.log(
          "⚠️  Student already marked present in this session"
        );
        return;
      }

      // Create attendance session 
      const existingRec = await prisma.attendanceSession.findFirst({
        where: {
          studentId,
          sessionId: currentSession.id,
        },
      });

      let attendanceSession;
      if (existingRec) {
        attendanceSession = await prisma.attendanceSession.update({
          where: { id: existingRec.id },
          data: {
            sessionStatus: "ACTIVE",
            sessionStartTime: new Date(),
          },
        });
      } else {
        attendanceSession = await prisma.attendanceSession.create({
          data: {
            studentId,
            sessionId: currentSession.id,
            deviceId: device.id,
            sessionStartTime: new Date(),
            sessionStatus: "ACTIVE",
          },
        });
      }

      // Create attendance record for AUTH event
      await this.recordAttendanceEvent(attendanceSession.id, "AUTH", payload, confidence);

      // Store in active sessions with timeout
      activeSessions.set(deviceId, {
        sessionId: attendanceSession.id,
        studentId,
        sessionStartTime: new Date(),
        lastPingTime: new Date(),
        timeoutHandler: null,
      });

      // Set ping timeout (will auto-end session if no PING in 30 seconds)
      this.setPingTimeout(deviceId, studentId, attendanceSession.id);

      // Emit WebSocket event - student joined
      if (this.wsService) {
        this.wsService.emitSessionCreated({
          sessionId: currentSession.id,
          studentId,
          studentName: device.student.name,
          courseId: currentSession.courseId,
          courseName: currentSession.course ? currentSession.course.name : 'Unknown Course'
        });
      }

      console.log(`✅ Session created for device ${deviceId}, student ${studentId}`);
    } catch (error) {
      console.error("❌ Error in handleAuthEvent:", error);
      await this.logAnomaly("AUTH_ERROR", payload, `Failed to create attendance session: ${error.message}`);
    }
  }

  /**
   * Handle PING event - Biometric verified again (presence confirmation)
   */
  async handlePingEvent(payload, device) {
    const deviceId = payload.device;
    const studentId = device.studentId;
    const timestamp = payload.ts || Math.floor(Date.now() / 1000);

    console.log(`📍PING Event: Device ${deviceId}, Timestamp: ${timestamp}`);

    try {
      // Check if device has active session
      const session = activeSessions.get(deviceId);

      if (!session) {
        await this.logAnomaly(
          "PING_WITHOUT_SESSION",
          payload,
          `PING received but no active session for device ${deviceId}`
        );
        console.log("⚠️  PING without active session");
        return;
      }

      // Update last ping time
      session.lastPingTime = new Date();

      // Create attendance record
      await this.recordAttendanceEvent(session.sessionId, "PING", payload, null);

      // Reset timeout
      this.setPingTimeout(deviceId, studentId, session.sessionId);

      // Emit WebSocket event - ping update
      if (this.wsService) {
        const attendanceSessions = await prisma.attendanceSession.findMany({
          where: {
            sessionId: session.sessionId,
            sessionStatus: { in: ['ACTIVE', 'INCOMPLETE'] }
          },
          include: {
            student: true
          }
        });

        const stats = attendanceSessions.map(as => ({
          studentId: as.studentId,
          studentName: as.student ? as.student.name : 'Unknown',
          durationSeconds: Math.floor((new Date() - as.sessionStartTime) / 1000),
          sessionStatus: as.sessionStatus,
          lastPingTime: session.lastPingTime
        }));

        this.wsService.emitPingUpdate(session.sessionId, stats);
      }

      console.log(`✅ PING processed for device ${deviceId}, timeout reset`);
    } catch (error) {
      console.error("❌ Error in handlePingEvent:", error);
      await this.logAnomaly("PING_ERROR", payload, `Failed to process PING: ${error.message}`);
    }
  }

  /**
   * Handle RECHECK_OK event - Re-verification successful
   */
  async handleRecheckEvent(payload, device) {
    const deviceId = payload.device;
    const studentId = device.studentId;

    console.log(`✔️ RECHECK_OK Event: Device ${deviceId}`);

    try {
      // Check if device has active session
      const session = activeSessions.get(deviceId);

      if (!session) {
        await this.logAnomaly(
          "RECHECK_WITHOUT_SESSION",
          payload,
          `RECHECK_OK received but no active session for device ${deviceId}`
        );
        console.log("⚠️  RECHECK_OK without active session");
        return;
      }

      // Create attendance record
      await this.recordAttendanceEvent(session.sessionId, "RECHECK_OK", payload, null);

      // Reset timeout
      this.setPingTimeout(deviceId, studentId, session.sessionId);

      console.log(`✅ RECHECK_OK processed for device ${deviceId}`);
    } catch (error) {
      console.error("❌ Error in handleRecheckEvent:", error);
      await this.logAnomaly("RECHECK_ERROR", payload, `Failed to process RECHECK_OK: ${error.message}`);
    }
  }

  /**
   * Handle SESSION_END event - Student removed wristband or class ended
   */
  async handleSessionEndEvent(payload, device) {
    const deviceId = payload.device;
    const studentId = device.studentId;

    console.log(`🔴 SESSION_END Event: Device ${deviceId}`);

    try {
      await this.endSession(deviceId, "USER_REQUEST", payload);
      console.log(`✅ Session ended by device ${deviceId}`);
    } catch (error) {
      console.error("❌ Error in handleSessionEndEvent:", error);
      await this.logAnomaly("SESSION_END_ERROR", payload, `Failed to end session: ${error.message}`);
    }
  }

  /**
   * Create an attendance record for a specific event
   */
  async recordAttendanceEvent(attendanceSessionId, eventType, payload, confidence = null) {
    try {
      // Get the attendance session to get studentId
      const session = await prisma.attendanceSession.findUnique({
        where: { id: attendanceSessionId },
      });

      if (!session) {
        console.error(`❌ Attendance session ${attendanceSessionId} not found`);
        return null;
      }

      // Map string event types to EventType enum values
      const eventTypeMap = {
        AUTH: 'AUTH',
        PING: 'PING',
        RECHECK_OK: 'RECHECK_OK',
        SESSION_END: 'SESSION_END',
      };

      const attendanceRecord = await prisma.attendanceRecord.create({
        data: {
          attendanceSessionId,
          studentId: session.studentId,
          eventType: eventTypeMap[eventType] || eventType,
          eventTimestamp: new Date(),
        },
      });

      console.log(`📝 Recorded ${eventType} event for session ${attendanceSessionId}`);
      return attendanceRecord;
    } catch (error) {
      console.error("❌ Error recording attendance event:", error);
      throw error;
    }
  }

  /**
   * Log raw MQTT event to database
   */
  async logMQTTEvent(payload) {
    try {
      // Get device to find deviceId
      const device = await prisma.device.findUnique({
        where: { deviceId: payload.device },
      });

      if (!device) {
        console.log(`⚠️  Cannot log MQTT event - device ${payload.device} not found`);
        return;
      }

      // Map event type
      const eventTypeMap = {
        auth: 'AUTH',
        ping: 'PING',
        recheck_ok: 'RECHECK_OK',
        session_end: 'SESSION_END',
      };

      await prisma.mQTTEventLog.create({
        data: {
          deviceId: device.id,
          eventType: eventTypeMap[payload.type?.toLowerCase()] || 'AUTH',
          payload: payload,
          processedAt: new Date(),
          status: 'processed',
        },
      });
    } catch (error) {
      console.error("❌ Error logging MQTT event:", error.message);
    }
  }

  /**
   * Log anomalies and suspicious activity
   */
  async logAnomaly(anomalyType, payload, description) {
    try {
      console.log(`⚠️  ANOMALY: ${anomalyType} - ${description}`);

      // Try to get device and student info
      let deviceId = null;
      let studentId = null;
      let studentName = null;
      let courseId = null;
      let courseName = null;

      if (payload.device) {
        const device = await prisma.device.findUnique({
          where: { deviceId: payload.device },
          include: { student: true }
        });
        deviceId = device?.id || null;
        studentId = device?.studentId || null;
        studentName = device?.student?.name || 'Unknown Student';

        // Try to get active session for course info
        if (studentId) {
          const activeSession = activeSessions.get(payload.device);
          if (activeSession) {
            const session = await prisma.session.findUnique({
              where: { id: activeSession.sessionId },
              include: { course: true }
            });
            if (session) {
              courseId = session.courseId;
              courseName = session.course?.name || 'Unknown Course';
            }
          }
        }
      }

      const anomaly = await prisma.anomalyLog.create({
        data: {
          anomalyType,
          description,
          severity: this.calculateSeverity(anomalyType),
          deviceId,
          studentId,
        },
      });

      // Emit WebSocket event - anomaly alert to admins
      if (this.wsService) {
        this.wsService.emitAnomalyAlert({
          id: anomaly.id,
          type: anomalyType,
          severity: anomaly.severity,
          description,
          studentId,
          studentName,
          courseId,
          courseName,
          timestamp: anomaly.createdAt
        });
      }
    } catch (error) {
      console.error("❌ Error logging anomaly:", error.message);
    }
  }

  /**
   * Calculate severity level for anomalies
   */
  calculateSeverity(anomalyType) {
    const severityMap = {
      INVALID_PAYLOAD: "LOW",
      UNKNOWN_DEVICE: "MEDIUM",
      UNBOUND_DEVICE: "MEDIUM",
      UNKNOWN_EVENT_TYPE: "LOW",
      DUPLICATE_AUTH: "MEDIUM",
      NO_ACTIVE_SESSION: "LOW",
      DUPLICATE_ATTENDANCE: "MEDIUM",
      PING_WITHOUT_SESSION: "MEDIUM",
      RECHECK_WITHOUT_SESSION: "MEDIUM",
      SESSION_TIMEOUT: "LOW",
      PROCESSOR_ERROR: "HIGH",
      AUTH_ERROR: "HIGH",
      PING_ERROR: "HIGH",
      RECHECK_ERROR: "HIGH",
      SESSION_END_ERROR: "HIGH",
    };

    return severityMap[anomalyType] || "MEDIUM";
  }

  /**
   * Set/reset 30-second PING timeout
   * If no PING received within 30 seconds, auto-end session
   */
  setPingTimeout(deviceId, studentId, attendanceSessionId) {
    const session = activeSessions.get(deviceId);

    if (!session) {
      console.log(`⚠️  Session not found for device ${deviceId}, cannot set timeout`);
      return;
    }

    // Clear existing timeout if any
    if (session.timeoutHandler) {
      clearTimeout(session.timeoutHandler);
    }

    // Set new timeout
    session.timeoutHandler = setTimeout(async () => {
      console.log(`⏱️  PING timeout for device ${deviceId} - auto-ending session`);

      try {
        await this.endSession(deviceId, "PING_TIMEOUT", {
          type: "timeout",
          device: deviceId,
        });
      } catch (error) {
        console.error(`❌ Error handling PING timeout for ${deviceId}:`, error);
      }
    }, this.sessionTimeout);

    console.log(`⏰ Timeout set for device ${deviceId} (${this.sessionTimeout}ms)`);
  }

  /**
   * End session - calculate duration and update database
   */
  async endSession(deviceId, endReason, payload) {
    try {
      const session = activeSessions.get(deviceId);

      if (!session) {
        console.log(`⚠️  Cannot end session - no active session for device ${deviceId}`);
        return;
      }

      // Clear timeout
      if (session.timeoutHandler) {
        clearTimeout(session.timeoutHandler);
      }

      // Calculate duration and update attendance session
      const endTime = new Date();
      const durationSeconds = Math.floor(
        (endTime - session.sessionStartTime) / 1000
      );

      const updatedSession = await prisma.attendanceSession.update({
        where: { id: session.sessionId },
        data: {
          sessionStatus: endReason === "PING_TIMEOUT" ? "INCOMPLETE" : "PRESENT",
          sessionEndTime: endTime,
          totalDurationSeconds: durationSeconds,
        },
        include: {
          student: true
        }
      });

      // Create final attendance record
      await this.recordAttendanceEvent(session.sessionId, "SESSION_END", payload, null);

      // Remove from active sessions
      activeSessions.delete(deviceId);

      const duration = updatedSession.totalDurationSeconds;
      console.log(
        `✅ Session ended: Device ${deviceId}, Duration: ${duration}s, Reason: ${endReason}`
      );

      // Emit WebSocket event - student session ended
      if (this.wsService && updatedSession.sessionId) {
        // Get session details for broadcast
        const classSession = await prisma.session.findUnique({
          where: { id: updatedSession.sessionId },
          include: { course: true }
        });

        if (classSession) {
          this.wsService.emitStudentSessionEnded(classSession.id, {
            studentId: session.studentId,
            studentName: updatedSession.student ? updatedSession.student.name : 'Unknown',
            totalDurationSeconds: durationSeconds,
            status: updatedSession.sessionStatus
          });
        }
      }

      return updatedSession;
    } catch (error) {
      console.error("❌ Error ending session:", error);
      throw error;
    }
  }

  /**
   * Find the current active class session for a student
   * Looks for sessions where NOW is between scheduledStartTime and scheduledEndTime
   */
  async findCurrentSessionForStudent(studentId) {
    try {
      const now = new Date();

      // Get courses the student is enrolled in
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId },
        select: { courseId: true },
      });

      const courseIds = enrollments.map((e) => e.courseId);

      const session = await prisma.session.findFirst({
        where: {
          sessionStatus: 'ACTIVE',
          scheduledStartTime: {
            lte: now,
          },
          scheduledEndTime: {
            gte: now,
          },
          courseId: {
            in: courseIds,
          },
        },
      });

      if (!session) {
        console.log(`ℹ️  No active session found for student ${studentId}`);
      } else {
        console.log(`✅ Found active session ${session.id} for student ${studentId}`);
      }

      return session;
    } catch (error) {
      console.error("❌ Error finding current session:", error);
      return null;
    }
  }

  /**
   * Get status of all active sessions (for debugging/monitoring)
   */
  getActiveSessionsStatus() {
    const status = [];

    activeSessions.forEach((session, deviceId) => {
      status.push({
        deviceId,
        studentId: session.studentId,
        sessionStartTime: session.sessionStartTime,
        lastPingTime: session.lastPingTime,
        timeSinceLastPing: Date.now() - session.lastPingTime.getTime(),
      });
    });

    return status;
  }

  /**
   * Emergency cleanup - end all active sessions (useful on server restart)
   */
  async cleanupAllSessions() {
    console.log(`🧹 Cleaning up ${activeSessions.size} active sessions`);

    const promises = [];

    activeSessions.forEach((session, deviceId) => {
      promises.push(
        this.endSession(deviceId, "SERVER_SHUTDOWN", {
          type: "shutdown",
          device: deviceId,
        }).catch((error) => {
          console.error(`Error cleaning up session for ${deviceId}:`, error);
        })
      );
    });

    await Promise.all(promises);
    console.log("✅ All sessions cleaned up");
  }
}

// Export singleton instance
module.exports = new EventProcessor();
