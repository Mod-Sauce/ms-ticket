import { getSession } from "@/lib/auth-session";
import { createAdminSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  console.log("[ADMIN] Session data:", session);

  // Use admin client to bypass RLS completely
  const supabase = await createAdminSupabase();

  // Get user profile to check if owner
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.userId)
    .single();

  console.log("[ADMIN] Profile role:", profile?.role);

  if (profile?.role !== "owner") {
    redirect("/dashboard");
  }

  // Get ALL tickets using admin client
  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("id, title, status, visibility, created_at, user_id, profiles(username, avatar_url)")
    .order("created_at", { ascending: false });

  console.log("[ADMIN] Found tickets:", tickets?.length, "Error:", error?.message);

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Admin - All Tickets</h1>
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 p-4 bg-purple-900/20 border border-purple-800 rounded-lg">
          <p className="text-purple-300 text-sm">
            👑 Owner View - You can see all tickets (public and private)
          </p>
          <p className="text-purple-400 text-xs mt-1">
            Session Role: <strong>{session.role}</strong> | Profile Role: <strong>{profile?.role}</strong>
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Creator</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Visibility</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {tickets && tickets.length > 0 ? (
                tickets.map((ticket: any) => (
                  <tr key={ticket.id} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-white">{ticket.title}</td>
                    <td className="px-4 py-3 text-gray-400">{ticket.profiles?.username || "Unknown"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        ticket.status === "open" ? "bg-green-900 text-green-300" :
                        ticket.status === "pending" ? "bg-yellow-900 text-yellow-300" :
                        "bg-gray-700 text-gray-300"
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        ticket.visibility === "open" ? "bg-green-900 text-green-300" :
                        "bg-gray-700 text-gray-400"
                      }`}>
                        {ticket.visibility === "open" ? "👁️ Public" : "🔒 Private"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {new Date(ticket.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    {error ? `Error: ${error}` : "No tickets found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-gray-900 border border-gray-800 rounded-lg">
          <h3 className="text-white font-medium mb-2">Debug Info:</h3>
          <div className="text-xs text-gray-400 font-mono space-y-1">
            <p>Total tickets: {tickets?.length || 0}</p>
            <p>Public tickets: {tickets?.filter((t: any) => t.visibility === "open").length || 0}</p>
            <p>Private tickets: {tickets?.filter((t: any) => t.visibility === "internal").length || 0}</p>
            <p>Using admin client: Yes (bypasses RLS)</p>
          </div>
        </div>
      </main>
    </div>
  );
}
