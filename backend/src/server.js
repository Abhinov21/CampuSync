const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Import services
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const sessionsRoutes = require('./routes/sessions');
const coursesRoutes = require('./routes/courses');
const adminRoutes = require('./routes/admin');
const mqttService = require('./services/mqttService');
const eventProcessor = require('./services/eventProcessor');
const WebSocketService = require('./services/websocketService');

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'CampuSync API - MQTT-Based Attendance System',
    version: '1.0.0',
    status: 'running',
  });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const mqttStatus = mqttService.getStatus();
    
    res.json({
      status: 'OK',
      database: 'Connected',
      mqtt: mqttStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      database: 'Disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    error: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    error: err.error || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
let wsService; // Will be initialized later

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  // Close WebSocket connections
  if (wsService) {
    console.log('🔌 Closing WebSocket connections...');
    wsService.close();
  }
  
  // Cleanup active sessions
  console.log('🧹 Cleaning up active sessions...');
  try {
    await eventProcessor.cleanupAllSessions();
  } catch (error) {
    console.error('❌ Error during session cleanup:', error.message);
  }
  
  // Disconnect MQTT
  if (mqttService.isConnected) {
    console.log('🔌 Disconnecting from MQTT...');
    mqttService.disconnect();
  }
  
  // Disconnect database
  await prisma.$disconnect();
  
  console.log('✅ Shutdown complete');
  process.exit(0);
});

// Initialize and start server
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

async function startServer() {
  try {
    // Test database connection (non-blocking)
    console.log('🗄️  Testing database connection...');
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connected');
    } catch (dbError) {
      console.log('⚠️  Database not accessible (network firewall) - running in offline mode');
      console.log('   This is expected in environments with restricted network access');
    }

    // Initialize WebSocket service
    wsService = new WebSocketService(server);
    console.log('🔌 WebSocket service initialized');

    // Attach event processor to MQTT service and pass wsService to eventProcessor
    mqttService.setEventProcessor(eventProcessor);
    eventProcessor.setWebSocketService(wsService);
    console.log('📌 Event processor attached to MQTT service');
    console.log('🔗 WebSocket service connected to event processor');

    // Attach wsService to app for use in routes
    app.locals.wsService = wsService;

    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`\n✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth routes: http://localhost:${PORT}/auth/login`);
      console.log(`🔗 WebSocket ready at ws://localhost:${PORT}`);
      console.log('');
    });

    // Connect to MQTT (non-blocking, continues even if fails initially)
    console.log('🔌 Initializing MQTT service...');
    await mqttService.connect().catch((error) => {
      console.error('⚠️  MQTT connection error (will retry):', error.message);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
