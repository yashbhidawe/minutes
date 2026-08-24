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
    low: "bg-emerald-500",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[priority] || colors.medium}`} />;
}

function StatusSelect({ status, onChange }: { status: string; onChange: (s: string) => void }) {
  const options = ["pending", "in_progress", "blocked", "done"];
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs uppercase tracking-wider bg-stone-100 border border-stone-300 px-2 py-1 rounded text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-400 cursor-pointer font-mono"
    >
      {options.map((s) => (
        <option key={s} value={s}>
          {s.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}

function SectionCard({ title, content }: { title: string; content: string }) {
  if (!content) return null;
  const lines = content.split("\n").filter((l) => l.trim());
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-6 mb-6">
      <div className="flex items-center gap-2 mb-4 border-b border-stone-100 pb-3">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-stone-500">{title}</h3>
      </div>
      <div className="space-y-2.5">
        {lines.map((line, i) => (
          <div key={i} className="flex items-start gap-2.5 text-sm text-stone-800 leading-relaxed">
            <span className="text-stone-400 font-bold select-none">•</span>
            <p className="flex-1">{line.replace(/^[-*]\s*/, "")}</p>
          </div>
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
  const audioRef = useRef<HTMLAudioElement>(null);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [error, setError] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    if (!token || !meeting?.audio_key) return;
    api.meetings.getAudioUrl(meetingId, token)
      .then(setAudioUrl)
      .catch(() => setAudioUrl(null));
  }, [token, meetingId, meeting?.audio_key]);

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
      if (n.length === 0 && t) {
        setShowTranscript(true);
      }
    }).finally(() => setLoading(false));
  }, [token, meetingId]);

  useEffect(() => {
    if (!token || !meeting) return;
    const isProcessing = ["uploaded", "processing", "transcribing", "summarizing"].includes(meeting.status);
    if (!isProcessing) return;

    let lastStatus = meeting.status;
    let stalePollCount = 0;
    const MAX_STALE_POLLS = 25;

    const interval = setInterval(async () => {
      try {
        const updated = await api.meetings.get(meetingId, token);
        setMeeting(updated);

        if (updated.status === lastStatus) {
          stalePollCount++;
          if (stalePollCount >= MAX_STALE_POLLS) {
            clearInterval(interval);
            setError("Processing is taking longer than expected. Click 'Re-process AI' below to retry.");
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
          if (n.length === 0 && t) {
            setShowTranscript(true);
          }
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
      showToast("Audio uploaded. Processing summary...");
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
      showToast("Re-processing meeting audio...");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Retry failed");
    }
  };

  const handleDelete = async () => {
    if (!token || !confirm("Are you sure you want to delete this meeting?")) return;
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
      showToast(`Action item status updated to ${newStatus.replace("_", " ")}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Status update failed");
    }
  };

  const handleCopySummary = () => {
    if (!meeting) return;
    const notesBySec = notes.reduce<Record<string, string>>((acc, n) => {
      acc[n.section] = n.content;
      return acc;
    }, {});

    let text = `${meeting.title} (${formatDate(meeting.created_at)})\n\n`;
    if (notesBySec["key_decisions"]) text += `Key Decisions:\n${notesBySec["key_decisions"]}\n\n`;
    if (notesBySec["discussion_points"]) text += `Discussion Points:\n${notesBySec["discussion_points"]}\n\n`;
    if (notesBySec["blockers"]) text += `Blockers:\n${notesBySec["blockers"]}\n\n`;
    if (notesBySec["next_steps"]) text += `Next Steps:\n${notesBySec["next_steps"]}\n\n`;

    if (actionItems.length > 0) {
      text += `Action Items:\n`;
      actionItems.forEach((ai) => {
        text += `- [ ] ${ai.description} (Assigned: ${ai.assigned_to || "Unassigned"})\n`;
      });
    }

    navigator.clipboard.writeText(text);
    showToast("Meeting notes copied to clipboard");
  };

  const handleDownloadMarkdown = () => {
    if (!meeting) return;
    const notesBySec = notes.reduce<Record<string, string>>((acc, n) => {
      acc[n.section] = n.content;
      return acc;
    }, {});

    let md = `# ${meeting.title}\n*Date:* ${formatDate(meeting.created_at)} | *Duration:* ${formatDuration(meeting.duration_sec)}\n\n`;
    if (notesBySec["key_decisions"]) md += `## Key Decisions\n${notesBySec["key_decisions"]}\n\n`;
    if (notesBySec["discussion_points"]) md += `## Discussion Points\n${notesBySec["discussion_points"]}\n\n`;
    if (notesBySec["blockers"]) md += `## Blockers\n${notesBySec["blockers"]}\n\n`;
    if (notesBySec["next_steps"]) md += `## Next Steps\n${notesBySec["next_steps"]}\n\n`;

    if (actionItems.length > 0) {
      md += `## Action Items\n`;
      actionItems.forEach((ai) => {
        md += `- [${ai.status === "done" ? "x" : " "}] ${ai.description} (${ai.assigned_to || "Unassigned"})\n`;
      });
      md += `\n`;
    }

    if (transcript?.raw_text) {
      md += `## Transcript\n${transcript.raw_text}\n`;
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meeting.title.replace(/[^a-z0-9]/gi, "_")}_Notes.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded Markdown file");
  };

  const changePlaybackSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const skipAudio = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  if (authLoading || !token || loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium text-stone-500">Loading meeting summary...</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 text-center">
        <p className="text-sm text-stone-600 font-medium">Meeting not found.</p>
        <Link href="/dashboard" className="text-xs font-semibold text-stone-900 underline underline-offset-4 mt-4 inline-block">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  const notesBySection = notes.reduce<Record<string, Note>>((acc, n) => {
    acc[n.section] = n;
    return acc;
  }, {});

  const isProcessing = ["uploaded", "processing", "transcribing", "summarizing"].includes(meeting.status);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white text-xs font-medium px-4 py-2.5 rounded shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/dashboard"
          className="text-xs uppercase tracking-wider font-semibold text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1.5"
        >
          &larr; All Meetings
        </Link>

        {/* Quick Action Utilities */}
        {meeting.status === "completed" && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 rounded border border-stone-200 transition-colors"
              title="Copy summary to clipboard"
            >
              Copy Summary
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="px-3 py-1.5 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 rounded border border-stone-200 transition-colors"
              title="Export notes as Markdown"
            >
              Export Markdown
            </button>
          </div>
        )}
      </div>

      {/* Title & Metadata */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 pb-6 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">{meeting.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-xs text-stone-500 font-medium">
            <span>{formatDate(meeting.created_at)}</span>
            <span>&middot;</span>
            <span>{formatDuration(meeting.duration_sec)}</span>
            <span>&middot;</span>
            <span className="uppercase tracking-wider font-mono text-[10px] px-2 py-0.5 rounded bg-stone-100 border border-stone-200">
              Status: {meeting.status}
            </span>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2">
          {meeting.status === "pending" && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 p-2 rounded">
              <span className="text-xs font-mono font-medium text-amber-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Awaiting Audio...
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
                className="px-3 py-1 bg-amber-900 text-white text-xs font-medium rounded hover:bg-amber-800 transition-colors"
              >
                {uploading ? "Uploading..." : "Upload File"}
              </button>
            </div>
          )}

          {(meeting.status === "failed" || meeting.status === "completed") && (
            <button
              onClick={handleRetry}
              className="px-3 py-1.5 bg-stone-900 text-white text-xs font-medium rounded hover:bg-stone-800 transition-colors"
            >
              Re-process AI
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1.5 text-xs font-medium text-stone-400 hover:text-red-600 transition-colors"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Processing Stepper */}
      {isProcessing && (
        <div className="mb-8 p-6 bg-stone-900 text-white rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">Processing Pipeline Active</h3>
            </div>
            <span className="text-[10px] uppercase font-mono bg-stone-800 px-2.5 py-1 rounded text-stone-300">
              {meeting.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs border-t border-stone-800 pt-4">
            <div className={`p-3 rounded border ${["uploaded", "processing", "transcribing", "summarizing", "completed"].includes(meeting.status) ? "bg-stone-800 border-emerald-500/50 text-emerald-400" : "bg-stone-950 border-stone-800 text-stone-500"}`}>
              <p className="font-semibold mb-0.5">1. Audio Upload</p>
              <p className="text-[10px] text-stone-400">Captured & Persisted</p>
            </div>
            <div className={`p-3 rounded border ${["transcribing", "summarizing", "completed"].includes(meeting.status) ? "bg-stone-800 border-emerald-500/50 text-emerald-400" : "bg-stone-950 border-stone-800 text-stone-500"}`}>
              <p className="font-semibold mb-0.5">2. Speech-to-Text</p>
              <p className="text-[10px] text-stone-400">Groq Whisper API</p>
            </div>
            <div className={`p-3 rounded border ${["summarizing", "completed"].includes(meeting.status) ? "bg-stone-800 border-emerald-500/50 text-emerald-400" : "bg-stone-950 border-stone-800 text-stone-500"}`}>
              <p className="font-semibold mb-0.5">3. AI Summarization</p>
              <p className="text-[10px] text-stone-400">Gemini 3.6 Flash</p>
            </div>
            <div className={`p-3 rounded border ${meeting.status === "completed" ? "bg-stone-800 border-emerald-500/50 text-emerald-400" : "bg-stone-950 border-stone-800 text-stone-500"}`}>
              <p className="font-semibold mb-0.5">4. Complete</p>
              <p className="text-[10px] text-stone-400">Notes & Actions</p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Audio Player */}
      {audioUrl && (
        <div className="mb-8 p-4 bg-stone-900 text-white rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-300">Recorded Meeting Audio</p>
            <p className="text-[10px] text-stone-400 mt-0.5">Tab + Microphone mixed stream</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => skipAudio(-5)}
              className="px-2 py-1 text-[11px] font-mono bg-stone-800 hover:bg-stone-700 rounded transition-colors"
            >
              -5s
            </button>
            <audio ref={audioRef} controls src={audioUrl} className="h-8 w-full md:w-72" />
            <button
              onClick={() => skipAudio(5)}
              className="px-2 py-1 text-[11px] font-mono bg-stone-800 hover:bg-stone-700 rounded transition-colors"
            >
              +5s
            </button>
            <div className="flex items-center gap-1 bg-stone-800 p-1 rounded">
              {[1, 1.25, 1.5, 2].map((speed) => (
                <button
                  key={speed}
                  onClick={() => changePlaybackSpeed(speed)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded ${playbackSpeed === speed ? "bg-stone-100 text-stone-950 font-bold" : "text-stone-400 hover:text-white"}`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notes & Action Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Notes Sections */}
        <div className="lg:col-span-2">
          {notesBySection["key_decisions"] && (
            <SectionCard title="Key Decisions" content={notesBySection["key_decisions"].content} />
          )}
          {notesBySection["discussion_points"] && (
            <SectionCard title="Discussion Points" content={notesBySection["discussion_points"].content} />
          )}
          {notesBySection["blockers"] && (
            <SectionCard title="Blockers & Concerns" content={notesBySection["blockers"].content} />
          )}
          {notesBySection["next_steps"] && (
            <SectionCard title="Next Steps" content={notesBySection["next_steps"].content} />
          )}

          {notes.length === 0 && !isProcessing && (
            <div className="p-12 text-center bg-white border border-stone-200 rounded-lg">
              <p className="text-stone-500 text-xs font-medium">No structured summary generated yet</p>
              <p className="text-stone-400 text-[11px] mt-1">
                {meeting.status === "completed"
                  ? "The recording contained insufficient speech to extract bullet points. Review the transcript below."
                  : "Click 'Re-process AI' above to trigger summarization."}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Action Items */}
        <div>
          <div className="bg-white border border-stone-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
              <h3 className="text-xs font-semibold tracking-wider uppercase text-stone-500">Action Items</h3>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                {actionItems.length}
              </span>
            </div>

            {actionItems.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-4 text-center">No action items detected.</p>
            ) : (
              <div className="space-y-3">
                {actionItems.map((item) => (
                  <div key={item.id} className="p-3.5 bg-stone-50 border border-stone-200 rounded">
                    <div className="flex items-start gap-2 mb-2">
                      <PriorityDot priority={item.priority} />
                      <p className="text-xs text-stone-900 font-medium leading-relaxed flex-1">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-stone-200/60 text-[11px]">
                      <span className="font-medium text-stone-500">
                        {item.assigned_to || "Unassigned"}
                      </span>
                      <StatusSelect status={item.status} onChange={(s) => handleStatusChange(item.id, s)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timestamped Transcript */}
      {transcript && (
        <div className="mt-12 pt-8 border-t border-stone-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-stone-500">
              Full Transcript ({transcript.language || "en"})
            </h3>
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-xs font-medium uppercase tracking-wider text-stone-600 hover:text-stone-900 transition-colors cursor-pointer bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded"
            >
              {showTranscript ? "Hide Transcript ▲" : "Show Full Transcript ▼"}
            </button>
          </div>

          {showTranscript && (
            <div className="bg-stone-900 text-stone-200 p-6 rounded-lg space-y-3 max-h-[500px] overflow-y-auto font-mono text-xs">
              {transcript.segments && transcript.segments.length > 0 ? (
                transcript.segments.map((seg, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-1 rounded hover:bg-stone-800/60 transition-colors">
                    <span className="text-stone-400 font-bold select-none shrink-0">
                      [{formatTimestamp(seg.start)} - {formatTimestamp(seg.end)}]
                    </span>
                    <p className="text-stone-200 leading-relaxed font-sans">{seg.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-stone-300 whitespace-pre-wrap leading-relaxed font-sans">
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
