import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function createServerSupabase() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  let userPayload: { userId?: string; role?: string } = {};

  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      userPayload = { userId: payload.userId, role: payload.role };
    }
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
      global: {
        headers: {
          "x-user-id": userPayload.userId || "",
          "x-user-role": userPayload.role || "",
        },
      },
    }
  );
}

export async function createAdminSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}
