"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, Meeting } from "@/lib/api";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDuration(sec: number) {
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  const rem = min % 60;
  return rem > 0 ? `${hr}h ${rem}m` : `${hr}h`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-stone-100 text-stone-500",
    uploaded: "bg-stone-100 text-stone-500",
    transcribed: "bg-blue-50 text-blue-700",
    summarized: "bg-emerald-50 text-emerald-700",
  };

  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const { token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDuration, setNewDuration] = useState("30");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/login");
    }
  }, [token, authLoading, router]);

  useEffect(() => {
    if (!token) return;
    api.meetings.list(token).then(setMeetings).finally(() => setLoading(false));

    const interval = setInterval(() => {
      api.meetings.list(token).then(setMeetings).catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    try {
      const meeting = await api.meetings.create(newTitle, parseInt(newDuration) * 60, token);
      setMeetings((prev) => [meeting, ...prev]);
      setShowCreate(false);
      setNewTitle("");
      setNewDuration("30");
    } catch {
      // handle error
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || !token) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-end justify-between mb-12">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Meetings</h1>
          <p className="text-sm text-stone-400 mt-1">
            {meetings.length === 0
              ? "No meetings yet"
              : `${meetings.length} meeting${meetings.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-stone-900 text-white text-sm hover:bg-stone-800 transition-colors"
        >
          New meeting
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-white p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-light mb-6">New meeting</h2>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full px-0 py-2 bg-transparent border-0 border-b border-stone-200 text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-900 transition-colors text-sm"
                  placeholder="Weekly standup"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2">
                  Expected duration (minutes)
                </label>
                <input
                  type="number"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  min="1"
                  required
                  className="w-full px-0 py-2 bg-transparent border-0 border-b border-stone-200 text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-900 transition-colors text-sm"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm text-stone-400 hover:text-stone-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-stone-900 text-white text-sm hover:bg-stone-800 disabled:opacity-50 transition-colors"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-stone-400">Loading...</div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-stone-300 text-lg mb-2">No meetings yet</p>
          <p className="text-stone-400 text-sm">
            Create your first meeting to get started.
          </p>
        </div>
      ) : (
        <div className="border-t border-stone-200">
          {meetings.map((m) => (
            <Link
              key={m.id}
              href={`/meetings/${m.id}`}
              className="flex items-center justify-between py-4 border-b border-stone-200 hover:bg-stone-50 transition-colors px-2 -mx-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-stone-900 truncate">
                    {m.title}
                  </h3>
                  <StatusBadge status={m.status} />
                </div>
                <p className="text-xs text-stone-400 mt-1">
                  {formatDuration(m.duration_sec)} &middot; {formatDate(m.created_at)}
                </p>
              </div>
              <div className="text-stone-300 text-sm ml-4">
                &rarr;
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
