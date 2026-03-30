"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Avatar from "./Avatar";

interface TicketListClientProps {
  userId: string;
}

export default function TicketListClient({ userId }: TicketListClientProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tickets?mine=true&userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        setTickets(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="text-gray-500 text-sm">Loading...</div>;

  if (tickets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        You haven&apos;t created any tickets yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tickets.map((ticket: any) => (
        <Link
          key={ticket.id}
          href={`/tickets/${ticket.id}`}
          className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition"
        >
          <div className="flex items-center gap-3">
            <Avatar username={ticket.profiles?.username || "?"} size={32} />
            <div>
              <div className="font-medium text-white">{ticket.title}</div>
              <div className="text-xs text-gray-500">{ticket.template_slug}</div>
            </div>
          </div>
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            ticket.status === "open" ? "bg-green-900 text-green-300" :
            ticket.status === "pending" ? "bg-yellow-900 text-yellow-300" :
            "bg-gray-700 text-gray-300"
          }`}>
            {ticket.status}
          </span>
        </Link>
      ))}
    </div>
  );
}
