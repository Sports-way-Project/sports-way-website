import { useEffect, useState } from "react";
import { downloadExcel, parseExcelFile } from "../../lib/excel";
import { searchDolibarrProducts } from "../../lib/fastapiClient";
import { upsertProducts } from "../../lib/storefrontApi";
import { showAlert } from "../../lib/dialog.jsx";
import { friendlyApiError } from "../../lib/apiError";

// No separate meta_title/meta_description columns — the SEO title/description
// are always derived live from name/short_desc/description (see
// effectiveMetaTitle/effectiveMetaDescription in lib/format.js), so editing
// those two columns here already controls the page's SEO output.
const CSV_HEADERS = ["id", "name", "dolibarr_ref", "dolibarr_id", "short_desc", "description", "brand", "badge", "price", "category"];
const CONCURRENCY = 4;

function productToCsvRow(p) {
  return {
    id: p.id,
    name: p.name || "",
    dolibarr_ref: p.dolibarr_ref || "",
    dolibarr_id: p.dolibarr_id || "",
    short_desc: p.shortDesc || "",
    description: p.description || "",
    brand: p.brand || "",
    badge: p.badge || "",
    price: p.price ?? "",
    category: (p.categories || []).join("|"),
  };
}

export function AdminProductBulkCsv({ products, selectedIds, presetFile, onBack, onImportComplete }) {
  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));

  const [fileRows, setFileRows] = useState(null);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, currentLabel: "" });
  const [result, setResult] = useState(null); // { updatedCount, skipped: [{id, reason}] }

  async function loadFile(file) {
    setFileName(file.name);
    setResult(null);
    try {
      const rows = await parseExcelFile(file);
      if (rows.length === 0) {
        showAlert("That file has no data rows (or couldn't be parsed) — check it still has the header row plus at least one product row.");
        setFileRows(null);
        return;
      }
      setFileRows(rows);
    } catch (err) {
      showAlert("Failed to read that file: " + friendlyApiError(err));
      setFileRows(null);
    }
  }

  // "Upload Excel" quick action on the products list opens straight to this
  // page with the picked file already loaded, skipping the download step.
  useEffect(() => {
    if (presetFile) loadFile(presetFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetFile]);

  async function handleDownloadTemplate() {
    try {
      await downloadExcel(`products-bulk-edit-${Date.now()}.xlsx`, selectedProducts.map(productToCsvRow), CSV_HEADERS);
    } catch (err) {
      showAlert("Failed to generate the Excel file: " + friendlyApiError(err));
    }
  }

  async function handleFilePick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await loadFile(file);
  }

  async function runImport() {
    if (!fileRows || fileRows.length === 0) return;
    setImporting(true);
    setResult(null);

    const total = fileRows.length;
    setProgress({ done: 0, total, currentLabel: "Starting…" });

    const updates = []; // successfully-prepared product updates, applied in one batch at the end
    const skipped = []; // { id, reason } — left completely untouched

    let cursor = 0;
    async function worker() {
      while (cursor < fileRows.length) {
        const row = fileRows[cursor++];
        const rawId = (row.id || "").trim();
        const id = Number(rawId);

        try {
          if (!rawId || Number.isNaN(id)) {
            skipped.push({ id: rawId || "(blank)", reason: "Missing or invalid product id" });
            continue;
          }
          const existing = products.find((p) => p.id === id);
          if (!existing) {
            skipped.push({ id, reason: "No product with this id exists" });
            continue;
          }

          const updated = { ...existing };
          if (row.name?.trim()) updated.name = row.name.trim();
          if (row.short_desc?.trim()) updated.shortDesc = row.short_desc.trim();
          if (row.description?.trim()) updated.description = row.description.trim();
          if (row.brand?.trim()) updated.brand = row.brand.trim();
          if (row.badge?.trim()) updated.badge = row.badge.trim();
          if (row.category?.trim()) {
            const cats = row.category.split("|").map((c) => c.trim()).filter(Boolean);
            if (cats.length) { updated.categories = cats; updated.category = cats[0]; }
          }
          if (row.price?.trim()) {
            const price = Number(row.price);
            if (Number.isNaN(price)) {
              skipped.push({ id, reason: `Invalid price value "${row.price}"` });
              continue;
            }
            updated.price = price;
          }

          // Dolibarr ref linking — only if the CSV's ref differs from what's
          // already saved, and only if it genuinely resolves against a real
          // Dolibarr product; otherwise the existing dolibarr_id/ref are left
          // exactly as they were (per the requested behavior).
          const csvRef = (row.dolibarr_ref || "").trim();
          if (csvRef && csvRef.toLowerCase() !== (existing.dolibarr_ref || "").toLowerCase()) {
            try {
              const results = await searchDolibarrProducts(csvRef);
              const match = (results || []).find((r) => (r.ref || "").toLowerCase() === csvRef.toLowerCase());
              if (match) {
                updated.dolibarr_id = match.dolibarr_id;
                updated.dolibarr_ref = match.ref;
              }
              // No match: dolibarr_id/dolibarr_ref simply stay as `existing`'s values (already copied above).
            } catch {
              // Dolibarr/FastAPI unreachable for this one lookup — don't fail
              // the whole row over it, just leave the Dolibarr link untouched.
            }
          }

          updates.push(updated);
        } finally {
          setProgress((p) => ({ done: p.done + 1, total, currentLabel: `${p.done + 1}/${total}` }));
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, fileRows.length) }, worker));

    try {
      if (updates.length > 0) {
        const nextProducts = await upsertProducts(updates);
        onImportComplete?.(nextProducts);
      }
      setResult({ updatedCount: updates.length, skipped });
    } catch (err) {
      showAlert("Import failed while saving: " + friendlyApiError(err));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} style={{ cursor: "pointer" }}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <h1 className="text-lg font-black text-slate-900">Bulk Edit via Excel</h1>
          <p className="text-xs text-slate-400">{selectedProducts.length} product{selectedProducts.length !== 1 ? "s" : ""} selected</p>
        </div>
      </div>

      {/* Step 1: download */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-3">
        <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">Step 1 — Download</h2>
        <p className="text-sm text-slate-500">Download an Excel file of the selected products, edit the fields you want (in Excel, Google Sheets, Numbers, etc.), then upload it below.</p>
        <button onClick={handleDownloadTemplate} disabled={selectedProducts.length === 0}
          style={{ cursor: selectedProducts.length === 0 ? "not-allowed" : "pointer" }}
          className="h-10 px-5 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-40">
          Download Excel ({selectedProducts.length} rows)
        </button>
        <p className="text-[11px] text-slate-400">
          Columns: <code className="font-mono">{CSV_HEADERS.join(", ")}</code>. Leave a cell blank to keep that field unchanged.
          For <code className="font-mono">dolibarr_ref</code>, only change it if you want to (re)link the product to a different Dolibarr product —
          on upload it's checked against Dolibarr, and only applied if a product with that ref genuinely exists there; otherwise the
          existing Dolibarr link is left exactly as it was.
          The page's SEO title/description are generated automatically from <code className="font-mono">name</code>/<code className="font-mono">short_desc</code> —
          editing those columns already controls it, no separate SEO columns needed.
        </p>
      </div>

      {/* Step 2: upload */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-3">
        <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">Step 2 — Upload edited Excel file</h2>
        <label className="flex items-center justify-center gap-2 h-11 px-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer transition-colors">
          {fileName || "Choose Excel file…"}
          <input type="file" accept=".xlsx,.xls" hidden onChange={handleFilePick} disabled={importing} />
        </label>
        {fileRows && !importing && !result && (
          <p className="text-xs text-slate-500">{fileRows.length} row{fileRows.length !== 1 ? "s" : ""} ready to import.</p>
        )}
      </div>

      {/* Step 3: import */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">Step 3 — Import</h2>

        {!importing && !result && (
          <button onClick={runImport} disabled={!fileRows || fileRows.length === 0}
            style={{ cursor: !fileRows ? "not-allowed" : "pointer" }}
            className="h-10 px-6 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm disabled:opacity-40">
            Start Import
          </button>
        )}

        {importing && (
          <div className="space-y-2">
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 transition-all duration-200"
                style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 font-semibold">Processing {progress.done} / {progress.total}…</p>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              {result.updatedCount} product{result.updatedCount !== 1 ? "s" : ""} updated successfully.
            </div>
            {result.skipped.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-sm font-bold text-amber-700 mb-2">{result.skipped.length} row(s) skipped — left unchanged:</p>
                <ul className="space-y-1 max-h-48 overflow-y-auto">
                  {result.skipped.map((s, i) => (
                    <li key={i} className="text-xs text-amber-700">
                      <span className="font-mono font-bold">#{s.id}</span> — {s.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button onClick={onBack} style={{ cursor: "pointer" }}
              className="h-10 px-6 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
              Back to Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
