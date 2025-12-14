#!/bin/bash

# Comprehensive Configuration Test Script
# Tests all aspects of the Airbnb Tracker configuration

# Don't exit on error - we want to run all tests
set +e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Test result function
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        ((FAILED++))
    fi
}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 Airbnb Tracker Configuration Test Suite${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Load .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo -e "${GREEN}✅ .env file found and loaded${NC}"
else
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

# Test 1: Environment Variables Verification
echo -e "${BLUE}📋 Test 1: Environment Variables${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f verify-env.sh ]; then
    chmod +x verify-env.sh
    VERIFY_OUTPUT=$(./verify-env.sh 2>&1)
    VERIFY_EXIT=$?
    # Check if output contains success message
    if echo "$VERIFY_OUTPUT" | grep -q "All required environment variables are properly configured"; then
        test_result 0 "Environment variables verification"
    else
        # Check if it's just missing optional vars
        if echo "$VERIFY_OUTPUT" | grep -q "All required environment variables are properly configured" || \
           [ $VERIFY_EXIT -eq 0 ]; then
            test_result 0 "Environment variables verification"
        else
            echo "$VERIFY_OUTPUT" | tail -10
            test_result 1 "Environment variables verification"
        fi
    fi
else
    test_result 1 "verify-env.sh script not found"
fi
echo ""

# Test 2: Database Connection (Docker)
echo -e "${BLUE}📋 Test 2: Database Connection${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Docker is running
if docker info > /dev/null 2>&1; then
    test_result 0 "Docker is running"
    
    # Check if postgres container is running
    if docker ps | grep -q airbnb-tracker-db; then
        test_result 0 "PostgreSQL container is running"
        
        # Test database connection
        if docker exec airbnb-tracker-db pg_isready -U postgres > /dev/null 2>&1; then
            test_result 0 "Database is accepting connections"
        else
            test_result 1 "Database is not accepting connections"
        fi
    else
        echo -e "${YELLOW}⚠️  PostgreSQL container is not running${NC}"
        echo -e "${YELLOW}   Start it with: docker-compose up -d postgres${NC}"
        test_result 1 "PostgreSQL container is not running"
    fi
else
    test_result 1 "Docker is not running"
fi
echo ""

# Test 3: Supabase Connection
echo -e "${BLUE}📋 Test 3: Supabase Connection${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_ANON_KEY" ]; then
    # Test Supabase API connection
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        "$SUPABASE_URL/rest/v1/" 2>/dev/null || echo "000")
    
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "404" ] || [ "$RESPONSE" = "401" ]; then
        # 200, 404, or 401 means the server is reachable
        test_result 0 "Supabase URL is reachable"
    else
        test_result 1 "Supabase URL is not reachable (HTTP $RESPONSE)"
    fi
    
    # Verify URL format
    if [[ "$SUPABASE_URL" =~ ^https://.*\.supabase\.co$ ]]; then
        test_result 0 "Supabase URL format is correct"
    else
        test_result 1 "Supabase URL format is incorrect"
    fi
    
    # Check if keys match
    if [ "$SUPABASE_URL" = "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        test_result 0 "SUPABASE_URL matches NEXT_PUBLIC_SUPABASE_URL"
    else
        test_result 1 "SUPABASE_URL does not match NEXT_PUBLIC_SUPABASE_URL"
    fi
    
    if [ "$SUPABASE_ANON_KEY" = "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
        test_result 0 "SUPABASE_ANON_KEY matches NEXT_PUBLIC_SUPABASE_ANON_KEY"
    else
        test_result 1 "SUPABASE_ANON_KEY does not match NEXT_PUBLIC_SUPABASE_ANON_KEY"
    fi
else
    test_result 1 "Supabase credentials not configured"
fi
echo ""

# Test 4: Backend Dependencies
echo -e "${BLUE}📋 Test 4: Backend Setup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd backend

# Check if node_modules exists
if [ -d "node_modules" ]; then
    test_result 0 "Backend dependencies installed"
else
    echo -e "${YELLOW}⚠️  Backend dependencies not installed${NC}"
    echo -e "${YELLOW}   Run: npm install${NC}"
    test_result 1 "Backend dependencies not installed"
fi

# Check if Prisma Client is generated
if [ -f "node_modules/.prisma/client/index.js" ] || [ -d "node_modules/@prisma/client" ]; then
    test_result 0 "Prisma Client is generated"
else
    echo -e "${YELLOW}⚠️  Prisma Client not generated${NC}"
    echo -e "${YELLOW}   Run: npx prisma generate${NC}"
    test_result 1 "Prisma Client not generated"
fi

# Check if schema.prisma exists
if [ -f "prisma/schema.prisma" ]; then
    test_result 0 "Prisma schema file exists"
else
    test_result 1 "Prisma schema file not found"
fi

cd ..
echo ""

# Test 5: Frontend Dependencies
echo -e "${BLUE}📋 Test 5: Frontend Setup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd frontend

# Check if node_modules exists
if [ -d "node_modules" ]; then
    test_result 0 "Frontend dependencies installed"
else
    echo -e "${YELLOW}⚠️  Frontend dependencies not installed${NC}"
    echo -e "${YELLOW}   Run: npm install${NC}"
    test_result 1 "Frontend dependencies not installed"
fi

# Check if Next.js config exists
if [ -f "next.config.mjs" ] || [ -f "next.config.js" ]; then
    test_result 0 "Next.js configuration exists"
else
    test_result 1 "Next.js configuration not found"
fi

cd ..
echo ""

# Test 6: Prisma Database Schema
echo -e "${BLUE}📋 Test 6: Database Schema${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd backend

# Check if migrations exist
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
    test_result 0 "Database migrations exist"
else
    echo -e "${YELLOW}⚠️  No database migrations found${NC}"
    echo -e "${YELLOW}   Run: npx prisma migrate dev --name init${NC}"
    test_result 1 "Database migrations not found"
fi

# Test Prisma connection (if database is running)
if docker ps | grep -q airbnb-tracker-db; then
    # Use local Docker database URL for validation
    LOCAL_DB_URL="postgresql://postgres:postgres@localhost:5432/airbnb_tracker"
    if DATABASE_URL="$LOCAL_DB_URL" npx prisma validate --schema=./prisma/schema.prisma > /dev/null 2>&1; then
        test_result 0 "Prisma can validate schema"
    else
        test_result 1 "Prisma schema validation failed"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping Prisma connection test (database not running)${NC}"
fi

cd ..
echo ""

# Test 7: Port Availability
echo -e "${BLUE}📋 Test 7: Port Availability${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check port 3000 (frontend)
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use${NC}"
    test_result 1 "Port 3000 is not available"
else
    test_result 0 "Port 3000 is available"
fi

# Check port 3001 (backend)
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3001 is already in use${NC}"
    test_result 1 "Port 3001 is not available"
else
    test_result 0 "Port 3001 is available"
fi

# Check port 5432 (postgres)
if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1; then
    test_result 0 "Port 5432 is in use (PostgreSQL)"
else
    echo -e "${YELLOW}⚠️  Port 5432 is not in use${NC}"
    test_result 1 "Port 5432 is not available"
fi
echo ""

# Test 8: Optional Configuration
echo -e "${BLUE}📋 Test 8: Optional Configuration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$APIFY_TOKEN" ] && [ "$APIFY_TOKEN" != "your-apify-api-token" ]; then
    test_result 0 "Apify token is configured"
else
    echo -e "${YELLOW}⚠️  Apify token not configured (optional)${NC}"
    test_result 0 "Apify token not configured (optional - scraping won't work)"
fi

if [ -n "$APIFY_ACTOR_ID" ] && [ "$APIFY_ACTOR_ID" != "your-apify-actor-id" ]; then
    test_result 0 "Apify actor ID is configured"
else
    echo -e "${YELLOW}⚠️  Apify actor ID not configured (optional)${NC}"
    test_result 0 "Apify actor ID not configured (optional)"
fi
echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Your configuration is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start database: docker-compose up -d postgres"
    echo "2. Run migrations: cd backend && npx prisma migrate dev"
    echo "3. Start backend: cd backend && npm run start:dev"
    echo "4. Start frontend: cd frontend && npm run dev"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please fix the issues above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "- Install dependencies: cd backend && npm install && cd ../frontend && npm install"
    echo "- Generate Prisma: cd backend && npx prisma generate"
    echo "- Start database: docker-compose up -d postgres"
    echo "- Run migrations: cd backend && npx prisma migrate dev --name init"
    exit 1
fi

