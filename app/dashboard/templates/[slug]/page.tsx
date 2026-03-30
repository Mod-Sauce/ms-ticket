import { getTemplate } from "@/lib/templates";
import TemplateEditor from "@/components/TemplateEditor";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditTemplatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") redirect("/");

  const template = getTemplate(slug);

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <a href="/dashboard" className="text-gray-400 hover:text-white text-sm">← Back</a>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Edit: {template?.name || slug}</h1>
        {template ? (
          <TemplateEditor initialData={template} isEdit />
        ) : (
          <p className="text-gray-500">Template not found</p>
        )}
      </main>
    </div>
  );
}
