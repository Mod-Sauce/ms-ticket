import { getSession } from "@/lib/auth-session";
import TemplateEditor from "@/components/TemplateEditor";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewTemplatePage() {
  const session = await getSession();

  if (!session) redirect("/login");

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (profile?.role !== "owner") redirect("/");

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <a href="/dashboard" className="text-gray-400 hover:text-white text-sm">← Back</a>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">New Template</h1>
        <TemplateEditor />
      </main>
    </div>
  );
}
