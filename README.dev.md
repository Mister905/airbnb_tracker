# Airbnb Tracker - Developer Documentation

Technical reference and implementation guide for the Airbnb Tracker application.

## Architecture Overview

### Frontend (`frontend/`)

**Framework**: Next.js 14 with App Router

- **Pages**: `app/dashboard/page.tsx`, `app/diff/page.tsx`, `app/login/page.tsx`
- **Components**: Modular React components in `components/`
  - `dashboard/DashboardContent.tsx` - Main dashboard with URL management
  - `diff/DiffToolContent.tsx` - Snapshot comparison interface
  - `diff/DescriptionDiff.tsx`, `ArrayDiff.tsx`, `PhotoDiff.tsx`, `ReviewDiff.tsx` - Diff visualization components
  - `auth/AuthGuard.tsx` - Route protection wrapper
- **State Management**: Redux Toolkit
  - `lib/store/listingsSlice.ts` - Tracked URLs and listings
  - `lib/store/snapshotsSlice.ts` - Snapshots and comparisons
  - `lib/store/authSlice.ts` - Authentication state
- **API Client**: `lib/api.ts` - Authenticated fetch wrapper with token management
- **Styling**: SCSS with global theme system (`styles/_theme.scss`, `styles/_components.scss`)
  - CSS custom properties for theming
  - Dark mode as default
  - Component-level SCSS classes

### Backend (`backend/`)

**Framework**: NestJS (Node.js + TypeScript)

**Modules**:
- `auth/` - Authentication and JWT generation
- `listings/` - Tracked URL CRUD operations
- `snapshots/` - Snapshot retrieval and comparison logic
- `scraping/` - Apify integration and scraping orchestration
- `ingestion/` - Data normalization and database persistence
- `prisma/` - Prisma service wrapper

**Key Services**:
- `ScrapingService` - Manages Apify runs, polling, and batch processing
- `IngestionService` - Transforms Apify data into database models
- `SnapshotsService` - Computes diffs between snapshots
- `AuthService` - Validates Supabase tokens and issues backend JWTs

### Database

**Schema** (`backend/prisma/schema.prisma`):

- `TrackedUrl` - User's tracked listing URLs (one-to-one with Listing)
- `Listing` - Core listing metadata (one-to-many with Snapshots)
- `ListingSnapshot` - Versioned snapshots (one-to-one with ScrapeRun)
- `Review` - Individual reviews (many-to-one with Listing and Snapshot)
- `Photo` - Listing photos (many-to-one with Listing and Snapshot)
- `ScrapeRun` - Scraping job tracking (one-to-one with Snapshot)

**Relationships**:
- `TrackedUrl` → `Listing` (1:1)
- `Listing` → `ListingSnapshot[]` (1:many)
- `ListingSnapshot` → `ScrapeRun` (1:1, optional)
- `ListingSnapshot` → `Review[]` (1:many)
- `ListingSnapshot` → `Photo[]` (1:many)

### Scraping Infrastructure

**Apify Actors**:
- **Rooms Scraper** (`APIFY_ACTOR_ID_ROOMS`): Fetches listing metadata
- **Reviews Scraper** (`APIFY_ACTOR_ID_REVIEWS`): Fetches reviews (optional, configured separately)

## Detailed Data Flow

### Listing Ingestion Flow

1. **Scrape Initiation** (`ScrapingService.scrapeUrl`)
   - Creates `ScrapeRun` record with status `pending`
   - Calls Apify Rooms Scraper with listing URL
   - Updates `ScrapeRun` with Apify run ID, status `running`

2. **Rooms Scraper Completion**
   - Waits for Apify run to finish (`waitForFinish()`)
   - Fetches dataset items (listing data)
   - Extracts room URLs from listings

3. **Reviews Scraping** (if `APIFY_ACTOR_ID_REVIEWS` configured)
   - Extracts unique room URLs from listings
   - Processes in batches (configurable `BATCH_SIZE`, default 5)
   - For each batch:
     - Starts Apify Reviews Scraper run
     - Polls for completion with timeout (`REVIEW_TIMEOUT`, default 300s)
     - Fetches reviews dataset
     - Rate limits between batches (`RATE_LIMIT_DELAY`, default 2.0s)
   - Merges reviews with listings by matching room IDs

