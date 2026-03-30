import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createServerSupabase();
  const { searchParams } = new URL(request.url);
  const template = searchParams.get("template");
  const status = searchParams.get("status");
  const mine = searchParams.get("mine") === "true";
  const userId = searchParams.get("userId");

  // Handle ?mine=true&userId=X (user's own tickets)
  if (mine && userId) {
    const { data, error } = await supabase
      .from("tickets")
      .select("*, profiles(username, avatar_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  let query = supabase
    .from("tickets")
    .select("*, profiles(username, avatar_url)")
    .eq("visibility", "open")
    .order("created_at", { ascending: false })
    .limit(50);

  if (template) query = query.eq("template_slug", template);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, template_slug, fields: fieldValues } = body;

  if (!title || !template_slug) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Create ticket
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert({
      user_id: user.id,
      title,
      template_slug,
      status: "open",
      visibility: "open",
    })
    .select()
    .single();

  if (ticketError) {
    return NextResponse.json({ error: ticketError.message }, { status: 500 });
  }

  // Insert fields
  if (fieldValues && Array.isArray(fieldValues)) {
    const fieldRows = fieldValues
      .filter((f: any) => f.value || f.file_url)
      .map((f: any) => ({
        ticket_id: ticket.id,
        field_name: f.name,
        field_value: f.value || null,
        file_url: f.file_url || null,
      }));

    if (fieldRows.length > 0) {
      await supabase.from("ticket_fields").insert(fieldRows);
    }
  }

  return NextResponse.json(ticket, { status: 201 });
}
