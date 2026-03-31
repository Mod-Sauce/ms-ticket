import { getSession } from "@/lib/auth-session";
import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const type = formData.get("type") as string; // "avatars" or "uploads"

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  // Validate type
  const allowedTypes = type === "avatars"
    ? ["image/jpeg", "image/png", "image/gif", "image/webp"]
    : ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/plain", "application/zip"];
  
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "bin";
  const filename = `${session.userId}/${Date.now()}.${ext}`;

  const supabase = await createServerSupabase();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { data, error } = await supabase.storage
    .from(type)
    .upload(filename, buffer, { contentType: file.type, upsert: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(type).getPublicUrl(filename);

  return NextResponse.json({ url: urlData.publicUrl });
}
