import { useState } from "react";
import { RichTextEditor } from "./RichTextEditor";
import { uploadBlobToStorage } from "../../lib/storefrontApi";

export function AdminBlogEditor({ post, currentUser, onSave, onCancel }) {
  const isEdit = !!post?.id;
  const defaultAuthor = currentUser?.email || "Admin";

  const [title, setTitle] = useState(post?.title || "");
  const [author, setAuthor] = useState(post?.author || "");
  const [date, setDate] = useState(post?.date ? new Date(post.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
  const [content, setContent] = useState(post?.content || "");
  const [image, setImage] = useState(post?.image || "");
  const [imgFile, setImgFile] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleInlineImageUpload(file) {
    return uploadBlobToStorage(file, "webp", "blogs/inline");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await onSave(
        {
          id: post?.id || "",
          title: title.trim(),
          author: author.trim() || defaultAuthor,
          date,
          content,
          image,
        },
        imgFile
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} style={{ cursor: "pointer" }}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900">{isEdit ? "Edit Post" : "Add New Post"}</h1>
            <p className="text-xs text-slate-400">{isEdit ? "Update this blog post" : "Write and publish a new blog post"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} style={{ cursor: "pointer" }}
            className="h-10 px-5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving || !title.trim() || !content.trim()}
            style={{ cursor: saving ? "wait" : "pointer" }}
            className="h-10 px-6 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm disabled:opacity-50">
            {saving ? "Saving..." : isEdit ? "Update Post" : "Publish Post"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <input
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter post title…"
            className="w-full text-2xl font-black text-slate-900 placeholder-slate-300 outline-none border-b-2 border-transparent focus:border-brand-400 pb-2 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Content editor */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Content *</label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              onImageUpload={handleInlineImageUpload}
              placeholder="Write your blog post content here…"
            />
          </div>

          {/* Sidebar: publish settings */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">Post Details</h2>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Author</label>
                <input value={author} onChange={e => setAuthor(e.target.value)} placeholder={defaultAuthor}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-400 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-400 transition-all" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-3">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">Cover Image</h2>
              {(imgFile || image) && (
                <img
                  src={imgFile ? URL.createObjectURL(imgFile) : image}
                  alt="cover preview"
                  className="w-full h-32 object-cover rounded-xl border border-slate-100"
                />
              )}
              <label className="flex items-center justify-center gap-2 h-10 px-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer transition-colors">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                {imgFile ? imgFile.name.slice(0, 22) + (imgFile.name.length > 22 ? "…" : "") : image ? "Replace image" : "Upload cover image"}
                <input type="file" accept="image/*" hidden onChange={e => setImgFile(e.target.files[0] || null)} />
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
