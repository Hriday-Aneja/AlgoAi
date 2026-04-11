import supabase from '../config/supabase';

/**
 * HealthService - verifies the Supabase connection is live.
 * This service can be imported and used by other services as a shared DB client.
 */
export const pingDatabase = async (): Promise<boolean> => {
  try {
    // Lightweight query to verify the connection - check auth service
    const { error } = await supabase.auth.getSession();
    return !error;
  } catch {
    return false;
  }
};

export default supabase;
