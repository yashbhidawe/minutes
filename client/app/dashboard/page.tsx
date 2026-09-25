"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ActivationChecklist } from "@/components/activation-checklist";
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
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    uploaded: "bg-blue-50 text-blue-700 border-blue-200",
    queued: "bg-blue-50 text-blue-700 border-blue-200",
    processing: "bg-amber-50 text-amber-700 border-amber-200",
    transcribing: "bg-purple-50 text-purple-700 border-purple-200",
    transcribed: "bg-purple-50 text-purple-700 border-purple-200",
    summarizing: "bg-purple-50 text-purple-700 border-purple-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    failed: "bg-red-50 text-red-700 border-red-200",
  };

  const isLive = ["uploaded", "queued", "transcribing", "transcribed", "summarizing"].includes(status);

  return (
    <span className={`text-[10px] uppercase font-mono tracking-wider px-2.5 py-0.5 rounded border font-semibold flex items-center gap-1.5 ${styles[status] || styles.pending}`}>
      {isLive && <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />}
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const { token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDuration, setNewDuration] = useState("30");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const handleDeleteMeeting = async (e: React.MouseEvent, id: number, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token || deletingId !== null) return;
     if (!confirm(`Delete meeting "${title}"? This also deletes its transcript, notes, action items and stored audio.`)) return;

    setDeletingId(id);
    try {
      await api.meetings.delete(id, token);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete meeting");
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || !token) return null;

  const filteredMeetings = meetings.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalDurationSec = meetings.reduce((acc, m) => acc + (m.duration_sec || 0), 0);
  const completedCount = meetings.filter((m) => m.status === "completed").length;
  const hasRecording = meetings.some(
    (m) => Boolean(m.audio_key) || ["uploaded", "queued", "transcribing", "transcribed", "summarizing", "completed"].includes(m.status)
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Dashboard</h1>
          <p className="text-xs text-stone-500 mt-1 font-medium">
            Google Meet notes & AI-extracted action items
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-stone-900 text-white text-xs font-medium rounded hover:bg-stone-800 transition-colors shadow-xs self-start sm:self-auto"
        >
          New Meeting
        </button>
      </div>

      {/* Analytics Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-white border border-stone-200 rounded-lg">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">Total Meetings</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{meetings.length}</p>
        </div>
        <div className="p-4 bg-white border border-stone-200 rounded-lg">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">Recorded Duration</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{formatDuration(totalDurationSec)}</p>
        </div>
        <div className="p-4 bg-white border border-stone-200 rounded-lg">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">Summaries Completed</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{completedCount}</p>
        </div>
      </div>

      <ActivationChecklist hasRecording={hasRecording} hasSummary={completedCount > 0} />

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Filter meetings by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-3 py-2 bg-white border border-stone-200 rounded-md text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors shadow-xs"
        />
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-stone-900/30 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md border border-stone-200" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-sm font-bold text-stone-900 mb-4 uppercase tracking-wider">New Meeting Record</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-medium text-stone-500 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-stone-900 text-xs focus:outline-none focus:border-stone-900"
                  placeholder="e.g. Architecture Sync"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-medium text-stone-500 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  min="1"
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-stone-900 text-xs focus:outline-none focus:border-stone-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-3 py-1.5 bg-stone-900 text-white text-xs font-medium rounded hover:bg-stone-800 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meetings List */}
      {loading ? (
        <div className="py-16 text-center text-xs font-medium text-stone-400">
          Loading meetings...
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone-200 rounded-lg">
          <p className="text-stone-700 text-sm font-medium mb-1">
            {searchQuery ? "No matching meetings found" : "No meetings recorded yet"}
          </p>
          <p className="text-stone-400 text-xs">
            {searchQuery ? "Try searching with a different term." : "Join a Google Meet call or create a manual meeting record."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-stone-200 border-t border-b border-stone-200 bg-white rounded-lg">
          {filteredMeetings.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors group">
              <Link href={`/meetings/${m.id}`} className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-sm font-semibold text-stone-900 truncate group-hover:text-stone-700">
                    {m.title}
                  </h3>
                  <StatusBadge status={m.status} />
                </div>
                <p className="text-xs text-stone-400 font-medium">
                  {formatDuration(m.duration_sec)} &middot; {formatDate(m.created_at)}
                </p>
              </Link>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => handleDeleteMeeting(e, m.id, m.title)}
                  disabled={deletingId === m.id}
                  className="px-2.5 py-1 text-xs font-medium text-stone-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded transition-all"
                  title="Delete meeting"
                >
                  {deletingId === m.id ? "Deleting..." : "Delete"}
                </button>
                <Link href={`/meetings/${m.id}`} className="text-stone-400 hover:text-stone-900 text-xs font-semibold px-2 py-1">
                  View &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
