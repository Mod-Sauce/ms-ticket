import { getSession } from "@/lib/auth-session";
import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { avatar_url } = body;

  const supabase = await createServerSupabase();

  // Check if user is owner
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (profile?.role !== "owner") {
    return NextResponse.json({ error: "Only owners can upload custom avatars" }, { status: 403 });
  }

  // Update avatar URL
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url })
    .eq("id", session.userId);

  if (error) {
    return NextResponse.json({ error: "Failed to update avatar" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
