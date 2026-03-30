"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TemplateField } from "@/lib/templates";

interface TemplateEditorProps {
  initialData?: {
    slug?: string;
    name?: string;
    description?: string;
    fields?: TemplateField[];
    content?: string;
  };
  isEdit?: boolean;
}

const FIELD_TYPES = ["text", "textarea", "url", "email", "number", "select", "file", "checkbox"] as const;

export default function TemplateEditor({ initialData, isEdit = false }: TemplateEditorProps) {
  const router = useRouter();
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [fields, setFields] = useState<TemplateField[]>(initialData?.fields || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addField = () => {
    setFields((prev) => [
      ...prev,
      { name: "", label: "", type: "text", required: false },
    ]);
  };

  const removeField = (idx: number) => {
    setFields((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateField = (idx: number, updates: Partial<TemplateField>) => {
    setFields((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, ...updates } : f))
    );
  };

  const handleSave = async () => {
    if (!slug || !name) {
      setError("Slug and name are required");
      return;
    }
    if (fields.some((f) => !f.name || !f.label)) {
      setError("All fields need a name and label");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const method = isEdit ? "PUT" : "POST";
      const url = isEdit ? `/api/templates/${slug}` : "/api/templates";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, description, fields, content: "" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Slug *</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/g, "-"))}
            placeholder="my-template"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Template"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Fields */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">Fields</h3>
          <button
            type="button"
            onClick={addField}
            className="px-3 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300 hover:bg-gray-700 transition"
          >
            + Add Field
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((field, idx) => (
            <div key={idx} className="p-4 bg-gray-900 border border-gray-800 rounded-xl space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateField(idx, { name: e.target.value })}
                    placeholder="field_name"
                    className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(idx, { label: e.target.value })}
                    placeholder="Display Label"
                    className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeField(idx)}
                  className="px-2 py-1.5 text-red-400 hover:bg-red-950 rounded text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <select
                  value={field.type}
                  onChange={(e) => updateField(idx, { type: e.target.value as any })}
                  className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={field.placeholder || ""}
                  onChange={(e) => updateField(idx, { placeholder: e.target.value })}
                  placeholder="Placeholder"
                  className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  value={field.pattern || ""}
                  onChange={(e) => updateField(idx, { pattern: e.target.value })}
                  placeholder="Regex pattern"
                  className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  value={field.patternMessage || ""}
                  onChange={(e) => updateField(idx, { patternMessage: e.target.value })}
                  placeholder="Error message"
                  className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {field.type === "select" && (
                <input
                  type="text"
                  value={field.options?.join(", ") || ""}
                  onChange={(e) => updateField(idx, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                  placeholder="Option 1, Option 2, Option 3"
                  className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              )}

              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={field.required || false}
                  onChange={(e) => updateField(idx, { required: e.target.checked })}
                  className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-blue-500"
                />
                Required field
              </label>
            </div>
          ))}
        </div>

        {fields.length === 0 && (
          <p className="text-center py-6 text-gray-500 text-sm">
            No fields yet. Click &quot;Add Field&quot; to get started.
          </p>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-950/30 border border-red-900 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition disabled:opacity-50"
        >
          {saving ? "Saving..." : isEdit ? "Update Template" : "Create Template"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
