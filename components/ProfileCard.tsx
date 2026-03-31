"use client";
import { useState } from "react";
import Avatar from "./Avatar";

interface ProfileCardProps {
  profile: any;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const isOwner = profile?.role === "owner";

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const { url } = await uploadRes.json();

      // Update profile with new avatar URL
      const updateRes = await fetch("/api/profile/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: url }),
      });

      if (!updateRes.ok) throw new Error("Failed to update profile");

      setAvatarUrl(url);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
      <div className="flex items-center gap-4 mb-6">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={profile?.username}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <Avatar username={profile?.username || "?"} size={64} />
        )}
        <div className="flex-1">
          <div className="text-lg font-bold text-white">{profile?.username}</div>
          <div className="text-sm text-gray-400 capitalize">{profile?.role || "user"}</div>
        </div>
      </div>

      <div className="space-y-4">
        {isOwner && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center gap-3">
              <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg cursor-pointer transition disabled:opacity-50">
                {uploading ? "Uploading..." : uploadSuccess ? "✓ Uploaded" : "Upload Image"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {avatarUrl && (
                <button
                  onClick={() => {
                    setAvatarUrl("");
                    fetch("/api/profile/avatar", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ avatar_url: null }),
                    });
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">Max 2MB, images only</p>
          </div>
        )}

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