4. **Data Ingestion** (`IngestionService.ingestData`)
   - Finds or creates `Listing` record
   - Determines next snapshot version (increments from latest)
   - Normalizes data:
     - **Price**: Handles number, object `{amount, currency}`, or string
     - **Rating**: Handles number, object `{value, reviewsCount}`, or string
     - **Review Count**: Extracts from rating object or direct field
     - **Amenities**: Flattens nested structure `amenities[].values[].title` (only available amenities)
     - **Photos**: Handles `images[]`, `photos[]`, or `photoUrls[]` with caption extraction
     - **Reviews**: Maps Apify review fields (`reviewer.name`, `text`, `createdAt`, `rating`, `review_id`)
   - Creates `ListingSnapshot` with normalized data
   - Links `ScrapeRun` to snapshot (one-to-one relationship)
   - Creates `Photo` records (linked to listing and snapshot)
   - Creates/updates `Review` records (upsert by `reviewId`, linked to listing and snapshot)
   - Updates `ScrapeRun` status to `completed`

### Snapshot Comparison Flow

1. **Frontend Request** (`DiffToolContent`)
   - User selects two snapshots (from/to)
   - Dispatches `compareSnapshots` Redux action

2. **Backend Comparison** (`SnapshotsService.compareSnapshots`)
   - Validates snapshots belong to same listing
   - Computes diffs:
     - **Description**: Text diff using `diff-match-patch` library
     - **Amenities**: Set difference (added/removed/unchanged)
     - **Photos**: Position-aware diff (added/removed/moved/unchanged)
     - **Reviews**: Grouped by month, identifies added/removed/updated reviews
     - **Metadata**: Price, rating, review count changes

3. **Frontend Rendering**
   - `DescriptionDiff`: Word-level highlighting with color coding
   - `ArrayDiff`: Two-column layout (old removed / new added) with unchanged collapsible
   - `PhotoDiff`: Grid view with badges for added/removed/moved photos
   - `ReviewDiff`: Month-grouped cards with change indicators

## Authentication Flow

### Frontend Authentication

1. **Login** (`app/login/page.tsx`)
   - User enters email/password
   - Supabase `signInWithPassword()` returns session with `access_token`
   - Frontend calls `/auth/verify` with Supabase token
   - Backend validates token and returns JWT
   - Frontend stores JWT in:
     - Redux state (`authSlice.backendJwt`)
     - localStorage (`backend_jwt` key)

2. **API Requests** (`lib/api.ts`)
   - `getAuthToken()` checks:
     1. Redux state for cached JWT
     2. localStorage for persisted JWT
     3. Supabase session (exchanges for JWT if needed)
   - All API calls include `Authorization: Bearer <jwt>` header

3. **Route Protection** (`components/auth/AuthGuard.tsx`)
   - Wraps protected pages
   - Checks Supabase session on mount
   - Redirects to `/login` if unauthenticated
   - Exchanges Supabase token for backend JWT if needed

### Backend Authentication

1. **Token Exchange** (`AuthController.verify`)
   - Receives Supabase `access_token`
   - `AuthService.validateSupabaseToken()` verifies with Supabase API
   - `AuthService.generateJwt()` issues backend JWT with user ID and email
   - Returns JWT to frontend

2. **Protected Endpoints** (`JwtAuthGuard`)
   - Extracts JWT from `Authorization` header
   - `JwtStrategy.validate()` verifies JWT signature
   - Extracts `userId` from JWT payload
   - Attaches `user` object to request (`req.user`)

3. **Data Isolation**
   - All queries filter by `userId` from `req.user`
   - Users can only access their own tracked URLs and listings

## Scraping Implementation

### Apify Integration

**Configuration**:
- `APIFY_TOKEN` - Apify API token
- `APIFY_ACTOR_ID_ROOMS` - Rooms scraper actor ID (required)
- `APIFY_ACTOR_ID_REVIEWS` - Reviews scraper actor ID (optional)

**Rooms Scraper Flow**:
1. Single Apify run per listing URL
2. Waits for completion with `waitForFinish()`
3. Fetches dataset items (array of listing objects)

