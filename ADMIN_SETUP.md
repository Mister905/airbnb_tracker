# Admin Account Setup

Sign-up functionality has been disabled. Only the admin account can sign in to the application.

## Creating the Admin Account

The admin account email is: **jjm90591@gmail.com**

### Option 1: Using the Script (Recommended)

1. Navigate to the project root:
   ```bash
   cd /Users/james/Desktop/airbnb_tracker
   ```

2. Run the admin creation script with your desired password:
   ```bash
   ADMIN_PASSWORD=your-secure-password npx ts-node backend/scripts/create-admin.ts
   ```
   
   Or pass the password as an argument:
   ```bash
   npx ts-node backend/scripts/create-admin.ts your-secure-password
   ```

3. The script will:
   - Create the admin user with email `jjm90591@gmail.com`
   - Set the password you provided
   - Handle cases where the user already exists

### Option 2: Using Supabase Dashboard (Alternative)

If the script doesn't work, you can create the admin user manually:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** > **Users**
4. Click **"Add user"** > **"Create new user"**
5. Fill in:
   - **Email**: `jjm90591@gmail.com`
   - **Password**: (your chosen secure password)
   - **Auto Confirm User**: ✅ (check this to skip email verification)
6. Click **"Create user"**

### Option 3: Disable Email Confirmation (If Needed)

If email confirmation is required and you want to disable it:

1. Go to Supabase Dashboard
2. Navigate to **Authentication** > **Settings**
3. Under **Email Auth**, disable **"Enable email confirmations"**
4. Save changes

## Signing In

After creating the admin account:

1. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to http://localhost:3000/login

3. Sign in with:
   - **Email**: `jjm90591@gmail.com`
   - **Password**: (the password you set)

## Security Notes

- The sign-up button has been removed from the login page
- Only the admin account can access the application
- Make sure to use a strong, secure password for the admin account
- Keep your `.env` file secure and never commit it to version control

## Troubleshooting

**"User already exists" error:**
- The user may already be created. Try signing in with your password.
- If you forgot the password, reset it via Supabase Dashboard > Authentication > Users > Reset Password

**"Email not confirmed" error:**
- Either disable email confirmations in Supabase Dashboard (see Option 3 above)
- Or manually confirm the user in Supabase Dashboard > Authentication > Users

**Script fails:**
- Make sure your `.env` file has `SUPABASE_URL` and `SUPABASE_ANON_KEY` set
- For better results, add `SUPABASE_SERVICE_ROLE_KEY` to your `.env` (found in Supabase Dashboard > Settings > API > service_role key)

