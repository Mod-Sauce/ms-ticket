import { getSession } from "@/lib/auth-session";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAllTemplates } from "@/lib/templates";
import Link from "next/link";
import TicketCreateForm from "@/components/TicketCreateForm";

export const dynamic = "force-dynamic";

export default async function NewTicketPage() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">You need to be logged in to create a ticket</p>
          <Link href="/login?redirect=/tickets/new" className="text-blue-400 hover:text-blue-300">
            Login
          </Link>
        </div>
      </div>
    );
  }

  const templates = getAllTemplates();

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.userId)
    .single();

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">← Back</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Create New Ticket</h1>
        <TicketCreateForm templates={templates} userId={session.userId} profile={profile} />
      </main>
    </div>
  );
}
