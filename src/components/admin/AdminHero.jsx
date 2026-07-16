// Shared hero banner used at the top of every admin page (Dashboard's stat
// grid is its own hero, so it doesn't use this). One component so the look
// — and the "admin-hero-anim" entrance animation, editable in admin.css
// under --admin-motion-duration/--admin-motion-easing — can be changed
// everywhere at once instead of per-page.
export function AdminHero({ icon, title, subtitle, actions }) {
  return (
    <div className="admin-hero-anim relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 to-white border border-brand-100 shadow-md p-6 flex flex-wrap items-center justify-between gap-4">
      <div className="absolute -right-10 -top-10 w-44 h-44 bg-brand-100/50 rounded-full blur-2xl pointer-events-none" />
      <div className="relative flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="relative flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
