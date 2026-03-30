"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Template, TemplateField } from "@/lib/templates";
import FieldRenderer from "./FieldRenderer";
import { validateForm, ValidationError } from "@/lib/validation";

interface TicketCreateFormProps {
  templates: Template[];
  userId: string;
  profile: any;
}

export default function TicketCreateForm({ templates, userId, profile }: TicketCreateFormProps) {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [title, setTitle] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fieldFileUrls, setFieldFileUrls] = useState<Record<string, string>>({});
  const [uploadLoading, setUploadLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const template = templates.find((t) => t.slug === selectedTemplate);

  const handleFieldChange = (name: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  const handleFileUpload = (name: string, url: string) => {
    setFieldFileUrls((prev) => ({ ...prev, [name]: url }));
    setUploadLoading((prev) => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!template) return;

    // Validate
    const validationErrors = validateForm(fieldValues, template.fields);
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      validationErrors.forEach((err: ValidationError) => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      return;
    }

    setLoading(true);

    try {
      const fieldsPayload = template.fields
        .filter((f: TemplateField) => fieldValues[f.name] || fieldFileUrls[f.name])
        .map((f: TemplateField) => ({
          name: f.name,
          value: fieldValues[f.name] || "",
          file_url: fieldFileUrls[f.name] || null,
        }));

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          template_slug: selectedTemplate,
          fields: fieldsPayload,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create ticket");
      }

      const ticket = await res.json();
      router.push(`/tickets/${ticket.id}`);
    } catch (err: any) {
      setGeneralError(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Ticket Type
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {templates.map((t) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => {
                setSelectedTemplate(t.slug);
                setFieldValues({});
                setErrors({});
              }}
              className={`p-4 rounded-xl border text-left transition ${
                selectedTemplate === t.slug
                  ? "border-blue-500 bg-blue-950/30"
                  : "border-gray-700 bg-gray-900 hover:border-gray-600"
              }`}
            >
              <div className="font-medium text-white">{t.name}</div>
              {t.description && (
                <div className="text-sm text-gray-400 mt-1">{t.description}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {template && (
        <>
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary of your issue"
              required
              maxLength={100}
              className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition ${
                errors.title ? "border-red-500" : "border-gray-700"
              }`}
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Template Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-300 border-b border-gray-800 pb-2">
              Details
            </h3>
            {template.fields.map((field: TemplateField) => (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                <FieldRenderer
                  field={field}
                  value={fieldValues[field.name] || ""}
                  onChange={(val) => handleFieldChange(field.name, val)}
                  error={errors[field.name]}
                  fileUrl={fieldFileUrls[field.name]}
                  onFileUpload={(url) => handleFileUpload(field.name, url)}
                  uploadLoading={uploadLoading[field.name]}
                />
              </div>
            ))}
          </div>

          {generalError && (
            <p className="text-red-400 text-sm bg-red-950/30 border border-red-900 rounded-lg px-4 py-2">
              {generalError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? "Creating ticket..." : "Submit Ticket"}
          </button>
        </>
      )}
    </form>
  );
}