**Reviews Scraper Flow** (if configured):
1. Extracts room URLs from listings (`extractRoomUrls()`)
2. Batches URLs (default batch size: 5)
3. For each batch:
   - Starts Apify run with batch URLs
   - Polls status every `REVIEW_POLL_INTERVAL` seconds (default: 10s)
   - Timeout after `REVIEW_TIMEOUT` seconds (default: 300s)
   - Fetches reviews dataset on success
4. Rate limits between batches (`RATE_LIMIT_DELAY` seconds)
5. Merges reviews with listings by room ID

**Polling Strategy**:
- `waitForReviewsCompletion()` polls Apify run status
- Checks status: `SUCCEEDED`, `FAILED`, `ABORTED`, `TIMED-OUT`, `READY`, `RUNNING`
- Logs elapsed time and status updates
- Returns run object on success, `null` on timeout

**Idempotency and Deduplication**:
- Reviews: Upsert by `reviewId` (unique constraint)
- Photos: No deduplication (multiple snapshots can reference same photo)
- Snapshots: Versioned (unique constraint on `[listingId, version]`)

### Scheduled Scraping

**Cron Job** (`ScrapingService.scheduledScrape`):
- Runs daily at midnight UTC (`@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)`)
- Fetches all enabled `TrackedUrl` records
- Calls `scrapeUrl()` for each (sequential, no rate limiting between listings)

## Database Design

### Entity Relationships

```
TrackedUrl (1) ──< (1) Listing (1) ──< (many) ListingSnapshot
                                                      │
                                                      ├──< (many) Review
                                                      │
                                                      ├──< (many) Photo
                                                      │
                                                      └──< (1) ScrapeRun
```

**Key Constraints**:
- `TrackedUrl.url` - Unique
- `Listing.trackedUrlId` - Unique (one-to-one with TrackedUrl)
- `ListingSnapshot.[listingId, version]` - Unique composite
- `Review.reviewId` - Unique (deduplication)
- `ScrapeRun.snapshotId` - Unique (one-to-one with Snapshot)

**Indexes**:
- `TrackedUrl`: `userId`, `enabled`
- `Listing`: `airbnbId`, `trackedUrlId`
- `ListingSnapshot`: `[listingId, createdAt]`, `createdAt`
- `Review`: `listingId`, `snapshotId`, `date`
- `Photo`: `listingId`, `snapshotId`, `order`
- `ScrapeRun`: `status`, `startedAt`, `trackedUrlId`

### Data Types

- **Amenities**: Stored as JSONB array of strings (normalized from nested structure)
- **Price/Rating**: Float (nullable)
- **Review Count**: Integer (nullable)
- **Dates**: DateTime with timezone

## Prisma Usage

### Schema Ownership

Prisma is the single source of truth for database schema. All schema changes must:
1. Be made in `backend/prisma/schema.prisma`
2. Generate migration: `npx prisma migrate dev --name <migration-name>`
3. Generate Prisma Client: `npx prisma generate` (auto-runs with migrate)

### Migrations Workflow

**Development**:
```bash
cd backend
npx prisma migrate dev --name your_migration_name
```

**Production**:
```bash
npx prisma migrate deploy
```

**Status Check**:
```bash
npx prisma migrate status
```

**Studio** (database browser):
```bash
npx prisma studio
```

### Prisma Client Usage

- Injected via `PrismaService` (extends `PrismaClient`)
- All services inject `PrismaService` for database access
- Type-safe queries with autocomplete
- Transactions supported via `$transaction()`

## Docker Setup

### Required for Local Development

The project uses Docker Compose for local development to ensure consistent environments.

**Services**:
- `postgres` - PostgreSQL 15 (Alpine)
- `backend` - NestJS application (Node 20, Debian-based)
- `frontend` - Next.js application (Node 20)

**Volumes**:
- Source code mounted for hot-reload
- `node_modules` excluded (container-managed)
- PostgreSQL data persisted in named volume

**Health Checks**:
- PostgreSQL health check ensures database is ready before backend starts

**Starting Services**:
```bash
docker-compose up
```

**Rebuilding**:
```bash
docker-compose build --no-cache
```

**Database Access**:
- Host: `localhost:5432`
- User: `postgres`
- Password: `postgres`
- Database: `airbnb_tracker`

