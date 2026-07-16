// Supabase configuration shared by every entry page.
window.SUPABASE_URL = "https://lxmqhiookungmzpdqktm.supabase.co";
window.SUPABASE_ANON_KEY = "sb_publishable_FLGmaS2lziTFdjtKa-N9cg_DQrjFtn_";
window.SUPABASE_STORAGE_BUCKET = window.SUPABASE_STORAGE_BUCKET || "product-images";
window.SUPABASE_ADMIN_EMAILS = window.SUPABASE_ADMIN_EMAILS || ["swqmarketing@gmail.com"];

// FastAPI backend base URL — production points at this domain's /api path
// (reverse-proxied by Nginx to the uvicorn process). Falls back to
// localhost:8010 in fastapiClient.js if this line is ever removed.
window.FASTAPI_URL = "https://sportsway.tisfoulla.com/api";
