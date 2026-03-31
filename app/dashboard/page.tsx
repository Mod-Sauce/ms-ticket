import { getSession } from "@/lib/auth-session";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAllTemplates } from "@/lib/templates";
import Link from "next/link";
import TicketListClient from "@/components/TicketListClient";
import ProfileCard from "@/components/ProfileCard";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.userId)
    .single();

  const templates = getAllTemplates();
  const isOwner = profile?.role === "owner";

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">← Back</Link>
          <h1 className="text-lg font-bold text-white">Dashboard</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {isOwner && (
          <section>
            <div className="p-4 bg-purple-900/20 border border-purple-800 rounded-lg mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-purple-300 font-medium">👑 Owner Panel</h3>
                  <p className="text-purple-400 text-sm mt-1">View and manage all tickets</p>
                </div>
                <Link
                  href="/admin/tickets"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition"
                >
                  View All Tickets →
                </Link>
              </div>
            </div>
          </section>
        )}

        {isOwner && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Ticket Templates</h2>
              <Link
                href="/dashboard/templates/new"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition"
              >
                + New Template
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {templates.map((t) => (
                <div key={t.slug} className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                  <div className="font-medium text-white">{t.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{t.slug}</div>
                  {t.description && (
                    <div className="text-sm text-gray-400 mt-2">{t.description}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">{t.fields.length} fields</div>
                  <Link
                    href={`/dashboard/templates/${t.slug}`}
                    className="inline-block mt-3 text-sm text-blue-400 hover:text-blue-300"
                  >
                    Edit →
                  </Link>
                </div>
              ))}
              {templates.length === 0 && (
                <p className="text-gray-500 text-sm col-span-3 text-center py-6">
                  No templates yet. Create your first one!
                </p>
              )}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-bold text-white mb-4">My Tickets</h2>
          <MyTickets userId={session.userId} />
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">Profile</h2>
          <ProfileCard profile={profile} />
        </section>
      </main>
    </div>
  );
}

function MyTickets({ userId }: { userId: string }) {
  return <TicketListClient userId={userId} />;
}
