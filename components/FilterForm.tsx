"use client";
import Link from "next/link";

interface FilterFormProps {
  templates: Array<{ slug: string; name: string }>;
  currentTemplate: string;
  currentQuery: string;
}

export default function FilterForm({ templates, currentTemplate, currentQuery }: FilterFormProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <form className="flex-1" method="GET">
        <input
          type="text"
          name="q"
          defaultValue={currentQuery}
          placeholder="Search tickets..."
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        {currentTemplate && <input type="hidden" name="template" value={currentTemplate} />}
      </form>
      <form>
        <select
          name="template"
          defaultValue={currentTemplate}
          onChange={(e) => e.target.form?.submit()}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">All types</option>
          {templates.map((t) => (
            <option key={t.slug} value={t.slug}>{t.name}</option>
          ))}
        </select>
      </form>
      <Link
        href="/tickets/new"
        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition whitespace-nowrap"
      >
        + New Ticket
      </Link>
    </div>
  );
}
