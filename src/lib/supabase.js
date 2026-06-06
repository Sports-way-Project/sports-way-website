import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://punmneggsgjohiaqjeki.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_KITvs_SidyVS_yinTahmrQ_MhZi3IJX";
const DEFAULT_STORAGE_BUCKET = "product-images";

function readWindowValue(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  return window[key] || fallback;
}

export const SUPABASE_URL = readWindowValue("SUPABASE_URL", DEFAULT_SUPABASE_URL);
export const SUPABASE_ANON_KEY = readWindowValue("SUPABASE_ANON_KEY", DEFAULT_SUPABASE_ANON_KEY);
export const SUPABASE_STORAGE_BUCKET = readWindowValue("SUPABASE_STORAGE_BUCKET", DEFAULT_STORAGE_BUCKET);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
