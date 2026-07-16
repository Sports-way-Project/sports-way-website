export function AdminBlogView({ post, onBack, onEdit }) {
  if (!post) return null;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <button onClick={onBack} style={{ cursor: "pointer" }}
          className="flex items-center gap-2 h-9 px-4 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Posts
        </button>
        <button onClick={() => onEdit(post)} style={{ cursor: "pointer" }}
          className="flex items-center gap-2 h-9 px-4 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
          Edit Post
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {post.image && (
          <img src={post.image} alt={post.title} className="w-full h-64 object-cover" />
        )}
        <div className="p-8">
          <h1 className="text-3xl font-black text-slate-900 mb-3 leading-tight">{post.title}</h1>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold border-b border-slate-100 pb-5 mb-6">
            {post.author && <span>By {post.author}</span>}
            {post.author && post.date && <span>&middot;</span>}
            {post.date && <span>{new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>}
          </div>
          <div className="blog-body" dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
      </div>
    </div>
  );
}
