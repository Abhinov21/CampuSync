#!/usr/bin/env node

/**
 * MQTT Test Sequence for CampuSync
 * Sends AUTH + continuous PING messages to keep device session alive
 * Device: 00:70:07:25:B6:88 (Student 1 - Arjun Sharma)
 */

const mqtt = require('mqtt');

// HiveMQ Cloud credentials
const MQTT_BROKER = 'mqtt://d72a2fa82ec24f6d820c8b5b0e2ed8ae.s2.eu.hivemq.cloud:8883';
const MQTT_USER = 'campusync_user';
const MQTT_PASS = 'CampuSync@2026';
const MQTT_TOPIC = 'fingerprint/match';

// Device info
const DEVICE_MAC = '00:70:07:25:B6:88';
const USER_ID = 1;

const client = mqtt.connect(MQTT_BROKER, {
  username: MQTT_USER,
  password: MQTT_PASS,
  rejectUnauthorized: false,
});

client.on('connect', () => {
  console.log('✅ Connected to HiveMQ');
  console.log('🔧 MQTT Test Sequence Starting');
  console.log('================================');
  console.log(`Device MAC: ${DEVICE_MAC}`);
  console.log(`User ID: ${USER_ID}`);
  console.log(`Topic: ${MQTT_TOPIC}`);
  console.log('');

  // Step 1: Send AUTH message
  const authMessage = {
    type: 'auth',
    device_mac: DEVICE_MAC,
    user_id: USER_ID,
    confidence: 82,
  };

  console.log('📤 1. Sending AUTH (Session Start)');
  console.log(`   ${JSON.stringify(authMessage)}`);
  client.publish(MQTT_TOPIC, JSON.stringify(authMessage));

  console.log('');
  console.log('⏳ Session created. Sending PINGs every 8 seconds...');
  console.log('');

  // Step 2+: Send PING messages every 8 seconds (before 30s timeout)
  let pingCount = 0;
  const pingInterval = setInterval(() => {
    pingCount++;
    const timestamp = Math.floor(Date.now() / 1000) + pingCount * 8;
    
    const pingMessage = {
      type: 'ping',
      device_mac: DEVICE_MAC,
      user_id: USER_ID,
      ts: timestamp,
    };

    console.log(`📤 ${pingCount + 1}. Sending PING (Heartbeat ${pingCount})`);
    console.log(`   ${JSON.stringify(pingMessage)}`);
    client.publish(MQTT_TOPIC, JSON.stringify(pingMessage));

    // Stop after 5 PINGs (40 seconds of continuous presence)
    if (pingCount >= 5) {
      clearInterval(pingInterval);
      console.log('');
      console.log('✅ Test sequence complete!');
      console.log('');
      console.log('Expected behavior:');
      console.log('  ✓ Professor dashboard shows student as PRESENT');
      console.log('  ✓ Attendance counter increments');
      console.log('  ✓ No PING_WITHOUT_SESSION anomalies');
      console.log('  ✓ Session remains ACTIVE for ~40 seconds');
      console.log('');
      
      setTimeout(() => {
        client.end();
        process.exit(0);
      }, 1000);
    }
  }, 8000);
});

client.on('error', (error) => {
  console.error('❌ MQTT Error:', error);
  process.exit(1);
});

client.on('close', () => {
  console.log('🔌 Disconnected from HiveMQ');
});
