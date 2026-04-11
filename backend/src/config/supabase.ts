import { createClient, SupabaseClient } from '@supabase/supabase-js';
import env from './env';

/**
 * Supabase client initialized with validated environment variables.
 * Environment validation happens in env.ts, so we can safely use these values.
 */
const supabase: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

export default supabase;
