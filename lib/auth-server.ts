import { getSession } from "./auth-session";
import { createServerSupabase } from "@/lib/supabase/server";

export { getSession };

export async function getUser() {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.userId)
    .single();

  return profile;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
