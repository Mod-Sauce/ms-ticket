import { createServerSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { sendStoatDM } from "@/lib/stoat";

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
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    .select("role, discord_id")
    .eq("id", user.id)
    .single();

  const isOwner = profile?.role === "owner";
  const isOwn = ticket.user_id === user.id;

  // Users can only message their own tickets, owners can message any
  if (!isOwn && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Insert message
  const { data: newMessage, error } = await supabase
    .from("ticket_messages")
    .insert({
      ticket_id: id,
      user_id: user.id,
      message: message.trim(),
      is_staff: isOwner,
    })
    .select("*, profiles(username, avatar_url, role)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If staff replied, notify user via Stoat
  if (isOwner && profile?.discord_id) {
    const ticketUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/tickets/${id}`;
    await sendStoatDM(
      profile.discord_id,
      `💬 New reply on your ticket:\n\n${message.trim()}\n\nView: ${ticketUrl}`
    );
  }

  return NextResponse.json(newMessage, { status: 201 });
}
