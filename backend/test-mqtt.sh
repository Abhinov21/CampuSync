#!/bin/bash

# MQTT Connection Test Script - CampuSync
# Use this to manually test MQTT connection and message publishing
# Requires: npm install -g mqtt-cli

echo "🧪 CampuSync MQTT Test Script"
echo "========================================"
echo ""

MQTT_BROKER=${MQTT_BROKER:-"tcp://5ee5c3a3b3e04d16b95d7f36ddad0c05.s1.eu.hivemq.cloud:1883"}
MQTT_USERNAME=${MQTT_USERNAME:-"campusync_user"}
MQTT_PASSWORD=${MQTT_PASSWORD:-"CampuSync@2026Device"}
TOPIC="fingerprint/match"

echo "Configuration:"
echo "  Broker: $MQTT_BROKER"
echo "  Username: $MQTT_USERNAME"
echo "  Topic: $TOPIC"
echo ""

# Test 1: Subscribe to topic (in background)
echo "▶️  Test 1: Subscribing to topic..."
echo "Command: mqtt-cli sub -t \"$TOPIC\" -u \"$MQTT_USERNAME\" -pw \"$MQTT_PASSWORD\" -h \"${MQTT_BROKER#*//}\" -v"
echo ""

# Test 2: Publish AUTH event  
echo "▶️  Test 2: Publishing AUTH event..."
AUTH_MSG='{
  "type": "auth",
  "device": "WB_001",
  "id": 5,
  "confidence": 88
}'

echo "Command: mqtt-cli pub -t \"$TOPIC\" -m '$AUTH_MSG' -u \"$MQTT_USERNAME\" -pw \"$MQTT_PASSWORD\" -h \"${MQTT_BROKER#*//}\""
echo ""

# Test 3: Publish PING event
echo "▶️  Test 3: Publishing PING event..."
PING_MSG='{
  "type": "ping",
  "device": "WB_001",
  "id": 5,
  "ts": '$(date +%s)'
}'

echo "Command: mqtt-cli pub -t \"$TOPIC\" -m '$PING_MSG' -u \"$MQTT_USERNAME\" -pw \"$MQTT_PASSWORD\" -h \"${MQTT_BROKER#*//}\""
echo ""

# Test 4: Publish SESSION_END event
echo "▶️  Test 4: Publishing SESSION_END event..."
END_MSG='{
  "type": "session_end",
  "device": "WB_001",
  "id": 5
}'

echo "Command: mqtt-cli pub -t \"$TOPIC\" -m '$END_MSG' -u \"$MQTT_USERNAME\" -pw \"$MQTT_PASSWORD\" -h \"${MQTT_BROKER#*//}\""
echo ""

echo "========================================"
echo "To run these tests:"
echo "1. Install mqtt-cli: npm install -g mqtt-cli"
echo "2. In one terminal, run: mqtt-cli sub -t \"$TOPIC\" -u \"$MQTT_USERNAME\" -pw \"$MQTT_PASSWORD\" -h \"hub.hivemq.com 1883\""
echo "3. In another terminal, run each publish command above"
echo "4. Watch the backend console for: '📨 MQTT Message'"
echo "========================================"
