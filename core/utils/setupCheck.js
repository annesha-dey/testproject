/**
 * Setup Check Utility
 * Validates environment variables and configuration
 */

export default function setupCheck() {
  console.log('🔍 Running setup check...');
  
  const requiredEnvVars = [
    'SHOPIFY_API_KEY',
    'SHOPIFY_API_SECRET',
    'SHOPIFY_API_SCOPES',
    'HOST'
  ];

  const missing = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => console.error(`   - ${envVar}`));
    console.error('Please check your .env file');
    process.exit(1);
  }

  console.log('✅ Setup check passed');
}
