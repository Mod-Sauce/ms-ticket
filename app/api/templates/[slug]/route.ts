import { getSession } from "@/lib/auth-session";
import { getTemplate, saveTemplate } from "@/lib/templates";
import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const template = getTemplate(slug);
  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(template);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
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
  const template = saveTemplate(slug, body);
  return NextResponse.json(template);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
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

  const fs = require("fs");
  const path = require("path");
  const filePath = path.join(process.cwd(), "templates", `${slug}.md`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return NextResponse.json({ success: true });
}
