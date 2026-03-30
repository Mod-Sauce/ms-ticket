import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; template?: string; page?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabase();
  const query = params.q || "";
  const template = params.template || "";
  const page = Math.max(1, parseInt(params.page || "1"));
  const perPage = 20;
  const offset = (page - 1) * perPage;

  let dbQuery = supabase
    .from("tickets")
    .select("id, title, status, template_slug, created_at, profiles(username, avatar_url)", {
      count: "exact",
    })
    .eq("visibility", "open")
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  if (template) {
    dbQuery = dbQuery.eq("template_slug", template);
  }

  const { data: tickets, count } = await dbQuery;

  const { data: templates } = await supabase
    .from("templates")
    .select("slug, name")
    .order("name");

  const totalPages = Math.ceil((count || 0) / perPage);

  // Client-side search filter (for now, since full-text search needs setup)
  let filteredTickets = tickets || [];
  if (query) {
    const q = query.toLowerCase();
    filteredTickets = filteredTickets.filter((t: any) =>
      t.title.toLowerCase().includes(q)
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Support Tickets</h1>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition">
              Login
            </Link>
            <Link href="/register" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition">
              Register
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form className="flex-1" method="GET">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search tickets..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            {template && <input type="hidden" name="template" value={template} />}
          </form>
          <form>
            <select
              name="template"
              defaultValue={template}
              onChange={(e) => e.target.form?.submit()}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All types</option>
              {templates?.map((t: any) => (
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

        {/* Ticket List */}
        <div className="space-y-3">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {query ? "No tickets match your search" : "No open tickets yet"}
            </div>
          ) : (
            filteredTickets.map((ticket: any) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="block p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        ticket.status === "open" ? "bg-green-900 text-green-300" :
                        ticket.status === "pending" ? "bg-yellow-900 text-yellow-300" :
                        "bg-gray-700 text-gray-300"
                      }`}>
                        {ticket.status}
                      </span>
                      <span className="text-xs text-gray-500">{ticket.template_slug}</span>
                    </div>
                    <h3 className="font-medium text-white truncate">{ticket.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      by {ticket.profiles?.username || "unknown"}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {page > 1 && (
              <a
                href={`/?q=${query}&template=${template}&page=${page - 1}`}
                className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-gray-300 hover:bg-gray-700"
              >
                ← Prev
              </a>
            )}
            <span className="px-3 py-1 text-gray-400">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <a
                href={`/?q=${query}&template=${template}&page=${page + 1}`}
                className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-gray-300 hover:bg-gray-700"
              >
                Next →
              </a>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
