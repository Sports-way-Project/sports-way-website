import { useState } from "react";
import { useAdminModal } from "./AdminModal";
import { AdminHero } from "./AdminHero";

export function AdminAttributes({ products = [], attributes, onAdd, onUpdate, onRemove }) {
  const { showAlert, showConfirm } = useAdminModal();
  const [name, setName] = useState("");
  const [valuesText, setValuesText] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValuesText, setEditValuesText] = useState("");

  function parseValues(text) {
    return [...new Set(text.split(",").map(v => v.trim()).filter(Boolean))];
  }

  function handleAdd(e) {
    e.preventDefault();
    const trimmedName = name.trim();
    const values = parseValues(valuesText);
    if (!trimmedName || !values.length) return;
    if (attributes.some(a => a.name.toLowerCase() === trimmedName.toLowerCase())) {
      showAlert(`An attribute named "${trimmedName}" already exists.`, { type: "warning", title: "Duplicate attribute" });
      return;
    }
    onAdd({ name: trimmedName, values });
    setName("");
    setValuesText("");
  }

  function beginEdit(index, attribute) {
    setEditingIndex(index);
    setEditValuesText(attribute.values.join(", "));
  }

  function commitEdit(index) {
    const values = parseValues(editValuesText);
    if (!values.length) return;
    onUpdate(index, { values });
    setEditingIndex(null);
  }

  async function handleRemove(index, attribute) {
    const count = products.filter(p => (p.attributes || []).some(a => a.name === attribute.name)).length;
    if (count > 0) {
      await showAlert(
        `"${attribute.name}" is used by ${count} product${count > 1 ? "s" : ""}. Their existing variations keep working, but you won't be able to generate new ones from it once removed.`,
        { type: "warning", title: "Attribute in use" }
      );
    }
    const ok = await showConfirm(`Remove attribute "${attribute.name}"?`, { title: "Remove attribute", okLabel: "Remove" });
    if (!ok) return;
    onRemove(index);
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <AdminHero
        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>}
        title="Attributes"
        subtitle="Define reusable options like Size or Color once, then pick them per-product to generate variations."
      />

      {/* Add attribute card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <h2 className="text-sm font-bold text-slate-800">Add New Attribute</h2>
        </div>
        <form onSubmit={handleAdd} className="p-6 flex flex-wrap gap-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Attribute name (e.g. Size, Color)" required
            className="w-52 h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 transition-all" />
          <input value={valuesText} onChange={e => setValuesText(e.target.value)} placeholder="Values, comma separated (e.g. S, M, L, XL)" required
            className="flex-1 min-w-[220px] h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 transition-all" />
          <button style={{ cursor:"pointer" }} type="submit"
            className="h-11 px-6 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm shadow-brand-200">
            Add Attribute
          </button>
        </form>
      </div>

      {/* List */}
      {attributes.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3 mx-auto">
            <svg width="24" height="24" fill="none" stroke="#94a3b8" strokeWidth="1.75" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          </div>
          <p className="text-sm font-semibold text-slate-500">No attributes yet</p>
          <p className="text-xs text-slate-400 mt-1">Add your first attribute above, e.g. Size or Color</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {attributes.map((attribute, index) => {
            const usedCount = products.filter(p => (p.attributes || []).some(a => a.name === attribute.name)).length;
            const isEditing = editingIndex === index;
            return (
              <div key={attribute.name} className="group bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 hover:border-slate-300 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-800">{attribute.name}</p>
                  <span className="px-2.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-400 text-[10px] font-semibold rounded-full">
                    {usedCount} product{usedCount !== 1 ? "s" : ""}
                  </span>
                </div>

                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <input value={editValuesText} onChange={e => setEditValuesText(e.target.value)}
                      className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-brand-400" />
                    <div className="flex gap-2">
                      <button style={{ cursor:"pointer" }} onClick={() => commitEdit(index)}
                        className="flex-1 h-8 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors">Save</button>
                      <button style={{ cursor:"pointer" }} onClick={() => setEditingIndex(null)}
                        className="flex-1 h-8 text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {attribute.values.map(v => (
                      <span key={v} className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold rounded-full">{v}</span>
                    ))}
                  </div>
                )}

                {!isEditing && (
                  <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button style={{ cursor:"pointer" }} onClick={() => beginEdit(index, attribute)}
                      className="flex-1 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                      Edit values
                    </button>
                    <button style={{ cursor:"pointer" }} onClick={() => handleRemove(index, attribute)}
                      className="flex-1 py-1.5 text-xs font-semibold text-red-400 border border-red-100 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all">
                      Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
