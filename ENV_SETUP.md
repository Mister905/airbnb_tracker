# Environment Variables Setup Guide

This guide explains all environment variables used in the Airbnb Tracker project and how to configure them.

## Required Variables

### Supabase Configuration

These are **required** for authentication and database access:

1. **SUPABASE_URL**
   - Your Supabase project URL
   - Format: `https://[project-ref].supabase.co`
   - Find it in: Supabase Dashboard → Settings → API
   - Example: `https://pllrzmtdmzogckdzxrki.supabase.co`

2. **SUPABASE_ANON_KEY**
   - Your Supabase anonymous/public key
   - Find it in: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
   - This is safe to expose in frontend code

3. **SUPABASE_JWT_SECRET**
   - Your Supabase JWT secret
   - Find it in: Supabase Dashboard → Settings → API → JWT Settings → JWT Secret
   - **Keep this secret!** Never commit to version control

### JWT Configuration

4. **JWT_SECRET**
   - Secret key for signing JWT tokens in the backend
   - Generate a secure random string (32+ characters)
   - Example: `mbUZKw_QqQ9YjSraaXZCAn-f0KRrRPayyIfQ24DNxi8`
   - **Change this in production!**

### Database Configuration

5. **DATABASE_URL**
   - PostgreSQL connection string
   - For Docker Compose (local): `postgresql://postgres:postgres@postgres:5432/airbnb_tracker`
   - For Supabase (production): `postgresql://postgres.[ref]:[password]@[host]:5432/postgres`
   - Find Supabase connection string in: Supabase Dashboard → Settings → Database → Connection string → URI

### Frontend Configuration

6. **FRONTEND_URL**
   - URL where your frontend is hosted
   - Local: `http://localhost:3000`
   - Production: `https://your-domain.com`

7. **NEXT_PUBLIC_API_URL**
   - Backend API URL (must be accessible from browser)
   - Local: `http://localhost:3001`
   - Production: `https://api.your-domain.com`

8. **NEXT_PUBLIC_SUPABASE_URL**
   - **Must match SUPABASE_URL** (same value)
   - Used by Next.js frontend

9. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - **Must match SUPABASE_ANON_KEY** (same value)
   - Used by Next.js frontend

## Optional Variables

### Apify Configuration (for scraping)

10. **APIFY_TOKEN**
    - Your Apify API token
    - Get it from: https://console.apify.com/account/integrations
    - Leave as placeholder if not using scraping yet

11. **APIFY_ACTOR_ID**
    - The Apify actor ID to use for scraping
    - Example: `tri_angle~airbnb-rooms-urls-scraper`
    - Leave as placeholder if not using scraping yet

## How to Find Your Supabase Values

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. You'll find:
   - **Project URL** → Use for `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Use for `SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **JWT Secret** → Use for `SUPABASE_JWT_SECRET`

## Current Configuration Status

✅ **Already Configured:**
- SUPABASE_URL (extracted from connection string)
- SUPABASE_ANON_KEY
- SUPABASE_JWT_SECRET
- JWT_SECRET (generated secure value)
- NEXT_PUBLIC_SUPABASE_URL (matches SUPABASE_URL)
- NEXT_PUBLIC_SUPABASE_ANON_KEY (matches SUPABASE_ANON_KEY)

⚠️ **Needs Configuration:**
- APIFY_TOKEN (if you want to use scraping)
- APIFY_ACTOR_ID (if you want to use scraping)

## Verification

After setting up your `.env` file, verify it works:

1. **Backend:**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npm run start:dev
   ```
   Should start without errors.

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Should start without errors.

3. **Test Authentication:**
   - Go to http://localhost:3000/login
   - Try to sign up/sign in
   - If it works, your Supabase config is correct!

## Security Notes

- Never commit `.env` to version control
- Use different values for development and production
- Rotate secrets regularly in production
- Use environment-specific secrets in deployment platforms
