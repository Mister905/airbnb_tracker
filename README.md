# Airbnb Tracker

A full-stack portfolio project for tracking, comparing, and visualizing changes in Airbnb listings over time. Built with Next.js, NestJS, Prisma, and Supabase.

## Features

- **Track Multiple Listings**: Add and manage multiple Airbnb listing URLs
- **Versioned Snapshots**: Automatic daily scraping creates versioned snapshots of listings
- **Visual Diffs**: Compare snapshots to see changes in:
  - Descriptions
  - Amenities (added/removed)
  - Photos (added/removed)
  - Reviews (grouped by month)
  - Price, rating, and review count changes
- **Automated Scraping**: Daily automated scraping at midnight UTC
- **Manual Scraping**: Trigger manual scrapes via the dashboard
- **Real-time Updates**: Supabase subscriptions for real-time data updates
- **Authentication**: Secure authentication with Supabase Auth
- **Responsive UI**: Modern, accessible UI built with Tailwind CSS and Radix UI

## Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript**
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Redux Toolkit** for state management
- **Supabase JS** for authentication and real-time subscriptions

### Backend
- **NestJS** (Node.js + TypeScript)
- **Prisma ORM** for database operations
- **PostgreSQL** (via Supabase)
- **Supabase Auth** for authentication
- **Apify** for web scraping
- **NestJS Schedule** for cron jobs

### Database
- **Supabase PostgreSQL** with:
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Authentication

## Project Structure

```
airbnb_tracker/
├── backend/                 # NestJS backend
│   ├── prisma/
│   │   └── schema.prisma   # Prisma schema
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── listings/       # Listings CRUD
│   │   ├── snapshots/      # Snapshots and diff logic
│   │   ├── scraping/       # Scraping service and cron
│   │   ├── ingestion/      # Data ingestion from Apify
│   │   └── prisma/         # Prisma service
│   └── Dockerfile
├── frontend/               # Next.js frontend
│   ├── app/               # Next.js app router pages
│   ├── components/        # React components
│   ├── lib/               # Utilities, API client, Redux store
│   └── Dockerfile
├── docker-compose.yml     # Docker Compose for local development
└── README.md
```

## Prerequisites

- **Node.js** 20+ and npm
- **Docker** and Docker Compose (required for local development)
- **Supabase Account** with a project
- **Apify Account** with an actor for scraping (optional for testing)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd airbnb_tracker
```

### 2. Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Fill in your Supabase and Apify credentials:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# JWT
JWT_SECRET=your-secret-key-change-in-production

# Apify
APIFY_TOKEN=your-apify-token
APIFY_ACTOR_ID=airbnb-scraper

# Database (Docker Compose will use this)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/airbnb_tracker

# Frontend
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Setup

#### Option A: Using Docker Compose (Recommended for Local Development)

Docker Compose will automatically set up a PostgreSQL database:

```bash
docker-compose up -d postgres
```

Wait for the database to be ready, then run migrations:

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma generate
```

#### Option B: Using Supabase Database

If you prefer to use your Supabase database directly:

1. Get your Supabase database connection string
2. Update `DATABASE_URL` in `.env`
3. Run migrations:

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Start Development Servers

#### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up

# Or run in detached mode
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 3001
- Frontend on port 3000

#### Manual Setup (Alternative)

**Backend:**

```bash
cd backend
npm install
npx prisma generate
npm run start:dev
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Prisma Studio** (optional): `cd backend && npx prisma studio`

## Database Migrations

All database operations use Prisma. To create a new migration:

```bash
cd backend
npx prisma migrate dev --name your-migration-name
```

To apply migrations in production:

```bash
npx prisma migrate deploy
```

To generate Prisma Client after schema changes:

```bash
npx prisma generate
```

## API Endpoints

All endpoints require authentication via JWT token in the `Authorization` header.

### Authentication
- `POST /auth/verify` - Verify Supabase token and get JWT
- `GET /auth/me` - Get current user

### Listings
- `GET /api/listings` - Get all listings (paginated)
- `GET /api/listings/:id` - Get listing by ID
- `GET /api/listings/tracked-urls` - Get all tracked URLs
- `POST /api/listings/tracked-urls` - Create tracked URL
- `PATCH /api/listings/tracked-urls/:id` - Update tracked URL
- `DELETE /api/listings/tracked-urls/:id` - Delete tracked URL

### Snapshots
- `GET /api/snapshots?listing_id=&limit=&offset=&start=&end=` - Get snapshots with filters
- `GET /api/snapshots/:id` - Get snapshot by ID
- `GET /api/snapshots/compare/:fromId/:toId` - Compare two snapshots

### Scraping
- `POST /api/manual-scrape` - Trigger manual scrape
- `GET /api/scrape-status/:trackedUrlId` - Get scrape status

### Ingestion
- `POST /api/ingest` - Ingest scraped data (internal use)

## Usage

### 1. Authentication

1. Navigate to http://localhost:3000/login
2. Sign up or sign in with your email
3. You'll be redirected to the dashboard

### 2. Add a Listing

1. Click "Add Listing URL" on the dashboard
2. Enter an Airbnb listing URL (e.g., `https://www.airbnb.com/rooms/12345678`)
3. The listing will be tracked and scraped automatically

### 3. Manual Scraping

1. Find your tracked URL in the dashboard
2. Click "Scrape Now" to trigger an immediate scrape
3. Monitor the status in real-time

### 4. Compare Snapshots

1. Navigate to the "Diff Tool" page
2. Select a listing
3. Choose "From" and "To" snapshots
4. View differences in:
   - Descriptions
   - Amenities (added/removed items highlighted)
   - Photos (new/removed photos shown)
   - Reviews (grouped by month)

### 5. Filter Snapshots

Use date range filters in the Diff Tool to narrow down snapshots by creation date.

## Automated Scraping

The backend includes a cron job that runs daily at midnight UTC:

```typescript
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async scheduledScrape() {
  // Scrapes all enabled tracked URLs
}
```

To disable automated scraping for a specific URL, toggle it off in the dashboard.

## Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Backend (Render/Railway/Heroku)

1. Set up a PostgreSQL database (or use Supabase)
2. Set environment variables
3. Run migrations: `npx prisma migrate deploy`
4. Deploy your NestJS application

### Environment Variables for Production

Ensure all environment variables are set in your deployment platform:
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_JWT_SECRET`
- `JWT_SECRET`
- `APIFY_TOKEN`
- `APIFY_ACTOR_ID`
- `FRONTEND_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Development

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests (if configured)
cd frontend
npm test
```

### Code Formatting

```bash
# Backend
cd backend
npm run format

# Frontend
cd frontend
npm run lint
```

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running (if using Docker: `docker-compose ps`)
- Check `DATABASE_URL` in `.env`
- Verify Prisma migrations are applied: `npx prisma migrate status`

### Authentication Issues

- Verify Supabase credentials in `.env`
- Check that Supabase Auth is enabled in your project
- Ensure JWT secret matches between frontend and backend

### Scraping Issues

- Verify Apify token and actor ID
- Check backend logs for scraping errors
- Ensure tracked URLs are valid Airbnb listing URLs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Backend powered by [NestJS](https://nestjs.com/)
- Database managed with [Prisma](https://www.prisma.io/)
- Authentication via [Supabase](https://supabase.com/)
- Web scraping with [Apify](https://apify.com/)
