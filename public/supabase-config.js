// ─── Supabase Configuration ─────────────────────────────────────────────────
window.SUPABASE_URL = 'https://punmneggsgjohiaqjeki.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_KITvs_SidyVS_yinTahmrQ_MhZi3IJX';
// Supabase Storage bucket for product images (create this bucket in Supabase)
window.SUPABASE_STORAGE_BUCKET = window.SUPABASE_STORAGE_BUCKET || 'product-images';

// Initialize the Supabase client globally
if (window.supabase && !window.supabaseClient) {
  window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  console.log('✅ Supabase initialized');
} else if (!window.supabase) {
  console.warn('Supabase script not loaded yet.');
}

// For backwards compatibility with existing scripts
var supabase = window.supabaseClient;
