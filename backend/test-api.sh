#!/bin/bash

# CampuSync REST API Testing Script
# Tests all Day 4 endpoints

cat << 'EOF'

╔════════════════════════════════════════════════════════════════════╗
║           CampuSync REST API Endpoint Testing Script              ║
║              Testing All Day 4 Implemented Endpoints              ║
╚════════════════════════════════════════════════════════════════════╝

⚠️  NOTE: This script requires:
  1. Server running on http://localhost:5000
  2. Database accessible
  3. Valid JWT tokens from login

EOF

BASE_URL="http://localhost:5000"
STUDENT_EMAIL="student1@campusync.com"
STUDENT_PASSWORD="student123"
PROFESSOR_EMAIL="prof1@campusync.com"
PROFESSOR_PASSWORD="prof123"
ADMIN_EMAIL="admin@campusync.com"
ADMIN_PASSWORD="admin123"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to make requests
test_endpoint() {
  local method=$1
  local endpoint=$2
  local token=$3
  local data=$4
  local description=$5

  echo -e "\n${YELLOW}Testing: $description${NC}"
  echo -e "  Method: $method"
  echo -e "  Endpoint: ${endpoint}"

  if [ -z "$token" ]; then
    response=$(curl -s -X $method "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data" 2>&1)
  else
    response=$(curl -s -X $method "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $token" \
      -d "$data" 2>&1)
  fi

  if echo "$response" | grep -q "\"status\""; then
    echo -e "  ${GREEN}✅ Response received${NC}"
    echo "  Response: $(echo $response | head -c 150)..."
  else
    echo -e "  ${RED}❌ No valid response${NC}"
    echo "  Error: $response"
  fi
}

echo -e "\n\n🔑 STEP 1: Authentication - Get Tokens"
echo "════════════════════════════════════════════════════════════════"

echo -e "${YELLOW}Logging in as Student...${NC}"
STUDENT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$STUDENT_EMAIL\",\"password\":\"$STUDENT_PASSWORD\"}")

STUDENT_TOKEN=$(echo $STUDENT_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -z "$STUDENT_TOKEN" ]; then
  echo -e "${RED}❌ Failed to get student token${NC}"
  STUDENT_TOKEN="MOCK_TOKEN"
else
  echo -e "${GREEN}✅ Student token: ${STUDENT_TOKEN:0:20}...${NC}"
fi

echo -e "${YELLOW}Logging in as Professor...${NC}"
PROF_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$PROFESSOR_EMAIL\",\"password\":\"$PROFESSOR_PASSWORD\"}")

PROF_TOKEN=$(echo $PROF_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -z "$PROF_TOKEN" ]; then
  echo -e "${RED}❌ Failed to get professor token${NC}"
  PROF_TOKEN="MOCK_TOKEN"
else
  echo -e "${GREEN}✅ Professor token: ${PROF_TOKEN:0:20}...${NC}"
fi

echo -e "${YELLOW}Logging in as Admin...${NC}"
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}❌ Failed to get admin token${NC}"
  ADMIN_TOKEN="MOCK_TOKEN"
else
  echo -e "${GREEN}✅ Admin token: ${ADMIN_TOKEN:0:20}...${NC}"
fi

echo -e "\n\n👨‍🎓 STEP 2: Student Endpoints"
echo "════════════════════════════════════════════════════════════════"

test_endpoint "GET" "/api/attendance/current" "$STUDENT_TOKEN" "" \
  "GET /api/attendance/current - Get current active session"

test_endpoint "GET" "/api/attendance/history?limit=5&offset=0" "$STUDENT_TOKEN" "" \
  "GET /api/attendance/history - Get attendance history"

test_endpoint "GET" "/api/courses" "$STUDENT_TOKEN" "" \
  "GET /api/courses - Get enrolled courses"

echo -e "\n\n👨‍🏫 STEP 3: Professor Endpoints"
echo "════════════════════════════════════════════════════════════════"

# First, get a courseId to use in the session start request
COURSES_RESPONSE=$(curl -s -X GET "$BASE_URL/api/courses" \
  -H "Authorization: Bearer $PROF_TOKEN")

COURSE_ID=$(echo $COURSES_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$COURSE_ID" ]; then
  test_endpoint "POST" "/api/sessions/start" "$PROF_TOKEN" \
    "{\"courseId\":\"$COURSE_ID\"}" \
    "POST /api/sessions/start - Start new attendance session"
fi

test_endpoint "GET" "/api/courses/my-courses" "$PROF_TOKEN" "" \
  "GET /api/courses/my-courses - Get taught courses"

test_endpoint "GET" "/api/courses" "$PROF_TOKEN" "" \
  "GET /api/courses - Get taught courses (alternative endpoint)"

echo -e "\n\n👮 STEP 4: Admin Endpoints"
echo "════════════════════════════════════════════════════════════════"

test_endpoint "GET" "/api/admin/sessions/active" "$ADMIN_TOKEN" "" \
  "GET /api/admin/sessions/active - Get all active sessions"

test_endpoint "GET" "/api/admin/mqtt-logs?limit=10&offset=0" "$ADMIN_TOKEN" "" \
  "GET /api/admin/mqtt-logs - Get MQTT event logs"

test_endpoint "GET" "/api/admin/anomalies?limit=10" "$ADMIN_TOKEN" "" \
  "GET /api/admin/anomalies - Get detected anomalies"

test_endpoint "GET" "/api/admin/devices" "$ADMIN_TOKEN" "" \
  "GET /api/admin/devices - Get device registry"

test_endpoint "GET" "/api/admin/system-status" "$ADMIN_TOKEN" "" \
  "GET /api/admin/system-status - Get system status"

echo -e "\n\n✅ STEP 5: Server Health"
echo "════════════════════════════════════════════════════════════════"

HEALTH=$(curl -s "$BASE_URL/health")
if echo "$HEALTH" | grep -q "OK"; then
  echo -e "${GREEN}✅ Server is healthy${NC}"
  echo "Response: $HEALTH"
else
  echo -e "${RED}❌ Server health check failed${NC}"
  echo "Response: $HEALTH"
fi

echo -e "\n\n════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ API Testing Complete${NC}"
echo "════════════════════════════════════════════════════════════════\n"
