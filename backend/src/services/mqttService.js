/**
 * MQTT Service - CampuSync
 * Connects to HiveMQ Cloud and subscribes to fingerprint/match topic
 * Receives MQTT events from biometric devices and forwards to event processor
 */

const mqtt = require('mqtt');

class MQTTService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.eventProcessor = null; // Will be set by server after initialization
  }

  /**
   * Establish connection to HiveMQ Cloud broker
   */
  async connect() {
    try {
      const brokerUrl = process.env.MQTT_BROKER;
      const username = process.env.MQTT_USERNAME;
      const password = process.env.MQTT_PASSWORD;

      if (!brokerUrl || !username || !password) {
        throw new Error('Missing MQTT environment variables: MQTT_BROKER, MQTT_USERNAME, MQTT_PASSWORD');
      }

      console.log('🔌 Connecting to MQTT broker...');

      const options = {
        username,
        password,
        reconnectPeriod: parseInt(process.env.MQTT_RECONNECT_PERIOD || 5000),
        connectTimeout: 30000,
        clientId: process.env.MQTT_CLIENT_ID || 'campusync-backend',
        clean: true,
        protocol: 'mqtt', // or 'mqtts' for secure
      };

      this.client = mqtt.connect(brokerUrl, options);

      // Connection established
      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('✅ Connected to HiveMQ Cloud');
        this.subscribe();
      });

      // Incoming messages
      this.client.on('message', async (topic, message) => {
        try {
          const payload = JSON.parse(message.toString());
          console.log(`📨 MQTT Message (${topic}):`, payload);

          // Forward to event processor if available
          if (this.eventProcessor) {
            await this.eventProcessor.processEvent(payload);
          }
        } catch (error) {
          console.error('❌ MQTT message parse error:', error.message, 'Raw:', message.toString());
        }
      });

      // Connection errors
      this.client.on('error', (error) => {
        console.error('❌ MQTT error:', error.message);
        this.isConnected = false;
      });

      // Reconnection attempt
      this.client.on('reconnect', () => {
        console.log('🔄 Attempting to reconnect to MQTT broker...');
      });

      // Disconnection
      this.client.on('disconnect', () => {
        this.isConnected = false;
        console.log('⚠️  Disconnected from MQTT broker');
      });

      // Close
      this.client.on('close', () => {
        this.isConnected = false;
        console.log('🔌 MQTT connection closed');
      });
    } catch (error) {
      console.error('❌ MQTT connection failed:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Subscribe to fingerprint/match topic
   */
  subscribe() {
    const topic = process.env.MQTT_TOPIC_FINGERPRINT || 'fingerprint/match';

    this.client.subscribe(topic, (err) => {
      if (err) {
        console.error(`❌ Subscribe error (${topic}):`, err.message);
      } else {
        console.log(`✅ Subscribed to topic: ${topic}`);
      }
    });
  }

  /**
   * Publish a test message to a topic
   * @param {string} topic - Topic name
   * @param {object} payload - Message payload
   */
  async publish(topic, payload) {
    if (!this.isConnected) {
      throw new Error('MQTT not connected');
    }

    return new Promise((resolve, reject) => {
      this.client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Disconnect from broker
   */
  disconnect() {
    if (this.client) {
      this.client.end(true, () => {
        this.isConnected = false;
        console.log('🔌 MQTT disconnected');
      });
    }
  }

  /**
   * Set the event processor (called by server after initialization)
   * @param {EventProcessor} processor - Event processor instance
   */
  setEventProcessor(processor) {
    this.eventProcessor = processor;
    console.log('📌 Event processor attached to MQTT service');
  }

  /**
   * Check connection status
   * @returns {boolean}
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      broker: process.env.MQTT_BROKER,
      topic: process.env.MQTT_TOPIC_FINGERPRINT,
    };
  }
}

// Export singleton instance
module.exports = new MQTTService();
