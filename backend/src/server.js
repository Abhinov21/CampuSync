const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Import services
const authRoutes = require('./routes/auth');
const mqttService = require('./services/mqttService');
const eventProcessor = require('./services/eventProcessor');

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
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
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

async function startServer() {
  try {
    // Test database connection
    console.log('🗄️  Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected');

    // Attach event processor to MQTT service
    mqttService.setEventProcessor(eventProcessor);
    console.log('📌 Event processor attached to MQTT service');

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`\n✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth routes: http://localhost:${PORT}/auth/login`);
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
