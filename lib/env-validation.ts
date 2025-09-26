// Environment variable validation for security
export function validateEnvironment() {
  const requiredEnvVars = {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    
    // Stripe
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID,
    
    // AI
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    
    // App
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  };

  const missingVars: string[] = [];
  const invalidVars: string[] = [];

  // Check for missing variables
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missingVars.push(key);
    }
  }

  // Validate specific formats
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')) {
    invalidVars.push('NEXT_PUBLIC_SUPABASE_URL must use HTTPS');
  }

  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.startsWith('https://')) {
    invalidVars.push('NEXT_PUBLIC_SITE_URL must use HTTPS');
  }

  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    invalidVars.push('STRIPE_SECRET_KEY must be a valid Stripe secret key');
  }

  if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
    invalidVars.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must be a valid Stripe publishable key');
  }

  if (process.env.STRIPE_WEBHOOK_SECRET && !process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
    invalidVars.push('STRIPE_WEBHOOK_SECRET must be a valid Stripe webhook secret');
  }

  return {
    isValid: missingVars.length === 0 && invalidVars.length === 0,
    missingVars,
    invalidVars,
  };
}

// Validate environment on startup
export function validateEnvironmentOnStartup() {
  const validation = validateEnvironment();
  
  if (!validation.isValid) {
    console.error('❌ Environment validation failed:');
    if (validation.missingVars.length > 0) {
      console.error('Missing variables:', validation.missingVars);
    }
    if (validation.invalidVars.length > 0) {
      console.error('Invalid variables:', validation.invalidVars);
    }
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  } else {
    console.log('✅ Environment validation passed');
  }
  
  return validation;
}
