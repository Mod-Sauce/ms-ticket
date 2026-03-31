import { getSession } from "@/lib/auth-session";
import { getAllTemplates, saveTemplate } from "@/lib/templates";
import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const templates = getAllTemplates();
  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (profile?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { slug, name, description, fields, content } = body;

  if (!slug || !name) {
    return NextResponse.json({ error: "slug and name required" }, { status: 400 });
  }

  const template = saveTemplate(slug, { name, description, fields, content });
  return NextResponse.json(template, { status: 201 });
}
