/**
 * ========================================================================
 * Environment Configuration & Validation
 * ========================================================================
 *
 * This module:
 * 1. Loads .env variables using dotenv
 * 2. Validates all required environment variables
 * 3. Provides type-safe access to env vars
 * 4. Logs configuration status (safe, no secrets exposed)
 * 5. Handles missing variables with clear error messages
 *
 * This file MUST be imported first in your application!
 * ========================================================================
 */

import dotenv from 'dotenv';
import path from 'path';

// ─── Helper: Type guard for Node.js ErrnoException ──────────────────────────

/**
 * Type guard to check if an error is a Node.js ErrnoException (has 'code' property).
 * This allows safe access to error.code without TypeScript errors.
 */
function isErrnoException(error: Error): error is NodeJS.ErrnoException {
  return 'code' in error;
}

// ─── Load .env file ──────────────────────────────────────────────────────────
// Try to load from backend/.env (relative to this file: src/config/env.ts)
const envPath = path.resolve(__dirname, '../../.env');

const loadResult = dotenv.config({ path: envPath });

if (loadResult.error && isErrnoException(loadResult.error) && loadResult.error.code !== 'ENOENT') {
  console.error('❌ Error loading .env file:', loadResult.error);
}

if (loadResult.parsed) {
  console.log(`✅ Loaded .env from: ${envPath}`);
  console.log(`   Found ${Object.keys(loadResult.parsed).length} variables`);
} else {
  console.warn(
    `⚠️  No .env file found at ${envPath}. Using system environment variables.`
  );
  console.warn('   → Create a .env file in the backend folder to configure the app.');
}

// ─── Type-safe environment interface ──────────────────────────────────────────

export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  CORS_ORIGIN: string;

  // Supabase (REQUIRED)
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;

  // AI Provider (REQUIRED)
  AI_PROVIDER: 'gemini' | 'openai';
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;

  // Optional
  ONBOARDING_PROMPT_PREFIX?: string;
}

// ─── Validation logic ────────────────────────────────────────────────────────

/**
 * List of REQUIRED environment variables for the app to run.
 * If any of these are missing, the app will not start.
 */
const REQUIRED_VARS: (keyof Environment)[] = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'AI_PROVIDER',
];

/**
 * Validates that all required environment variables are set.
 * Throws an error with a clear message if any are missing.
 */
function validateEnvironment(): void {
  const missing: string[] = [];

  for (const varName of REQUIRED_VARS) {
    const value = process.env[varName];

    if (!value || value.trim() === '') {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    console.error('\n❌ FATAL ERROR: Missing required environment variables!\n');
    console.error('The following variables must be set in your .env file:\n');

    missing.forEach((varName) => {
      console.error(`   • ${varName}`);
    });

    console.error('\n📋 How to fix:\n');
    console.error('   1. Copy .env.example to .env:');
    console.error('      cp .env.example .env\n');
    console.error('   2. Open .env and fill in the values:');
    console.error('      - SUPABASE_URL: Get from Supabase Dashboard → Settings → API');
    console.error('      - SUPABASE_ANON_KEY: Get from above');
    console.error('      - AI_PROVIDER: Set to "gemini" or "openai"');
    console.error('      - GEMINI_API_KEY: Get from Google AI Studio\n');
    console.error('   3. Restart the server\n');

    process.exit(1);
  }
}

/**
 * Parse and cast environment variables to correct types.
 */
function parseEnvironment(): Environment {
  return {
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    PORT: parseInt(process.env.PORT || '3001', 10),
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

    // Supabase (required)
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',

    // AI Provider (required)
    AI_PROVIDER: (process.env.AI_PROVIDER as any) || 'gemini',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4-turbo',

    // Optional
    ONBOARDING_PROMPT_PREFIX: process.env.ONBOARDING_PROMPT_PREFIX,
  };
}

/**
 * Log configuration status (safe - no secrets exposed).
 * Only shows the keys that are set, not their values.
 */
function logConfiguration(env: Environment): void {
  console.log('\n✅ Environment Configuration Loaded:\n');

  // Safe logging - show keys, hide values
  console.log(`   [SERVER]`);
  console.log(`   • NODE_ENV: ${env.NODE_ENV}`);
  console.log(`   • PORT: ${env.PORT}`);
  console.log(`   • CORS_ORIGIN: ${env.CORS_ORIGIN}`);

  console.log(`\n   [SUPABASE]`);
  console.log(`   • SUPABASE_URL: ${env.SUPABASE_URL ? '✓ configured' : '✗ MISSING'}`);
  console.log(
    `   • SUPABASE_ANON_KEY: ${env.SUPABASE_ANON_KEY ? '✓ configured' : '✗ MISSING'}`
  );

  console.log(`\n   [AI PROVIDER]`);
  console.log(`   • AI_PROVIDER: ${env.AI_PROVIDER}`);

  if (env.AI_PROVIDER === 'gemini') {
    console.log(`   • GEMINI_MODEL: ${env.GEMINI_MODEL}`);
    console.log(`   • GEMINI_API_KEY: ${env.GEMINI_API_KEY ? '✓ configured' : '✗ MISSING'}`);
  }

  if (env.AI_PROVIDER === 'openai') {
    console.log(`   • OPENAI_MODEL: ${env.OPENAI_MODEL}`);
    console.log(`   • OPENAI_API_KEY: ${env.OPENAI_API_KEY ? '✓ configured' : '✗ MISSING'}`);
  }

  console.log(`\n   [OPTIONAL]`);
  console.log(
    `   • ONBOARDING_PROMPT_PREFIX: ${env.ONBOARDING_PROMPT_PREFIX ? '✓ configured' : '✗ using default'}`
  );

  console.log('\n');
}

// ─── Initialize & export ─────────────────────────────────────────────────────

// Validate environment variables (will exit if required vars are missing)
validateEnvironment();

// Parse environment variables
const env = parseEnvironment();

// Log configuration (for debugging)
logConfiguration(env);

// Export as singleton
export default env;
