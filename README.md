# Airbnb Tracker

A full-stack web application for tracking and comparing changes in Airbnb listings over time. Built with modern TypeScript frameworks, this project demonstrates end-to-end development capabilities from data collection to visualization.

## Project Overview

Airbnb listings change frequently—prices fluctuate, amenities are added or removed, photos are updated, and new reviews appear. This application solves the problem of tracking these changes systematically by:

- **Automated Data Collection**: Scheduled scraping captures listing snapshots daily
- **Versioned History**: Each scrape creates a new versioned snapshot, preserving historical data
- **Visual Comparison**: Side-by-side diff views highlight what changed between any two snapshots
- **User-Centric Design**: Clean, responsive interface for managing tracked listings

## Key Features

### Dashboard
- Add and manage multiple Airbnb listing URLs
- Manual scraping on-demand with real-time status updates
- Batch scraping for all enabled listings
- Sortable table with status indicators
- Toggle listings on/off for automated scraping

### Diff Tool
- Compare any two snapshots side-by-side
- Visual diffs for:
  - **Descriptions**: Word-level highlighting of additions, removals, and modifications
  - **Amenities**: Clear indicators for added, removed, and unchanged items
  - **Photos**: Grid view showing new, removed, and repositioned images
  - **Reviews**: Grouped by month with added, removed, and updated reviews highlighted
  - **Metadata**: Price, rating, and review count changes
- Optional date range filtering for snapshot selection

### Automated Scraping
- Daily cron job runs at midnight UTC
- Processes all enabled listings automatically
- Tracks scraping status and errors
- Supports both listing data and review collection

## Tech Stack

### Frontend
- **Next.js 14** (App Router) - React framework with server-side rendering
- **TypeScript** - Type-safe development
- **SCSS** - Global theming system with CSS custom properties (dark mode default)
- **Headless UI** - Accessible, unstyled component primitives for dropdowns and interactive elements
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Redux Toolkit** - State management for listings and snapshots
- **Supabase JS** - Authentication client

### Backend
- **NestJS** - Enterprise-grade Node.js framework
- **Prisma ORM** - Type-safe database access and migrations
- **PostgreSQL** - Relational database (via Docker or Supabase)
- **Apify** - Web scraping platform integration
- **NestJS Schedule** - Cron job management

### Infrastructure
- **Docker Compose** - Local development environment
- **Supabase** - Authentication and optional database hosting
- **Apify** - Scraping infrastructure

## System Architecture

### Data Flow

1. **User adds listing URL** → Stored in `TrackedUrl` table
2. **Scraping triggered** (manual or scheduled) → Apify actors scrape listing data
3. **Data ingestion** → Normalized and stored in `ListingSnapshot` with versioning
4. **Frontend queries** → Redux state management fetches and caches data
5. **Diff computation** → Backend compares snapshots, frontend renders visual diffs

### Authentication Flow

- Frontend authenticates users via Supabase Auth
- Supabase access token is exchanged for backend JWT on login
- Backend JWT is cached in localStorage and Redux state
- All API requests include JWT in Authorization header
- Backend validates JWT and extracts user ID for data isolation

### Scraping Pipeline

1. **Rooms Scraper**: Fetches listing metadata (title, description, price, amenities, photos)
2. **Reviews Scraper** (optional): Fetches reviews for each listing in batches
3. **Data Merging**: Reviews are matched to listings by room ID
4. **Ingestion**: Normalized data is stored with versioning
5. **Snapshot Creation**: New snapshot version is created and linked to scrape run

## Authentication & Security

- **Supabase Auth**: Handles user registration, login, and session management
- **JWT Tokens**: Backend issues JWTs after validating Supabase tokens
- **User Isolation**: All data queries are scoped to the authenticated user
- **Protected Routes**: Frontend route guards redirect unauthenticated users
- **Secure API**: All backend endpoints require valid JWT authentication

## Why This Project

This project demonstrates:

- **Full-Stack Development**: End-to-end application from database to UI
- **Real-World Data Handling**: Complex data normalization, versioning, and comparison
- **Modern Architecture**: TypeScript throughout, type-safe database access, modular design
- **Production Considerations**: Error handling, rate limiting, batch processing, polling strategies
- **User Experience**: Responsive design, real-time updates, intuitive diff visualization
- **DevOps Practices**: Docker containerization, environment configuration, database migrations

The codebase prioritizes maintainability, type safety, and clear separation of concerns while solving a practical problem that requires careful orchestration of external APIs, data transformation, and user interface design.

## Screenshots

_Placeholder for dashboard, diff tool, and authentication screenshots_