## Environment Variables

### Backend

**Required**:
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_JWT_SECRET` - Supabase JWT secret (for token validation)
- `JWT_SECRET` - Backend JWT signing secret
- `APIFY_TOKEN` - Apify API token

**Optional**:
- `APIFY_ACTOR_ID_ROOMS` - Rooms scraper actor ID (defaults to `tri_angle~airbnb-rooms-urls-scraper`)
- `APIFY_ACTOR_ID` - Fallback actor ID if `APIFY_ACTOR_ID_ROOMS` not set
- `APIFY_ACTOR_ID_REVIEWS` - Reviews scraper actor ID (if not set, reviews scraping is skipped)
- `BATCH_SIZE` - Reviews batch size (default: 5)
- `RATE_LIMIT_DELAY` - Delay between batches in seconds (default: 2.0)
- `REVIEW_TIMEOUT` - Reviews scraper timeout in seconds (default: 300)
- `REVIEW_POLL_INTERVAL` - Polling interval in seconds (default: 10)
- `MAX_REVIEWS_PER_LISTING` - Max reviews per listing (default: 50)
- `REVIEW_CONCURRENCY` - Reviews scraper concurrency (default: 3)
- `PORT` - Backend server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

### Frontend

**Required**:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

**Note**: `NEXT_PUBLIC_*` variables are exposed to the browser. Never include secrets.

## Common Development Tasks

### Running Migrations

**Create Migration**:
```bash
cd backend
npx prisma migrate dev --name add_new_field
```

**Apply Migrations** (production):
```bash
npx prisma migrate deploy
```

**Reset Database** (development only):
```bash
npx prisma migrate reset
```

### Triggering Scrapes

**Manual Scrape** (via API):
```bash
curl -X POST http://localhost:3001/api/manual-scrape \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"trackedUrlId": "<url-id>"}'
```

**Check Scrape Status**:
```bash
curl http://localhost:3001/api/scrape-status/<tracked-url-id> \
  -H "Authorization: Bearer <jwt>"
```

**Via Frontend**: Use "Scrape Now" button in dashboard

### Debugging Ingestion

**Backend Logs**:
- Ingestion logs include data structure dumps
- Check for: `[Ingestion] Processing X item(s)`
- Photo/review counts logged on processing

**Database Inspection**:
```bash
cd backend
npx prisma studio
```

**Common Issues**:
- Missing photos: Check `images[]` vs `photos[]` field names in Apify data
- Missing reviews: Verify `APIFY_ACTOR_ID_REVIEWS` is configured
- Price/rating errors: Check data format (number vs object vs string)

### Testing Authentication

**Get JWT**:
```bash
# 1. Get Supabase token (via frontend login or Supabase API)
# 2. Exchange for backend JWT
curl -X POST http://localhost:3001/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "<supabase-access-token>"}'
```

**Use JWT**:
```bash
curl http://localhost:3001/api/listings/tracked-urls \
  -H "Authorization: Bearer <backend-jwt>"
```

## Known Constraints and Tradeoffs

### Scraping

- **Rate Limiting**: Reviews scraping uses configurable delays between batches to avoid overwhelming Apify
- **Timeout Handling**: Reviews scraper has 5-minute timeout; longer scrapes may require manual intervention
- **Error Recovery**: Failed review batches don't block listing ingestion; listings proceed without reviews
- **Idempotency**: Reviews are upserted by `reviewId` to prevent duplicates across scrapes

### Data Normalization

- **Flexible Parsing**: Ingestion handles multiple data formats (number/object/string) for price, rating, reviewCount
- **Amenity Extraction**: Only includes amenities with `available: true` from nested structure
- **Photo Deduplication**: Photos are not deduplicated across snapshots (same photo can appear in multiple versions)

### Performance

- **Snapshot Comparison**: Computed server-side; large snapshots may take time
- **Review Grouping**: Reviews grouped by month for display; all reviews stored individually
- **Frontend Polling**: Dashboard polls scrape status every 2 seconds during active scraping

### Authentication

- **Token Caching**: Backend JWT cached in localStorage; may require refresh if expired
- **Token Exchange**: Supabase token exchanged on first API call if no cached JWT
- **Session Persistence**: Supabase session persists across page refreshes

