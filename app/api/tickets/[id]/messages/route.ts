import { getSession } from "@/lib/auth-session";
import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("*, profiles(username, avatar_url, role)")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json(messages || []);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabase();

  const body = await request.json();
  const { message } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // Get ticket and check access
  const { data: ticket } = await supabase
    .from("tickets")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.userId)
    .single();

  const isOwner = profile?.role === "owner";
  const isOwn = ticket.user_id === session.userId;

  // Users can only message their own tickets, owners can message any
  if (!isOwn && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Insert message
  const { data: newMessage, error } = await supabase
    .from("ticket_messages")
    .insert({
      ticket_id: id,
      user_id: session.userId,
      message: message.trim(),
      is_staff: isOwner,
    })
    .select("*, profiles(username, avatar_url, role)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(newMessage, { status: 201 });
}
