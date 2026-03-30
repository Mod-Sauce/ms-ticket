"use client";
import { useState } from "react";
import Avatar from "./Avatar";

interface ProfileCardProps {
  profile: any;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const [discordId, setDiscordId] = useState(profile?.discord_id || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ discord_id: discordId })
        .eq("id", user.id);

      if (!error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
      <div className="flex items-center gap-4 mb-6">
        <Avatar username={profile?.username || "?"} size={64} />
        <div>
          <div className="text-lg font-bold text-white">{profile?.username}</div>
          <div className="text-sm text-gray-400 capitalize">{profile?.role || "user"}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Discord ID <span className="text-gray-500 text-xs">(for DM notifications via Stoat)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value)}
              placeholder="123456789012345678"
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition disabled:opacity-50"
            >
              {saving ? "..." : saved ? "✓ Saved" : "Save"}
            </button>
          </div>
        </div>

        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition text-sm"
          >
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}
