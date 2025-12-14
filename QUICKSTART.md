# Quick Start Guide

## Prerequisites

- Docker and Docker Compose installed
- Supabase account with a project
- (Optional) Apify account for scraping

## 1. Clone and Setup

```bash
git clone <repository-url>
cd ota_tracker
```

## 2. Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_JWT_SECRET`

## 3. Start with Docker Compose

```bash
# Start all services
docker-compose up -d

# Wait for services to be ready, then run migrations
cd backend
npm install
npx prisma migrate dev --name init
npx prisma generate
```

## 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 5. First Steps

1. Open http://localhost:3000/login
2. Sign up with your email
3. Add your first Airbnb listing URL
4. Trigger a manual scrape to test

## Troubleshooting

### Database not connecting?

```bash
# Check if postgres is running
docker-compose ps

# View logs
docker-compose logs postgres
```

### Backend not starting?

```bash
# Check backend logs
docker-compose logs backend

# Ensure Prisma migrations are applied
cd backend
npx prisma migrate status
```

### Frontend not loading?

```bash
# Check frontend logs
docker-compose logs frontend

# Verify environment variables
cat frontend/.env.local
```
