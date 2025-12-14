import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables from root .env file
config({ path: path.join(__dirname, '..', '..', '.env') });

const ADMIN_EMAIL = 'jjm90591@gmail.com';

async function createAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  // For admin operations, we need the service role key
  // If not available, we'll use the anon key (may have limited permissions)
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
    console.error('   For admin user creation, SUPABASE_SERVICE_ROLE_KEY is recommended');
    process.exit(1);
  }

  // Get password from command line or environment variable
  const password = process.argv[2] || process.env.ADMIN_PASSWORD;
  
  if (!password) {
    console.error('❌ Error: Password is required');
    console.error('Usage: npx ts-node backend/scripts/create-admin.ts <password>');
    console.error('   Or: ADMIN_PASSWORD=yourpassword npx ts-node backend/scripts/create-admin.ts');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log(`Creating admin user: ${ADMIN_EMAIL}...`);
    
    // Try to create user using signUp (works with anon key)
    // This will create the user but may require email confirmation
    const { data, error } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: password,
      options: {
        emailRedirectTo: undefined,
      },
    });

    if (error) {
      // If user already exists, try to sign in to verify
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        console.log('⚠️  User already exists. Attempting to verify credentials...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: password,
        });
        
        if (signInError) {
          console.error('❌ Error: User exists but password is incorrect or account needs confirmation');
          console.error('   Please use Supabase Dashboard to reset password or confirm email');
          process.exit(1);
        } else {
          console.log('✅ Admin user exists and credentials are valid!');
          return;
        }
      }
      
      console.error('❌ Error creating admin user:', error.message);
      console.error('\n💡 Alternative: Create the user manually in Supabase Dashboard:');
      console.error('   1. Go to https://app.supabase.com');
      console.error('   2. Select your project');
      console.error('   3. Go to Authentication > Users');
      console.error('   4. Click "Add user" > "Create new user"');
      console.error(`   5. Email: ${ADMIN_EMAIL}`);
      console.error(`   6. Password: (your chosen password)`);
      console.error('   7. Uncheck "Send invitation email"');
      process.exit(1);
    }

    if (data.user) {
      console.log('✅ Admin user created successfully!');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   User ID: ${data.user.id}`);
      
      if (!data.session) {
        console.log('\n⚠️  Note: Email confirmation may be required.');
        console.log('   To disable email confirmation:');
        console.log('   1. Go to Supabase Dashboard > Authentication > Settings');
        console.log('   2. Disable "Enable email confirmations"');
        console.log('   3. Or manually confirm the user in Authentication > Users');
      }
      
      console.log('\n📝 Note: Sign-ups are disabled in the frontend. Only this admin account can sign in.');
    }
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

createAdmin();

