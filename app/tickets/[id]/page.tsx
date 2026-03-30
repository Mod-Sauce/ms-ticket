import { createServerSupabase } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates";
import Link from "next/link";
import TicketDetail from "@/components/TicketDetail";

export const dynamic = "force-dynamic";

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*, profiles(username, avatar_url, role, id)")
    .eq("id", id)
    .single();

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Ticket not found</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">← Back to tickets</Link>
        </div>
      </div>
    );
  }

  const { data: fields } = await supabase
    .from("ticket_fields")
    .select("*")
    .eq("ticket_id", id);

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("*, profiles(username, avatar_url, role)")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  const template = getTemplate(ticket.template_slug);
  const isOwner = user && ticket.profiles?.role === "owner";
  const isOwnTicket = user && ticket.user_id === user.id;

  let userProfile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    userProfile = data;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">← Back to tickets</Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <TicketDetail
          ticket={ticket}
          fields={fields || []}
          messages={messages || []}
          template={template}
          currentUser={userProfile}
          isOwner={!!isOwner}
          isOwnTicket={!!isOwnTicket}
        />
      </main>
    </div>
  );
}
