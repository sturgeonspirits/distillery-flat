import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminKey, getSupabaseUrl } from "@/lib/env";

export const supabaseAdmin = createClient(
  getSupabaseUrl(),
  getSupabaseAdminKey(),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
