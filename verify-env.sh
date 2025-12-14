#!/bin/bash

# Environment Variables Verification Script
# This script checks if all required environment variables are set

echo "🔍 Verifying environment variables..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ .env file found"
else
    echo "❌ .env file not found!"
    exit 1
fi

# Required variables
REQUIRED_VARS=(
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_JWT_SECRET"
    "JWT_SECRET"
    "DATABASE_URL"
    "FRONTEND_URL"
    "NEXT_PUBLIC_API_URL"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

# Optional variables
OPTIONAL_VARS=(
    "APIFY_TOKEN"
    "APIFY_ACTOR_ID"
)

# Check required variables
echo ""
echo "📋 Required Variables:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
MISSING=0
for var in "${REQUIRED_VARS[@]}"; do
    var_lower=$(echo "$var" | tr '[:upper:]' '[:lower:]')
    if [ -z "${!var}" ] || [ "${!var}" = "your-${var_lower}" ] || [ "${!var}" = "your-${var_lower}-change-in-production" ]; then
        echo -e "${RED}❌ ${var}${NC} - Not set or still placeholder"
        MISSING=1
    else
        # Mask sensitive values
        if [[ "$var" == *"SECRET"* ]] || [[ "$var" == *"KEY"* ]] || [[ "$var" == *"TOKEN"* ]]; then
            echo -e "${GREEN}✅ ${var}${NC} - Set (hidden)"
        else
            echo -e "${GREEN}✅ ${var}${NC} - ${!var}"
        fi
    fi
done

# Check optional variables
echo ""
echo "📋 Optional Variables:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for var in "${OPTIONAL_VARS[@]}"; do
    var_lower=$(echo "$var" | tr '[:upper:]' '[:lower:]')
    if [ -z "${!var}" ] || [ "${!var}" = "your-${var_lower}" ]; then
        echo -e "${YELLOW}⚠️  ${var}${NC} - Not set (optional)"
    else
        echo -e "${GREEN}✅ ${var}${NC} - Set (hidden)"
    fi
done

# Verify Supabase URL format
echo ""
echo "🔗 Supabase URL Verification:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ "$SUPABASE_URL" =~ ^https://.*\.supabase\.co$ ]]; then
    echo -e "${GREEN}✅ SUPABASE_URL format is correct${NC}"
else
    echo -e "${RED}❌ SUPABASE_URL format is incorrect${NC}"
    echo "   Expected format: https://[project-ref].supabase.co"
    MISSING=1
fi

# Verify matching values
echo ""
echo "🔗 Value Matching:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$SUPABASE_URL" = "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo -e "${GREEN}✅ SUPABASE_URL matches NEXT_PUBLIC_SUPABASE_URL${NC}"
else
    echo -e "${RED}❌ SUPABASE_URL does not match NEXT_PUBLIC_SUPABASE_URL${NC}"
    MISSING=1
fi

if [ "$SUPABASE_ANON_KEY" = "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo -e "${GREEN}✅ SUPABASE_ANON_KEY matches NEXT_PUBLIC_SUPABASE_ANON_KEY${NC}"
else
    echo -e "${RED}❌ SUPABASE_ANON_KEY does not match NEXT_PUBLIC_SUPABASE_ANON_KEY${NC}"
    MISSING=1
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $MISSING -eq 0 ]; then
    echo -e "${GREEN}✅ All required environment variables are properly configured!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start Docker Compose: docker-compose up -d postgres"
    echo "2. Run migrations: cd backend && npx prisma migrate dev"
    echo "3. Start backend: cd backend && npm run start:dev"
    echo "4. Start frontend: cd frontend && npm run dev"
    exit 0
else
    echo -e "${RED}❌ Some required environment variables are missing or incorrect${NC}"
    echo ""
    echo "Please check your .env file and update the missing values."
    echo "See ENV_SETUP.md for detailed instructions."
    exit 1
fi
