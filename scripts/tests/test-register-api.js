// Test script for the direct registration API
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the project root
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// Debug environment variables (without exposing secrets)
console.log('--- Environment Check ---');
console.log(`Supabase URL available: ${Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)}`);
console.log(`Supabase service role key available: ${Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)}`);
console.log('-----------------------');

async function testRegistrationAPI() {
  console.log('Testing direct registration API locally...');
  
  try {
    // Create a test user with random email to avoid conflicts
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    const testName = 'Test User';
    
    console.log(`Attempting to register user: ${testEmail}`);
    
    // Make request to the local API endpoint with added debugging
    const response = await fetch('http://localhost:3000/api/auth/register-new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: testName,
      }),
    });
    
    // Print full response details
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Registration API test successful!');
    } else {
      console.log('❌ Registration API test failed.');
      console.log('Error details:', data.message || data.error || 'No error details');
    }
  } catch (error) {
    console.error('Error during API test:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testRegistrationAPI();