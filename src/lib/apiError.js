// Backend errors often arrive as nested JSON-in-a-string, e.g.:
//   FastAPI 502: {"detail":"Supabase rejected the request (422): {\"code\":422,
//   \"error_code\":\"email_exists\",\"msg\":\"A user with this email address
//   has already been registered\"}. Check SUPABASE_URL..."}
// This pulls out just the human-readable "msg"/"detail" text so the UI never
// shows raw JSON or "Check SUPABASE_URL..." developer hints to an admin.
export function friendlyApiError(err) {
  const raw = err?.message || String(err || "");

  // Innermost Supabase-style {"msg": "..."} blob, if present.
  const msgMatch = raw.match(/"msg"\s*:\s*"([^"]+)"/);
  if (msgMatch) return msgMatch[1];

  // Otherwise fall back to the FastAPI "detail" field, trimmed of the
  // "Check SUPABASE_URL/.env" developer hint that trails config errors.
  const detailMatch = raw.match(/"detail"\s*:\s*"([^"]+)"/);
  if (detailMatch) {
    return detailMatch[1].split(". Check ")[0];
  }

  // Already a plain message (no JSON at all) — use as-is.
  if (raw && !raw.includes("{") && !raw.startsWith("FastAPI")) {
    return raw;
  }

  return "Something went wrong. Please try again.";
}
