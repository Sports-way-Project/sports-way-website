import { useEffect, useState } from "react";
import { AdminHero } from "./AdminHero";
import { FASTAPI_URL, fetchIntegrationDefaults } from "../../lib/fastapiClient";

function Field({ label, hint, value, onChange, placeholder, secret, showSecret, onToggleSecret }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={secret && !showSecret ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 px-3 pr-16 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-brand-400 transition-all"
        />
        {secret && (
          <button
            type="button"
            onClick={onToggleSecret}
            style={{ cursor: "pointer" }}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-2 text-[10px] font-bold text-slate-400 hover:text-slate-600"
          >
            {showSecret ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export function AdminIntegrationSettings({ settings, onSave, getAccessToken }) {
  // Auto-fetched from the live static config (frontend/public/supabase-config.js,
  // already loaded into window before this page ever renders) — the one value
  // here that genuinely reflects the current deployment, not just a saved note.
  const liveFastapiUrl = FASTAPI_URL;

  const [form, setForm] = useState(() => ({
    ...settings,
    fastapiUrl: settings.fastapiUrl || liveFastapiUrl,
  }));
  const [showSecrets, setShowSecrets] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [defaultsFailed, setDefaultsFailed] = useState(false);

  // If Dolibarr fields have never been saved in Supabase yet, pre-fill them
  // from the backend's actual .env values (via a superadmin-only endpoint)
  // instead of leaving the form blank.
  useEffect(() => {
    const needsDefaults = !settings.dolibarrApiUrl && !settings.dolibarrApiKey && !settings.dolibarrSyncSecret;
    if (!needsDefaults) return;

    let active = true;
    setLoadingDefaults(true);
    (async () => {
      try {
        const token = await getAccessToken?.();
        if (!token) return;
        const defaults = await fetchIntegrationDefaults(token);
        if (!active) return;
        setForm((f) => ({
          ...f,
          dolibarrApiUrl: f.dolibarrApiUrl || defaults.dolibarrApiUrl || "",
          dolibarrApiKey: f.dolibarrApiKey || defaults.dolibarrApiKey || "",
          dolibarrSyncSecret: f.dolibarrSyncSecret || defaults.dolibarrSyncSecret || "",
        }));
      } catch {
        // No backend reachable / not authorized — fields just stay blank,
        // same as before this pre-fill existed. Not alarming enough for a
        // full alert (this is a convenience pre-fill, not a save failure),
        // but worth a quiet inline hint rather than total silence.
        if (active) setDefaultsFailed(true);
      } finally {
        if (active) setLoadingDefaults(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = JSON.stringify(form) !== JSON.stringify(settings);
  const fastapiUrlDrifted = form.fastapiUrl && liveFastapiUrl && form.fastapiUrl !== liveFastapiUrl;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
      <AdminHero
        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>}
        title="Integrations"
        subtitle="FastAPI & Dolibarr connection details — superadmin only"
      />

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700 leading-relaxed">
        <strong>FastAPI Base URL</strong> is auto-read live from <code className="font-mono bg-amber-100 px-1 rounded">window.FASTAPI_URL</code> (set
        in <code className="font-mono bg-amber-100 px-1 rounded">frontend/public/supabase-config.js</code>) — this page will always show
        you if the saved reference drifts from what's actually deployed. Changing it here is reference-only; the actual
        static file still needs updating for the frontend itself to call a different backend.
        <br /><br />
        <strong>Dolibarr fields</strong> are pre-filled from the backend's current <code className="font-mono bg-amber-100 px-1 rounded">.env</code> the
        first time this page loads with nothing saved yet. Once you hit Save, the backend prefers whatever's saved here
        over <code className="font-mono bg-amber-100 px-1 rounded">.env</code> for every Dolibarr call and the Dolibarr sync-secret check — it
        takes effect within ~30 seconds, no restart needed. If a saved value here ever ends up wrong (pointing at the wrong
        Dolibarr instance, a stale API key, etc.), use <strong>"Use file-based (.env) config"</strong> below to clear the
        override and fall back to whatever's actually correct on the server, then Save.
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
        <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">FastAPI Backend</h2>
        <Field
          label="FastAPI Base URL"
          hint="e.g. https://api-sportsway.tisfoulla.com"
          value={form.fastapiUrl}
          onChange={(v) => setForm((f) => ({ ...f, fastapiUrl: v }))}
          placeholder="https://api-sportsway.tisfoulla.com"
        />
        <div className="flex items-center justify-between gap-3 -mt-2 px-3 py-2 bg-slate-50 rounded-xl">
          <p className="text-[11px] text-slate-500">
            Live value from <code className="font-mono">supabase-config.js</code>: <span className="font-mono font-bold text-slate-700">{liveFastapiUrl}</span>
            {fastapiUrlDrifted && <span className="ml-2 text-amber-600 font-bold">⚠ differs from the field above</span>}
          </p>
          {form.fastapiUrl !== liveFastapiUrl && (
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, fastapiUrl: liveFastapiUrl }))}
              style={{ cursor: "pointer" }}
              className="flex-shrink-0 h-7 px-3 text-[11px] font-bold text-brand-600 bg-white border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors"
            >
              Use live value
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">
            Dolibarr ERP {loadingDefaults && <span className="text-slate-400 font-normal normal-case">— loading current .env values…</span>}
            {defaultsFailed && <span className="text-amber-600 font-normal normal-case">— couldn't load .env defaults, fields left blank</span>}
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, dolibarrApiUrl: "", dolibarrApiKey: "", dolibarrSyncSecret: "" }))}
              title="Clears these fields so the backend falls back to its .env file instead of this Supabase override — hit Save afterward to apply"
              style={{ cursor: "pointer" }}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-700"
            >
              Use file-based (.env) config
            </button>
            <button
              type="button"
              onClick={() => setShowSecrets((s) => !s)}
              style={{ cursor: "pointer" }}
              className="text-[11px] font-bold text-brand-600 hover:text-brand-700"
            >
              {showSecrets ? "Hide secrets" : "Show secrets"}
            </button>
          </div>
        </div>
        <Field
          label="Dolibarr API URL"
          hint="e.g. https://erp.tisfoulla.com/api/index.php"
          value={form.dolibarrApiUrl}
          onChange={(v) => setForm((f) => ({ ...f, dolibarrApiUrl: v }))}
          placeholder="https://erp.tisfoulla.com/api/index.php"
        />
        <Field
          label="Dolibarr API Key"
          hint="DOLAPIKEY header used for every Dolibarr REST call"
          value={form.dolibarrApiKey}
          onChange={(v) => setForm((f) => ({ ...f, dolibarrApiKey: v }))}
          placeholder="•••••••••••••••"
          secret
          showSecret={showSecrets}
          onToggleSecret={() => setShowSecrets((s) => !s)}
        />
        <Field
          label="Dolibarr Sync Secret"
          hint="Must match SWWEBSITEORDERS_SYNC_SECRET in the Dolibarr module setup page"
          value={form.dolibarrSyncSecret}
          onChange={(v) => setForm((f) => ({ ...f, dolibarrSyncSecret: v }))}
          placeholder="•••••••••••••••"
          secret
          showSecret={showSecrets}
          onToggleSecret={() => setShowSecrets((s) => !s)}
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          style={{ cursor: !dirty || saving ? "not-allowed" : "pointer" }}
          className="h-10 px-6 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
