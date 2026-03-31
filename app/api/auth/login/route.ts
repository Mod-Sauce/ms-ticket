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

  const supabase = await createAdminSupabase();

  // Fetch user from auth_users
  const { data: user, error } = await supabase
    .from("auth_users")
    .select("id, username, password_hash")
    .eq("username", username.toLowerCase())
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Fetch profile separately to get role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const token = await signToken({
    userId: user.id,
    username: user.username,
    role: profile?.role || "user",
  });

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
