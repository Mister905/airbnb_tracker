#!/usr/bin/env node

/**
 * Script to create an admin user in Supabase
 * 
 * Usage:
 *   node scripts/create-admin.js <password>
 * 
 * Or set ADMIN_PASSWORD environment variable:
 *   ADMIN_PASSWORD=yourpassword node scripts/create-admin.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const ADMIN_EMAIL = 'jjm90591@gmail.com';

async function createAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set in .env');
    process.exit(1);
  }

  // Get password from command line or environment variable
  const password = process.argv[2] || process.env.ADMIN_PASSWORD;
  
  if (!password) {
    console.error('❌ Error: Password is required');
    console.error('Usage: node scripts/create-admin.js <password>');
    console.error('   Or: ADMIN_PASSWORD=yourpassword node scripts/create-admin.js');
    process.exit(1);
  }

  // Use service role key for admin operations (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log(`Creating admin user: ${ADMIN_EMAIL}...`);
    
    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.warn('⚠️  Could not check existing users:', listError.message);
    } else {
      const existingUser = existingUsers.users.find(u => u.email === ADMIN_EMAIL);
      if (existingUser) {
        console.log('✅ Admin user already exists');
        console.log('   To update the password, use Supabase Dashboard or delete and recreate the user');
        return;
      }
    }

    // Create the admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: password,
      email_confirm: true, // Auto-confirm email so no verification needed
    });

    if (error) {
      console.error('❌ Error creating admin user:', error.message);
      process.exit(1);
    }

    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   User ID: ${data.user.id}`);
    console.log('\n📝 Note: Sign-ups are disabled in the frontend. Only this admin account can sign in.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

createAdmin();

