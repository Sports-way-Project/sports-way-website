import { useMemo, useState } from "react";
import { AdminHero } from "./AdminHero";
import { showConfirm } from "../../lib/dialog.jsx";

function stripHtml(html) {
  return (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const PAGE_SIZE = 10;

export function AdminBlogList({ blogs, onAddNew, onView, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  const filtered = useMemo(() => {
    let list = [...blogs].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        stripHtml(b.content).toLowerCase().includes(q)
      );
    }
    return list;
  }, [blogs, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  async function handleDelete(b) {
    const ok = await showConfirm(`Delete "${b.title}"? This cannot be undone.`, {
      title: "Delete blog post",
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    setDeletingId(b.id);
    try {
      await onDelete(b.id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <AdminHero
        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/></svg>}
        title="Blog"
        subtitle={`${blogs.length} post${blogs.length === 1 ? "" : "s"} published`}
        actions={
          <button onClick={onAddNew} style={{ cursor: "pointer" }}
            className="flex items-center gap-2 h-9 px-4 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add New
          </button>
        }
      />

      {/* Search */}
      <div className="relative max-w-md">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search posts by title, author or content..."
          className="w-full h-11 pl-11 pr-4 bg-white border-2 border-slate-200 focus:border-brand-400 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all shadow-sm" />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-slate-100 bg-slate-50/70">
                {["Post", "Author", "Date", ""].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-500">{search ? "No posts match your search" : "No blog posts yet"}</p>
                    {!search && (
                      <button onClick={onAddNew} style={{ cursor: "pointer" }} className="text-xs font-bold text-brand-600 hover:text-brand-700">
                        Write your first post →
                      </button>
                    )}
                  </div>
                </td></tr>
              ) : paged.map(b => (
                <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer"
                  onClick={() => onEdit(b)}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {b.image ? (
                        <img src={b.image} alt={b.title} className="w-14 h-11 object-cover rounded-lg border border-slate-100 flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-11 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-300">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate max-w-xs">{b.title}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-xs">{stripHtml(b.content).slice(0, 80)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">{b.author || "—"}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                    {b.date ? new Date(b.date).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => onView(b)} title="View" style={{ cursor: "pointer" }}
                        className="h-7 px-3 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                        View
                      </button>
                      <button onClick={() => onEdit(b)} title="Edit" style={{ cursor: "pointer" }}
                        className="h-7 px-3 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(b)}
                        disabled={deletingId === b.id}
                        title="Delete"
                        style={{ cursor: deletingId === b.id ? "not-allowed" : "pointer" }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/40">
            <p className="text-xs text-slate-400">{filtered.length} posts &middot; page {page} of {pages}</p>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ cursor: page<=1 ? "not-allowed":"pointer" }}
                className="h-8 px-3 text-xs font-bold rounded-lg border border-slate-200 bg-white disabled:opacity-30 hover:bg-slate-50 transition-colors">Prev</button>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} style={{ cursor: page>=pages ? "not-allowed":"pointer" }}
                className="h-8 px-3 text-xs font-bold rounded-lg border border-slate-200 bg-white disabled:opacity-30 hover:bg-slate-50 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
