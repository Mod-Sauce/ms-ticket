"use client";

export default function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="POST">
      <button
        type="submit"
        className="px-4 py-2 text-sm text-gray-300 hover:text-white transition"
      >
        Logout
      </button>
    </form>
  );
}
