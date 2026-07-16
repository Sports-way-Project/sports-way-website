import { useMemo, useState } from "react";
import { showConfirm } from "../../lib/dialog.jsx";
import { isSuperAdmin } from "../../lib/roles";
import { AdminHero } from "./AdminHero";

export function AdminManageAdmins({ admins, users, currentUser, onPromote, onDemote, onDelete, onCreate }) {
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "", role: "admin" });
  const [creating, setCreating] = useState(false);

  const adminIds = useMemo(() => new Set(admins.map((a) => a.id)), [admins]);

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return users
      .filter((u) => !adminIds.has(u.id))
      .filter((u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [users, search, adminIds]);

  async function withBusy(id, fn) {
    if (busyId) return;
    setBusyId(id);
    try {
      await fn();
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateAdmin(e) {
    e.preventDefault();
    if (creating) return;
    if (!newAdmin.email.trim() || newAdmin.password.length < 6) return;
    const ok = await showConfirm(
      `Create a new ${newAdmin.role} account for ${newAdmin.email}? They will be able to log in immediately with the password you set.`,
      { title: "Create admin account", confirmText: "Create" },
    );
    if (!ok) return;
    setCreating(true);
    try {
      await onCreate({ ...newAdmin, email: newAdmin.email.trim() });
      setNewAdmin({ name: "", email: "", password: "", role: "admin" });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <AdminHero
        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
        title="Manage Admins"
        subtitle={`${admins.length} admin account${admins.length === 1 ? "" : "s"} · superadmin only`}
      />

      {/* Create a new admin from scratch */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <p className="text-sm font-bold text-slate-800 mb-3">Create a new admin account</p>
        <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Name</label>
            <input
              value={newAdmin.name}
              onChange={(e) => setNewAdmin((c) => ({ ...c, name: e.target.value }))}
              className="mt-1 w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:border-brand-400 rounded-xl text-sm outline-none"
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
            <input
              type="email"
              required
              value={newAdmin.email}
              onChange={(e) => setNewAdmin((c) => ({ ...c, email: e.target.value }))}
              className="mt-1 w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:border-brand-400 rounded-xl text-sm outline-none"
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newAdmin.password}
              onChange={(e) => setNewAdmin((c) => ({ ...c, password: e.target.value }))}
              className="mt-1 w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:border-brand-400 rounded-xl text-sm outline-none"
            />
          </div>
          <div className="md:col-span-1 flex gap-2">
            <select
              value={newAdmin.role}
              onChange={(e) => setNewAdmin((c) => ({ ...c, role: e.target.value }))}
              className="h-10 px-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none cursor-pointer"
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
            <button
              type="submit"
              disabled={creating}
              style={{ cursor: creating ? "not-allowed" : "pointer" }}
              className="flex-1 h-10 px-3 text-xs font-bold rounded-xl bg-slate-900 text-white disabled:opacity-40"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>

      {/* Promote a customer */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <p className="text-sm font-bold text-slate-800 mb-3">Promote a customer to admin</p>
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full h-12 pl-12 pr-4 bg-white border-2 border-slate-200 focus:border-brand-400 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all cursor-text"
          />
        </div>
        {candidates.length > 0 && (
          <div className="mt-3 border border-slate-100 rounded-xl divide-y divide-slate-50 overflow-hidden">
            {candidates.map((u) => (
              <div key={u.id || u.email} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{u.name || "—"}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>
                <button
                  type="button"
                  disabled={busyId === u.id}
                  style={{ cursor: busyId === u.id ? "not-allowed" : "pointer" }}
                  onClick={async () => {
                    const ok = await showConfirm(`Promote ${u.email} to admin? They will get full access to this dashboard.`, {
                      title: "Promote to admin",
                      confirmText: "Promote",
                    });
                    if (!ok) return;
                    await withBusy(u.id, async () => {
                      await onPromote(u);
                      setSearch("");
                    });
                  }}
                  className="h-8 px-3 text-xs font-bold rounded-lg bg-slate-900 text-white disabled:opacity-40"
                >
                  Promote
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current admins table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-slate-100 bg-slate-50/70">
                {["Admin", "Contact", "Role", "Joined", ""].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-20 text-center">
                  <p className="text-sm font-semibold text-slate-500">No admin accounts yet</p>
                </td></tr>
              ) : admins.map((admin) => {
                const self = admin.id === currentUser?.id;
                const superadmin = isSuperAdmin(admin.role);
                return (
                  <tr key={admin.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                          {(admin.name || admin.email || "?")[0].toUpperCase()}
                        </div>
                        <p className="text-sm font-semibold text-slate-800">{admin.name || "—"}{self ? " (you)" : ""}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><p className="text-xs text-slate-700">{admin.email}</p></td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                        superadmin ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-brand-50 text-brand-600 border-brand-200"
                      }`}>
                        {superadmin ? "Superadmin" : "Admin"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {!self && !superadmin && (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            disabled={busyId === admin.id}
                            style={{ cursor: busyId === admin.id ? "not-allowed" : "pointer" }}
                            onClick={async () => {
                              const ok = await showConfirm(`Demote ${admin.email} back to a regular customer?`, {
                                title: "Demote admin",
                                confirmText: "Demote",
                              });
                              if (!ok) return;
                              await withBusy(admin.id, () => onDemote(admin));
                            }}
                            className="h-8 px-3 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                          >
                            Demote
                          </button>
                          <button
                            type="button"
                            disabled={busyId === admin.id}
                            style={{ cursor: busyId === admin.id ? "not-allowed" : "pointer" }}
                            onClick={async () => {
                              const ok = await showConfirm(
                                `Delete the admin account for ${admin.email}? This removes their login, cart, wishlist and profile entirely. This cannot be undone.`,
                                { title: "Delete admin account", confirmText: "Delete", danger: true },
                              );
                              if (!ok) return;
                              await withBusy(admin.id, () => onDelete(admin));
                            }}
                            title="Delete account"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z"/></svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
