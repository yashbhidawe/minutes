"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, Meeting, Note, ActionItem, Transcript } from "@/lib/api";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDuration(sec: number) {
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min`;
  const hr = Math.floor(min / 60);
  const rem = min % 60;
  return rem > 0 ? `${hr}h ${rem}m` : `${hr}h`;
}

function formatTimestamp(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    high: "bg-red-500",
    medium: "bg-amber-400",
    low: "bg-stone-300",
  };
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors[priority] || colors.medium}`} />;
}

function StatusSelect({ status, onChange }: { status: string; onChange: (s: string) => void }) {
  const options = ["pending", "in_progress", "blocked", "done"];
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value)}
      className="text-[10px] uppercase tracking-wider bg-transparent border border-stone-200 px-2 py-1 rounded-none text-stone-500 focus:outline-none focus:border-stone-400 cursor-pointer"
    >
      {options.map((s) => (
        <option key={s} value={s}>
          {s.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}

function SectionBlock({ title, content }: { title: string; content: string }) {
  if (!content) return null;
  const lines = content.split("\n").filter((l) => l.trim());
  return (
    <div className="mb-8">
      <h3 className="text-xs uppercase tracking-wider text-stone-400 mb-3">
        {title}
      </h3>
      <div className="space-y-1.5">
        {lines.map((line, i) => (
          <p key={i} className="text-sm text-stone-700 leading-relaxed">
            {line.replace(/^[-*]\s*/, "")}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function MeetingDetailPage() {
  const { token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const meetingId = Number(params.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !token) router.push("/login");
  }, [token, authLoading, router]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.meetings.get(meetingId, token),
      api.meetings.getNotes(meetingId, token).catch(() => []),
      api.meetings.getActionItems(meetingId, token).catch(() => []),
      api.meetings.getTranscript(meetingId, token).catch(() => null),
    ]).then(([m, n, a, t]) => {
      setMeeting(m);
      setNotes(n);
      setActionItems(a);
      setTranscript(t);
    }).finally(() => setLoading(false));
  }, [token, meetingId]);

  useEffect(() => {
    if (!token || !meeting) return;
    const isProcessing = ["uploaded", "processing", "transcribing", "summarizing"].includes(meeting.status);
    if (!isProcessing) return;

    let lastStatus = meeting.status;
    let stalePollCount = 0;
    const MAX_STALE_POLLS = 20; // ~60 seconds with no status change

    const interval = setInterval(async () => {
      try {
        const updated = await api.meetings.get(meetingId, token);
        setMeeting(updated);

        if (updated.status === lastStatus) {
          stalePollCount++;
          if (stalePollCount >= MAX_STALE_POLLS) {
            clearInterval(interval);
            setError("Processing is taking longer than expected. The server may have restarted. Try the Retry button.");
          }
        } else {
          stalePollCount = 0;
          lastStatus = updated.status;
        }

        if (updated.status === "completed" || updated.status === "failed") {
          clearInterval(interval);
          const [n, a, t] = await Promise.all([
            api.meetings.getNotes(meetingId, token).catch(() => []),
            api.meetings.getActionItems(meetingId, token).catch(() => []),
            api.meetings.getTranscript(meetingId, token).catch(() => null),
          ]);
          setNotes(n);
          setActionItems(a);
          setTranscript(t);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [token, meetingId, meeting?.status]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    setError("");
    try {
      const res = await api.meetings.uploadAudio(meetingId, file, token);
      setMeeting((prev) => prev ? { ...prev, status: res.status, audio_key: res.audio_key } : prev);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRetry = async () => {
    if (!token) return;
    setError("");
    try {
      const res = await api.meetings.reprocess(meetingId, token);
      setMeeting((prev) => prev ? { ...prev, status: res.status } : prev);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Retry failed");
    }
  };

  const handleTranscribe = async () => {
    if (!token) return;
    setTranscribing(true);
    setError("");
    try {
      const t = await api.meetings.transcribe(meetingId, token);
      setTranscript(t);
      setMeeting((prev) => prev ? { ...prev, status: "transcribed" } : prev);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transcription failed");
    } finally {
      setTranscribing(false);
    }
  };

  const handleSummarize = async () => {
    if (!token) return;
    setSummarizing(true);
    setError("");
    try {
      const res = await api.meetings.summarize(meetingId, token);
      setNotes(res.notes);
      setActionItems(res.action_items);
      setMeeting((prev) => prev ? { ...prev, status: "summarized" } : prev);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Summarization failed");
    } finally {
      setSummarizing(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !confirm("Delete this meeting?")) return;
    setDeleting(true);
    setError("");
    try {
      await api.meetings.delete(meetingId, token);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  };

  const handleStatusChange = async (itemId: number, newStatus: string) => {
    if (!token) return;
    try {
      const updated = await api.meetings.updateActionItemStatus(meetingId, itemId, newStatus, token);
      setActionItems((prev) => prev.map((i) => (i.id === itemId ? updated : i)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Status update failed");
    }
  };

  if (authLoading || !token || loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-sm text-stone-400">Loading...</div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <p className="text-sm text-stone-400">Meeting not found.</p>
        <Link href="/dashboard" className="text-sm text-stone-900 underline underline-offset-4 mt-4 inline-block">
          Back to meetings
        </Link>
      </div>
    );
  }

  const notesBySection = notes.reduce<Record<string, Note>>((acc, n) => {
    acc[n.section] = n;
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Link
        href="/dashboard"
        className="text-xs uppercase tracking-wider text-stone-400 hover:text-stone-900 transition-colors inline-block mb-8"
      >
        &larr; All meetings
      </Link>

      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-3xl font-light tracking-tight">{meeting.title}</h1>
          <p className="text-sm text-stone-400 mt-2">
            {formatDate(meeting.created_at)} &middot; {formatDuration(meeting.duration_sec)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {meeting.status === "pending" && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1.5 border border-amber-200 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Awaiting Extension Audio Upload...
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.webm,.ogg,.opus,.wav,.mpeg"
                onChange={handleUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs text-stone-400 hover:text-stone-900 underline underline-offset-4 transition-colors"
              >
                {uploading ? "Uploading..." : "Upload manually"}
              </button>
            </div>
          )}

          {meeting.status === "uploaded" && (
            <button
              onClick={handleTranscribe}
              disabled={transcribing}
              className="px-4 py-2 bg-stone-900 text-white text-sm hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              {transcribing ? "Transcribing..." : "Transcribe"}
            </button>
          )}

          {meeting.status === "transcribed" && (
            <button
              onClick={handleSummarize}
              disabled={summarizing}
              className="px-4 py-2 bg-stone-900 text-white text-sm hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              {summarizing ? "Summarizing..." : "Summarize"}
            </button>
          )}

          {meeting.status === "failed" && (
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-stone-900 text-white text-sm hover:bg-stone-800 transition-colors"
            >
              Retry AI Processing
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm text-stone-400 hover:text-red-600 transition-colors"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {meeting.status === "failed" && meeting.error_message && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 flex items-start gap-3">
          <span className="text-red-500 mt-0.5 shrink-0">✕</span>
          <div>
            <p className="text-sm font-medium text-red-800">Processing failed</p>
            <p className="text-xs text-red-600 mt-1">{meeting.error_message}</p>
          </div>
        </div>
      )}

      {["uploaded", "processing", "transcribing", "summarizing"].includes(meeting.status) && (
        <div className="mb-8 p-4 bg-stone-50 border border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <div>
              <p className="text-sm font-medium text-stone-900">
                {meeting.status === "transcribing" && "Transcribing meeting audio via Groq Whisper..."}
                {meeting.status === "summarizing" && "Extracting AI notes & key decisions via Gemini..."}
                {(meeting.status === "processing" || meeting.status === "uploaded") && "Processing audio & preparing AI pipeline..."}
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                The meeting title and structured notes will auto-update as soon as processing completes.
              </p>
            </div>
          </div>
          <span className="text-xs uppercase tracking-wider text-amber-700 font-mono bg-amber-50 px-2 py-1 border border-amber-200">
            {meeting.status}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-2">
          {notesBySection["key_decisions"] && (
            <SectionBlock title="Key decisions" content={notesBySection["key_decisions"].content} />
          )}
          {notesBySection["discussion_points"] && (
            <SectionBlock title="Discussion points" content={notesBySection["discussion_points"].content} />
          )}
          {notesBySection["blockers"] && (
            <SectionBlock title="Blockers" content={notesBySection["blockers"].content} />
          )}
          {notesBySection["next_steps"] && (
            <SectionBlock title="Next steps" content={notesBySection["next_steps"].content} />
          )}

          {notes.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-stone-300 text-sm">No summary yet</p>
              <p className="text-stone-400 text-xs mt-1">
                {meeting.status === "pending" && "Extension capturing audio. Notes will appear as soon as the recording finishes."}
                {meeting.status === "uploaded" && "Transcribe the audio to generate notes."}
                {meeting.status === "transcribed" && "Summarize the transcript to generate notes."}
              </p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-wider text-stone-400 mb-4">
            Action items
          </h3>
          {actionItems.length === 0 ? (
            <p className="text-sm text-stone-300">None</p>
          ) : (
            <div className="space-y-3">
              {actionItems.map((item) => (
                <div key={item.id} className="border border-stone-200 p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <PriorityDot priority={item.priority} />
                    <p className="text-sm text-stone-900 leading-snug flex-1">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    {item.assigned_to && (
                      <span className="text-[10px] uppercase tracking-wider text-stone-400">
                        {item.assigned_to}
                      </span>
                    )}
                    {item.due_date && (
                      <span className="text-[10px] uppercase tracking-wider text-stone-300">
                        {new Date(item.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                    <StatusSelect status={item.status} onChange={(s) => handleStatusChange(item.id, s)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {transcript && (
        <div className="mt-16 pt-8 border-t border-stone-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs uppercase tracking-wider text-stone-400">
              Full Transcript ({transcript.language || "en"})
            </h3>
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-xs uppercase tracking-wider text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
            >
              {showTranscript ? "Hide Transcript ▲" : "Show Transcript ▼"}
            </button>
          </div>

          {showTranscript && (
            <div className="bg-stone-50 border border-stone-200 p-6 rounded-none space-y-3 max-h-[500px] overflow-y-auto">
              {transcript.segments && transcript.segments.length > 0 ? (
                transcript.segments.map((seg, idx) => (
                  <div key={idx} className="flex items-start gap-4 text-xs">
                    <span className="font-mono text-stone-400 select-none whitespace-nowrap pt-0.5">
                      [{formatTimestamp(seg.start)} - {formatTimestamp(seg.end)}]
                    </span>
                    <p className="text-stone-800 leading-relaxed font-sans">{seg.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
                  {transcript.raw_text}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
