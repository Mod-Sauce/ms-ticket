import { createAdminSupabase } from "@/lib/supabase/server";
import { signToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  if (username.length < 3 || username.length > 30) {
    return NextResponse.json({ error: "Username must be 3-30 characters" }, { status: 400 });
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return NextResponse.json({ error: "Username can only contain letters, numbers, and underscores" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const supabase = await createAdminSupabase();

  // Check if username already taken
  const { data: existingUser } = await supabase
    .from("auth_users")
    .select("id")
    .eq("username", username.toLowerCase())
    .single();

  if (existingUser) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Create auth entry
  const { data: authData, error: authError } = await supabase
    .from("auth_users")
    .insert({
      username: username.toLowerCase(),
      password_hash: passwordHash,
    })
    .select("id")
    .single();

  if (authError || !authData) {
    return NextResponse.json({ error: authError?.message || "Failed to create account" }, { status: 500 });
  }

  // Create profile
  await supabase.from("profiles").insert({
    id: authData.id,
    username: username.toLowerCase(),
  });

  // Create session token
  const token = await signToken({
    userId: authData.id,
    username: username.toLowerCase(),
    role: "user",
  });

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
