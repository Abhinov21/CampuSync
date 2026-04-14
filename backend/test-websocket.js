#!/usr/bin/env node

/**
 * WebSocket Connection Test Script
 * Tests Socket.io connection and basic events
 */

const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:5000';
const TEST_SESSION_ID = 'test-session-001';
const TEST_USER_ID = 'user-001';

console.log('🔗 WebSocket Connection Test');
console.log('════════════════════════════════════════');
console.log(`Attempting to connect to: ${SERVER_URL}\n`);

const socket = io(SERVER_URL, {
  reconnection: false,
  forceNew: true
});

// Connection Handler
socket.on('connect', () => {
  console.log(`✅ Connected to server`);
  console.log(`📍 Socket ID: ${socket.id}\n`);

  // Test 1: Join session
  console.log('📝 Test 1: Joining session room...');
  socket.emit('join-session', {
    sessionId: TEST_SESSION_ID,
    userId: TEST_USER_ID
  });

  // Test 2: Listen for session events
  socket.on('session-event', (data) => {
    console.log(`\n📨 Received session-event:`);
    console.log(`   Type: ${data.type}`);
    console.log(`   Data:`, JSON.stringify(data.data, null, 2));
    console.log(`   Timestamp: ${data.timestamp}`);
  });

  // Test 3: Listen for user-joined
  socket.on('user-joined', (data) => {
    console.log(`\n👤 Received user-joined:`);
    console.log(`   Data:`, JSON.stringify(data, null, 2));
  });

  // Test 4: Listen for anomaly alerts
  socket.on('anomaly-alert', (data) => {
    console.log(`\n⚠️  Received anomaly-alert:`);
    console.log(`   Type: ${data.type}`);
    console.log(`   Severity: ${data.severity}`);
    console.log(`   Description: ${data.description}`);
  });

  // Test 5: Listen for system status
  socket.on('system-status', (data) => {
    console.log(`\n🖥️  Received system-status:`);
    console.log(`   Data:`, JSON.stringify(data, null, 2));
  });

  // Test 6: Join admin room
  console.log('\n📝 Test 2: Joining admin room...');
  socket.emit('join-admin', {
    userId: 'admin-001'
  });

  // Schedule disconnection after 5 seconds
  setTimeout(() => {
    console.log('\n🔌 Disconnecting from server...');
    socket.disconnect();
  }, 5000);
});

// Disconnection Handler
socket.on('disconnect', () => {
  console.log('✅ Disconnected from server');
  console.log('\n════════════════════════════════════════');
  console.log('✨ WebSocket Connection Test Complete');
  console.log('════════════════════════════════════════\n');
  process.exit(0);
});

// Error Handler
socket.on('error', (error) => {
  console.error(`\n❌ Connection error: ${error}`);
  console.log('Retrying...\n');
});

// Connection Error Handler
socket.on('connect_error', (error) => {
  console.error(`\n❌ Connection error: ${error}`);
  console.error('Make sure the server is running on port 5000');
  process.exit(1);
});

// Timeout
setTimeout(() => {
  if (!socket.connected) {
    console.error('\n❌ Connection timeout - could not connect to server');
    console.error('Make sure the server is running with: npm run dev');
    process.exit(1);
  }
}, 10000);
