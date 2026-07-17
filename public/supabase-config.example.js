// Template for public/supabase-config.js — copy this file to
// supabase-config.js (gitignored) and fill in the values for THIS
// environment. Never committed/pulled — every environment (local dev, VPS,
// staging, etc.) keeps its own copy so a `git pull` can never silently
// overwrite one environment's FASTAPI_URL with another's.

window.SUPABASE_URL = "https://lxmqhiookungmzpdqktm.supabase.co";
window.SUPABASE_ANON_KEY = "sb_publishable_FLGmaS2lziTFdjtKa-N9cg_DQrjFtn_";
window.SUPABASE_STORAGE_BUCKET = window.SUPABASE_STORAGE_BUCKET || "product-images";
window.SUPABASE_ADMIN_EMAILS = window.SUPABASE_ADMIN_EMAILS || ["swqmarketing@gmail.com"];

// FastAPI backend base URL — set this per environment:
//   local dev:  http://localhost:8010
//   production: https://sportsway.tisfoulla.com/api
window.FASTAPI_URL = "http://localhost:8010";
