"use client";
import { useState } from "react";
import { TemplateField } from "@/lib/templates";

interface FieldRendererProps {
  field: TemplateField;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  fileUrl?: string;
  onFileUpload?: (url: string) => void;
  uploadLoading?: boolean;
}

export default function FieldRenderer({
  field,
  value = "",
  onChange,
  error,
  fileUrl,
  onFileUpload,
  uploadLoading = false,
}: FieldRendererProps) {
  const baseClass = `w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition`;
  const errorClass = error ? "border-red-500" : "border-gray-700";

  switch (field.type) {
    case "textarea":
      return (
        <div>
          <textarea
            id={field.name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            maxLength={field.maxLength}
            className={`${baseClass} ${errorClass} resize-none`}
          />
          {field.maxLength && (
            <p className="text-xs text-gray-500 mt-1 text-right">
              {value.length}/{field.maxLength}
            </p>
          )}
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
      );

    case "select":
      return (
        <div>
          <select
            id={field.name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseClass} ${errorClass}`}
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
      );

    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={field.name}
            checked={value === "true"}
            onChange={(e) => onChange(e.target.checked ? "true" : "false")}
            className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-blue-500 focus:ring-blue-500"
          />
          <label htmlFor={field.name} className="text-sm text-gray-300">
            {field.label}
          </label>
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
      );

    case "file":
      return (
        <div>
          {fileUrl && (
            <p className="text-sm text-green-400 mb-2">
              ✓ Uploaded: <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="underline">{fileUrl.split("/").pop()}</a>
            </p>
          )}
          <input
            type="file"
            id={field.name}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !onFileUpload) return;

              const formData = new FormData();
              formData.append("file", file);
              formData.append("type", "uploads");

              try {
                const res = await fetch("/api/upload", {
                  method: "POST",
                  body: formData,
                });
                const data = await res.json();
                if (data.url) {
                  onFileUpload(data.url);
                }
              } catch {}
            }}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-600 file:text-gray-300 file:bg-gray-800 hover:file:bg-gray-700"
          />
          {uploadLoading && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
      );

    default:
      return (
        <div>
          <input
            type={field.type === "number" ? "number" : field.type === "url" ? "url" : field.type === "email" ? "email" : "text"}
            id={field.name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            className={`${baseClass} ${errorClass}`}
          />
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
      );
  }
}
