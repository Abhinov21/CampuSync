#!/bin/bash

# CampuSync Day 0 Setup Verification Script
# Run this to check if your environment is properly configured

set -e

echo "🚀 CampuSync Day 0 Setup Verification"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to check file exists
file_exists() {
  if [ -f "$1" ]; then
    return 0
  else
    return 1
  fi
}

# Test functions
test_passed() {
  echo -e "${GREEN}✅ PASS${NC}: $1"
  ((PASSED++))
}

test_failed() {
  echo -e "${RED}❌ FAIL${NC}: $1"
  ((FAILED++))
}

test_warning() {
  echo -e "${YELLOW}⚠️  WARN${NC}: $1"
  ((WARNINGS++))
}

# ============ COMMON CHECKS ============
echo "📋 COMMON CHECKS"
echo "==============="

if command_exists git; then
  test_passed "Git installed"
else
  test_failed "Git not installed"
fi

if command_exists node; then
  node_version=$(node -v)
  test_passed "Node.js installed ($node_version)"
else
  test_failed "Node.js not installed"
fi

if command_exists npm; then
  npm_version=$(npm -v)
  test_passed "npm installed ($npm_version)"
else
  test_failed "npm not installed"
fi

# Check git repository
if [ -d ".git" ]; then
  test_passed "Git repository initialized"
  current_branch=$(git rev-parse --abbrev-ref HEAD)
else
  test_failed "Not a git repository"
fi

# ============ COMMON FILES ============
echo ""
echo "📁 COMMON FILES"
echo "==============="

if file_exists "API_CONTRACT.md"; then
  test_passed "API_CONTRACT.md exists"
else
  test_failed "API_CONTRACT.md missing"
fi

if file_exists "WEBSOCKET_SPEC.md"; then
  test_passed "WEBSOCKET_SPEC.md exists"
else
  test_failed "WEBSOCKET_SPEC.md missing"
fi

if file_exists "TEST_CREDENTIALS.md"; then
  test_passed "TEST_CREDENTIALS.md exists"
else
  test_failed "TEST_CREDENTIALS.md missing"
fi

if file_exists "DEVELOPER_A_PLAN.md"; then
  test_passed "DEVELOPER_A_PLAN.md exists"
else
  test_failed "DEVELOPER_A_PLAN.md missing"
fi

if file_exists "DEVELOPER_B_PLAN.md"; then
  test_passed "DEVELOPER_B_PLAN.md exists"
else
  test_failed "DEVELOPER_B_PLAN.md missing"
fi

# ============ BACKEND CHECKS ============
if [ -d "backend" ]; then
  echo ""
  echo "🔧 BACKEND SETUP"
  echo "==============="

  if file_exists "backend/.env"; then
    test_passed "backend/.env exists"
    
    if grep -q "DATABASE_URL" backend/.env; then
      test_passed "DATABASE_URL configured"
    else
      test_failed "DATABASE_URL not in .env"
    fi

    if grep -q "JWT_SECRET" backend/.env; then
      test_passed "JWT_SECRET configured"
    else
      test_failed "JWT_SECRET not in .env"
    fi

    if grep -q "PORT" backend/.env; then
      test_passed "PORT configured"
    else
      test_failed "PORT not in .env"
    fi
  else
    test_failed "backend/.env missing"
  fi

  # Check if node_modules exists
  if [ -d "backend/node_modules" ]; then
    test_passed "Backend dependencies installed"
  else
    test_warning "Backend node_modules not found - run 'cd backend && npm install'"
  fi

  # Check if Prisma schema exists
  if file_exists "backend/prisma/schema.prisma"; then
    test_passed "Prisma schema exists"
  else
    test_failed "Prisma schema missing"
  fi

  # Check seed script
  if file_exists "backend/prisma/seed.js"; then
    test_passed "Seed script exists"
  else
    test_warning "Seed script missing - might need to create it"
  fi
else
  test_warning "backend/ directory not found"
fi

# ============ FRONTEND CHECKS ============
if [ -d "frontend" ]; then
  echo ""
  echo "⚛️  FRONTEND SETUP"
  echo "================="

  if file_exists "frontend/.env"; then
    test_passed "frontend/.env exists"
    
    if grep -q "VITE_API_URL" frontend/.env; then
      test_passed "VITE_API_URL configured"
    else
      test_failed "VITE_API_URL not in .env"
    fi
  else
    test_failed "frontend/.env missing"
  fi

  # Check if node_modules exists
  if [ -d "frontend/node_modules" ]; then
    test_passed "Frontend dependencies installed"
  else
    test_warning "Frontend node_modules not found - run 'cd frontend && npm install'"
  fi

  # Check if vite config exists
  if file_exists "frontend/vite.config.js"; then
    test_passed "Vite config exists"
  else
    test_warning "Vite config missing"
  fi
else
  test_warning "frontend/ directory not found"
fi

# ============ GIT BRANCHES ============
echo ""
echo "🌿 GIT BRANCHES"
echo "==============="

if [ "$current_branch" = "main" ]; then
  test_passed "On main branch"
else
  test_warning "Currently on branch: $current_branch"
fi

# Check if development branches exist
if git rev-parse --verify dev/backend/mqtt >/dev/null 2>&1; then
  test_passed "dev/backend/mqtt branch exists"
else
  test_failed "dev/backend/mqtt branch not found"
fi

if git rev-parse --verify dev/frontend/dashboards >/dev/null 2>&1; then
  test_passed "dev/frontend/dashboards branch exists"
else
  test_failed "dev/frontend/dashboards branch not found"
fi

# ============ SUMMARY ============
echo ""
echo "📊 SUMMARY"
echo "=========="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo ""

# Exit status
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✨ Setup looks good!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. cd backend && npm install (if not done)"
  echo "2. cd frontend && npm install (if not done)"
  echo "3. Run 'npm run dev' in backend folder"
  echo "4. Run 'npm run dev' in frontend folder (in new terminal)"
  echo "5. Follow DAY_0_COMPLETE.md for detailed setup"
  exit 0
else
  echo -e "${RED}⚠️  Setup incomplete - please fix errors above${NC}"
  exit 1
fi
