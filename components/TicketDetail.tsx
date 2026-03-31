"use client";
import { useState, useEffect } from "react";
import Avatar from "./Avatar";
import { Template } from "@/lib/templates";

interface TicketDetailProps {
  ticket: any;
  fields: any[];
  messages: any[];
  template: Template | null;
  currentUser: any;
  isOwner: boolean;
  isOwnTicket: boolean;
}

export default function TicketDetail({
  ticket,
  fields: initialFields,
  messages: initialMessages,
  template,
  currentUser,
  isOwner,
  isOwnTicket,
}: TicketDetailProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(ticket.status);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [visibility, setVisibility] = useState(ticket.visibility);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);

  const canReply = isOwnTicket || isOwner;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setNewMessage("");
      }
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleVisibilityToggle = async () => {
    setUpdatingVisibility(true);
    try {
      const newVisibility = visibility === "open" ? "internal" : "open";
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: newVisibility }),
      });
      if (res.ok) {
        const data = await res.json();
        setVisibility(data.visibility || newVisibility);
      } else {
        const error = await res.json();
        console.error("Failed to update visibility:", error);
        alert(error.error || "Failed to update visibility");
      }
    } catch (err) {
      console.error("Error updating visibility:", err);
      alert("Failed to update visibility");
    } finally {
      setUpdatingVisibility(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Ticket Header */}
      <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                status === "open" ? "bg-green-900 text-green-300" :
                status === "pending" ? "bg-yellow-900 text-yellow-300" :
                "bg-gray-700 text-gray-300"
              }`}>
                {status}
              </span>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                {ticket.template_slug}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white">{ticket.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Avatar username={ticket.profiles?.username || "?"} avatarUrl={ticket.profiles?.avatar_url} size={20} />
              <span className="text-sm text-gray-400">
                {ticket.profiles?.username || "unknown"}
              </span>
              <span className="text-gray-600">·</span>
              <span className="text-sm text-gray-500">
                {new Date(ticket.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Status control for owners */}
          {isOwner && (
            <div className="flex flex-col gap-2">
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
              <button
                onClick={handleVisibilityToggle}
                disabled={updatingVisibility}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition disabled:opacity-50 ${
                  visibility === "open"
                    ? "bg-green-900 text-green-300 hover:bg-green-800"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
                title={visibility === "open" ? "Visible on homepage" : "Hidden from homepage"}
              >
                {updatingVisibility ? "..." : visibility === "open" ? "👁️ Public" : "🔒 Private"}
              </button>
            </div>
          )}
        </div>

        {/* Ticket Fields */}
        {template && initialFields.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-800">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Ticket Details</h3>
            <dl className="space-y-3">
              {template.fields.map((field) => {
                const fieldData = initialFields.find((f) => f.field_name === field.name);
                if (!fieldData) return null;
                return (
                  <div key={field.name}>
                    <dt className="text-xs text-gray-500 uppercase tracking-wide">{field.label}</dt>
                    <dd className="text-white mt-0.5">
                      {fieldData.file_url ? (
                        <a
                          href={fieldData.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          {fieldData.field_value || "View attachment"}
                        </a>
                      ) : fieldData.field_value ? (
                        field.type === "url" ? (
                          <a
                            href={fieldData.field_value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                          >
                            {fieldData.field_value}
                          </a>
                        ) : (
                          <span className="whitespace-pre-wrap">{fieldData.field_value}</span>
                        )
                      ) : (
                        <span className="text-gray-500 italic">—</span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No messages yet. {canReply ? "Be the first to reply!" : ""}
          </div>
        ) : (
          messages.map((msg: any) => (
            <div key={msg.id} className="flex gap-3">
              <Avatar username={msg.profiles?.username || "?"} avatarUrl={msg.profiles?.avatar_url} size={36} className="mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium text-white">
                    {msg.profiles?.username || "unknown"}
                  </span>
                  {msg.is_staff && (
                    <span className="px-1.5 py-0.5 text-xs bg-purple-900 text-purple-300 rounded">
                      Staff
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(msg.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
                <div className="mt-1 p-3 bg-gray-900 border border-gray-800 rounded-lg">
                  <p className="text-gray-200 whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply Box */}
      {canReply ? (
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <Avatar username={currentUser?.username || "?"} avatarUrl={currentUser?.avatar_url} size={36} className="mt-2 flex-shrink-0" />
          <div className="flex-1 flex gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isOwner ? "Reply to user..." : "Add a message..."}
              rows={2}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition disabled:opacity-50 self-end"
            >
              {sending ? "..." : "Send"}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-4 text-gray-500 text-sm">
          You don&apos;t have permission to reply to this ticket
        </div>
      )}
    </div>
  );
}
