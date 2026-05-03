/**
 * WebSocket Service for Real-Time Updates
 * Handles Socket.io connections and event emissions
 */

const { Server } = require('socket.io');
const { verifyToken } = require('../utils/auth');

class WebSocketService {
  constructor(httpServer) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      frontendUrl
    ];

    this.io = new Server(httpServer, {
      cors: {
        origin: allowedOrigins,
        credentials: true
      }
    });

    this.connectedUsers = new Map(); // userId -> socketId mapping
    this.activeRooms = new Map(); // sessionId -> [socketIds]

    this.setupAuthentication();
    this.setupHandlers();
  }

  /**
   * Setup JWT authentication middleware for WebSocket
   */
  setupAuthentication() {
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = verifyToken(token);
        socket.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role
        };


        next();
      } catch (error) {
        next(new Error('Invalid or expired token'));
      }
    });
  }

  /**
   * Setup WebSocket connection handlers
   */
  setupHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.user.userId;
      const userEmail = socket.user.email;
      const userRole = socket.user.role;

      // Silent connection - reduced logging to prevent spam

      /**
       * Client event: join-session
       * User joins a specific session room
       */
      socket.on('join-session', (data) => {
        const { sessionId } = data;
        // Use authenticated userId instead of trusting client
        const authenticatedUserId = socket.user.userId;
        const roomName = `session-${sessionId}`;

        // Check if already in room to prevent duplicate joins
        if (!socket.rooms.has(roomName)) {
          socket.join(roomName);
          this.connectedUsers.set(authenticatedUserId, socket.id);

          if (!this.activeRooms.has(sessionId)) {
            this.activeRooms.set(sessionId, []);
          }
          this.activeRooms.get(sessionId).push(socket.id);

          // Notify others in room
          socket.to(roomName).emit('user-joined', {
            userId: authenticatedUserId,
            email: userEmail,
            role: userRole,
            socketId: socket.id,
            timestamp: new Date().toISOString()
          });
        }
      });

      /**
       * Client event: join-admin
       * Admin joins the system-wide admin room
       */
      socket.on('join-admin', (data) => {
        if (userRole !== 'ADMIN') {
          console.log(`⛔ Unauthorized: ${userEmail} tried to join admin room (role: ${userRole})`);
          socket.emit('error', 'Only admins can join the admin room');
          return;
        }

        const roomName = 'admin-room';
        socket.join(roomName);
        console.log(`🛡️  Admin ${userEmail} joined admin room`);

        // Notify admin room that an admin is online
        socket.to(roomName).emit('admin-online', {
          userId: userId,
          email: userEmail,
          timestamp: new Date().toISOString()
        });
      });

      /**
       * Client event: disconnect
       * Handle user disconnection
       */
      socket.on('disconnect', () => {
        // Remove from all tracked rooms
        for (const [sessionId, socketIds] of this.activeRooms) {
          const index = socketIds.indexOf(socket.id);
          if (index > -1) {
            socketIds.splice(index, 1);
            if (socketIds.length === 0) {
              this.activeRooms.delete(sessionId);
            }
          }
        }

        // Remove from connected users
        this.connectedUsers.delete(userId);
        console.log(`👤 User ${userEmail} disconnected (socket: ${socket.id})`);
      });
    });
  }

  /**
   * Emit when student joins session (AUTH event)
   * @param {Object} sessionData - { sessionId, studentId, studentName, courseId, courseName }
   */
  emitSessionCreated(sessionData) {
    const roomName = `session-${sessionData.sessionId}`;

    this.io.to(roomName).emit('session-event', {
      type: 'student-joined',
      data: {
        studentId: sessionData.studentId,
        studentName: sessionData.studentName,
        courseId: sessionData.courseId,
        courseName: sessionData.courseName,
        sessionId: sessionData.sessionId,
        joinedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Emitted student-joined for student: ${sessionData.studentName} in session: ${sessionData.sessionId}`);
  }

  /**
   * Emit duration update (PING event)
   * @param {string} sessionId - Session ID
   * @param {Array} attendanceSessions - Array of active attendance sessions with durations
   */
  emitPingUpdate(sessionId, attendanceSessions) {
    const roomName = `session-${sessionId}`;

    this.io.to(roomName).emit('session-event', {
      type: 'ping-update',
      data: {
        sessionId,
        attendanceSessions: attendanceSessions.map(as => ({
          studentId: as.studentId,
          studentName: as.studentName,
          durationSeconds: as.durationSeconds,
          sessionStatus: as.sessionStatus,
          lastPingTime: as.lastPingTime
        })),
        totalStudents: attendanceSessions.length,
        updatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

    console.log(`⏱️  Emitted ping-update for session: ${sessionId}, students: ${attendanceSessions.length}`);
  }

  /**
   * Emit when student's attendance session ends
   * @param {string} sessionId - Session ID
   * @param {Object} attendanceSessionData - { studentId, studentName, totalDurationSeconds, status }
   */
  emitStudentSessionEnded(sessionId, attendanceSessionData) {
    const roomName = `session-${sessionId}`;

    this.io.to(roomName).emit('session-event', {
      type: 'student-ended',
      data: {
        studentId: attendanceSessionData.studentId,
        studentName: attendanceSessionData.studentName,
        sessionId,
        totalDurationSeconds: attendanceSessionData.totalDurationSeconds,
        status: attendanceSessionData.status,
        endedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

    console.log(`❌ Emitted student-ended for student: ${attendanceSessionData.studentName}, duration: ${attendanceSessionData.totalDurationSeconds}s`);
  }

  /**
   * Emit when entire session ends (professor ends class)
   * @param {string} sessionId - Session ID
   * @param {Object} sessionData - { courseId, courseName, totalStudents, presentCount }
   */
  emitSessionEnded(sessionId, sessionData) {
    const roomName = `session-${sessionId}`;

    this.io.to(roomName).emit('session-event', {
      type: 'session-ended',
      data: {
        sessionId,
        courseId: sessionData.courseId,
        courseName: sessionData.courseName,
        totalStudents: sessionData.totalStudents,
        presentCount: sessionData.presentCount,
        attendancePercentage: sessionData.totalStudents > 0 
          ? ((sessionData.presentCount / sessionData.totalStudents) * 100).toFixed(2)
          : 0,
        endedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

    console.log(`🏁 Emitted session-ended for session: ${sessionId}, attendance: ${sessionData.presentCount}/${sessionData.totalStudents}`);
  }

  /**
   * Emit anomaly alerts to admin room
   * @param {Object} anomaly - { type, severity, description, studentId, studentName, timestamp }
   */
  emitAnomalyAlert(anomaly) {
    this.io.to('admin-room').emit('anomaly-alert', {
      type: anomaly.type,
      severity: anomaly.severity,
      description: anomaly.description,
      studentId: anomaly.studentId,
      studentName: anomaly.studentName,
      courseId: anomaly.courseId,
      courseName: anomaly.courseName,
      timestamp: new Date().toISOString(),
      detectedAt: anomaly.timestamp
    });

    console.log(`⚠️  Emitted anomaly alert: ${anomaly.type} - ${anomaly.description}`);
  }

  /**
   * Emit real-time attendance stats (for dashboard)
   * @param {string} sessionId - Session ID
   * @param {Object} stats - { totalEnrolled, presentCount, absentCount, averageDuration }
   */
  emitAttendanceUpdate(sessionId, stats) {
    const roomName = `session-${sessionId}`;

    this.io.to(roomName).emit('session-event', {
      type: 'attendance-update',
      data: {
        sessionId,
        totalEnrolled: stats.totalEnrolled,
        presentCount: stats.presentCount,
        absentCount: stats.absentCount,
        attendancePercentage: stats.totalEnrolled > 0
          ? ((stats.presentCount / stats.totalEnrolled) * 100).toFixed(2)
          : 0,
        averageDuration: stats.averageDuration,
        updatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

    console.log(`📊 Emitted attendance-update for session: ${sessionId}, present: ${stats.presentCount}/${stats.totalEnrolled}`);
  }

  /**
   * Emit system status to all admin clients
   * @param {Object} status - System-wide metrics
   */
  emitSystemStatus(status) {
    this.io.to('admin-room').emit('system-status', {
      activeSessions: status.activeSessions,
      totalStudents: status.totalStudents,
      totalDevices: status.totalDevices,
      activeDevices: status.activeDevices,
      recentAnomalies: status.recentAnomalies,
      timestamp: new Date().toISOString()
    });

    console.log(`🖥️  Emitted system-status: ${status.activeSessions} sessions, ${status.activeDevices} devices active`);
  }

  /**
   * Get connection statistics
   * @returns {Object} Statistics about active connections
   */
  getStats() {
    return {
      totalConnections: this.io.engine.clientsCount,
      totalUsers: this.connectedUsers.size,
      activeSessions: this.activeRooms.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Broadcast message to specific room
   * @param {string} roomName - Room name
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   */
  emitToRoom(roomName, eventName, data) {
    this.io.to(roomName).emit(eventName, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Close WebSocket server
   */
  close() {
    console.log('🔌 Closing WebSocket server...');
    this.io.close();
  }
}

module.exports = WebSocketService;
