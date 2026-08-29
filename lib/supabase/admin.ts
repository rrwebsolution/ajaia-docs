import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. Server-only — never import this from a client
 * component or any code path that ships to the browser bundle.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
