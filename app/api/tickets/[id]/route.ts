import { createServerSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*, profiles(username, avatar_url, role)")
    .eq("id", id)
    .single();

  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: fields } = await supabase
    .from("ticket_fields")
    .select("*")
    .eq("ticket_id", id);

  return NextResponse.json({ ...ticket, fields });
}

export async function PATCH(
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
  const { status, visibility } = body;

  // Check if user owns ticket or is owner
  const { data: ticket } = await supabase
    .from("tickets")
    .select("user_id, profiles(role)")
    .eq("id", id)
    .single();

  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const canModify =
    ticket.user_id === user.id || profile?.role === "owner";

  if (!canModify) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates: any = {};
  if (status) updates.status = status;
  if (visibility) updates.visibility = visibility;

  const { data, error } = await supabase
    .from("tickets")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
