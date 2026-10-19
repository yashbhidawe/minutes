"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, Meeting, Note, ActionItem, Transcript } from "@/lib/api";
import MeetingChat from "@/components/meeting-chat";

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

// Statuses that mean the backend is still working on this meeting.
// Must stay in sync with BUSY_STATUSES in server/app/services/celery_tasks.py
// (+ "uploaded", the transient state set right before dispatch).
const PROCESSING_STATUSES = ["uploaded", "queued", "transcribing", "transcribed", "summarizing"];

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
      className="text-xs uppercase tracking-wider bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 px-2 py-1 rounded text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 cursor-pointer font-mono"
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
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-6 mb-6">
      <div className="flex items-center gap-2 mb-4 border-b border-stone-100 dark:border-stone-800 pb-3">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-stone-500 dark:text-stone-400">{title}</h3>
      </div>
      <div className="space-y-2.5">
        {lines.map((line, i) => (
          <div key={i} className="flex items-start gap-2.5 text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
            <span className="text-stone-400 dark:text-stone-500 font-bold select-none">•</span>
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
  const [chatOpen, setChatOpen] = useState(false);
  const [error, setError] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isRetrying, setIsRetrying] = useState(false);
  const meetingStatus = meeting?.status;

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
    if (!token || !meetingStatus) return;
    const isProcessing = PROCESSING_STATUSES.includes(meetingStatus);
    if (!isProcessing) return;

    let lastStatus = meetingStatus;
    let stalePollCount = 0;
    // 200 polls x 3s = 10 min without a status change before giving up.
    // Long transcriptions legitimately sit in one status for minutes.
    const MAX_STALE_POLLS = 200;

    const interval = setInterval(async () => {
      try {
        const updated = await api.meetings.get(meetingId, token);
        setMeeting(updated);

        if (updated.status === lastStatus) {
          stalePollCount++;
          if (stalePollCount >= MAX_STALE_POLLS) {
            clearInterval(interval);
            setError("Processing is taking longer than expected. The background worker may be down — check its logs, then use 'Re-process AI' once the meeting reaches a terminal state.");
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
  }, [token, meetingId, meetingStatus]);

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
    setIsRetrying(true);
    setError("");
    try {
      const res = await api.meetings.reprocess(meetingId, token);
      setMeeting((prev) => prev ? { ...prev, status: res.status } : prev);
      showToast("Re-processing meeting audio...");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDelete = async () => {
     if (!token || !confirm("Delete this meeting? This also deletes its transcript, notes, action items and stored audio.")) return;
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

  const handleCitationSeek = (sec: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = sec;
      audioRef.current.play().catch(() => {});
    }
    setShowTranscript(true);
    showToast(`Jumped to ${formatTimestamp(sec)} in recording`);
  };

  if (authLoading || !token || loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-stone-800 dark:border-stone-200 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium text-stone-500 dark:text-stone-400">Loading meeting summary...</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 text-center">
        <p className="text-sm text-stone-600 dark:text-stone-400 font-medium">Meeting not found.</p>
        <Link href="/dashboard" className="text-xs font-semibold text-stone-900 dark:text-stone-100 underline underline-offset-4 mt-4 inline-block">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  const notesBySection = notes.reduce<Record<string, Note>>((acc, n) => {
    acc[n.section] = n;
    return acc;
  }, {});

  const isProcessing = PROCESSING_STATUSES.includes(meeting.status);

  const stepStatuses: Record<string, { title: string; desc: string; progress: number; eta: string }> = {
    uploaded: { title: "Audio Upload", desc: "Captured & persisted to storage.", progress: 20, eta: "~2–4 min" },
    queued: { title: "Queued", desc: "Waiting for a worker to pick up the audio.", progress: 35, eta: "~1–3 min" },
    transcribing: { title: "Speech-to-Text", desc: "Converting meeting audio into a transcript.", progress: 55, eta: "~1–3 min" },
    transcribed: { title: "Transcript Ready", desc: "Generating summary and extracting decisions.", progress: 70, eta: "~1–2 min" },
    summarizing: { title: "AI Summarization", desc: "Analyzing discussion, decisions & action items.", progress: 85, eta: "< 1 min" },
    completed: { title: "Complete", desc: "Notes and action items are ready.", progress: 100, eta: "Done" },
  } as const;

  const currentInfo = stepStatuses[meeting.status] ?? stepStatuses.uploaded;
  const progressPct = currentInfo.progress;

  const steps = [
    { id: "upload", title: "Audio Upload", desc: "Captured & persisted.", complete: ["uploaded", "queued", "transcribing", "transcribed", "summarizing", "completed"].includes(meeting.status), active: meeting.status === "uploaded" || meeting.status === "queued" },
    { id: "transcribe", title: "Speech-to-Text", desc: "Converting audio to text.", complete: ["transcribing", "transcribed", "summarizing", "completed"].includes(meeting.status), active: meeting.status === "transcribing" || meeting.status === "transcribed" },
    { id: "summarize", title: "AI Summarization", desc: "Extracting decisions & actions.", complete: ["summarizing", "completed"].includes(meeting.status), active: meeting.status === "summarizing" },
    { id: "complete", title: "Complete", desc: "Notes & actions ready.", complete: meeting.status === "completed", active: false },
  ];

  const currentStep = steps.findIndex((s) => s.active) + 1;

  function statusDescription(status: string): string {
    return stepStatuses[status]?.desc ?? "Processing…";
  }

  function etaText(status: string): string {
    return stepStatuses[status]?.eta ?? "";
  }

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
          className="text-xs uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors flex items-center gap-1.5"
        >
          &larr; All Meetings
        </Link>

        {/* Quick Action Utilities */}
        {meeting.status === "completed" && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 text-xs font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded border border-stone-200 dark:border-stone-700 transition-colors"
              title="Copy summary to clipboard"
            >
              Copy Summary
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="px-3 py-1.5 text-xs font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded border border-stone-200 dark:border-stone-700 transition-colors"
              title="Export notes as Markdown"
            >
              Export Markdown
            </button>
          </div>
        )}
      </div>

      {/* Title & Metadata */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 pb-6 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">{meeting.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-xs text-stone-500 dark:text-stone-400 font-medium">
            <span>{formatDate(meeting.created_at)}</span>
            <span>&middot;</span>
            <span>{formatDuration(meeting.duration_sec)}</span>
            <span>&middot;</span>
            <span className="uppercase tracking-wider font-mono text-[10px] px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              Status: {meeting.status}
            </span>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2">
          {meeting.status === "pending" && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 p-2 rounded">
              <span className="text-xs font-mono font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
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
              className="px-3 py-1.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-medium rounded hover:bg-stone-800 dark:hover:bg-stone-300 transition-colors"
            >
              Re-process AI
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1.5 text-xs font-medium text-stone-400 dark:text-stone-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded text-red-700 dark:text-red-300 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Processing Stepper */}
      {isProcessing && (
        <div className="mb-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-sm">
          {/* Header */}
          <div className="mb-5 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 shadow-sm z-10 relative">
                    {currentStep >= i ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(74,222,128,0.25)]" />
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold text-stone-400 dark:text-stone-500">{i}</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 leading-tight">Processing your meeting</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${meeting.status === "failed" || meeting.status === "error" ? "bg-red-50 text-red-700 border border-red-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
                    {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{statusDescription(meeting.status)}</p>
              </div>
            </div>
            <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-2 mb-1 overflow-hidden">
              <div className={`h-full bg-emerald-600 transition-all duration-500 ease-out`} style={{ width: `${progressPct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-tighter">
              <span>{progressPct}% complete</span>
              <span>~{etaText(meeting.status)}</span>
            </div>
          </div>

          {/* Vertical stepper */}
          <div className="relative px-4">
            <div className="absolute left-2 top-4 bottom-4 w-0.5 bg-stone-200 dark:bg-stone-700" />
            {steps.map((step, idx) => {
              const done = step.complete;
              const active = step.active;
              return (
                <div key={step.id} className="relative mb-10 group flex items-start gap-3">
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    done
                      ? "bg-emerald-600 border-emerald-600"
                      : active
                        ? "bg-emerald-500 border-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.35)] animate-pulse"
                        : "bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700"
                  } border-2`}>
                    {done ? (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    ) : active ? (
                      <div className="w-3 h-3 rounded-full bg-white animate-spin" />
                    ) : (
                      <div className="text-[11px] font-bold text-stone-400 dark:text-stone-500">{idx + 1}</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold tracking-tighter leading-tight ${
                      active ? "text-stone-900 dark:text-stone-100" : "text-stone-500 dark:text-stone-400"
                    }`}>{step.title}</p>
                    <p className={`text-[10px] leading-tight mt-0.5 ${
                      active ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-stone-400 dark:text-stone-500"
                    }`}>{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions / error */}
          {(meeting.status === "failed" || meeting.status === "error" || error) && (
            <div className="mt-6 pt-5 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 rounded-lg p-4">
              {error && (
                <p className="text-xs text-red-700 dark:text-red-400 font-medium mb-3">{error}</p>
              )}
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors flex items-center gap-2"
              >
                {isRetrying ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                )}
                Re-process AI
              </button>
            </div>
          )}
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
            <div className="p-12 text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg">
              <p className="text-stone-500 dark:text-stone-400 text-xs font-medium">No structured summary generated yet</p>
              <p className="text-stone-400 dark:text-stone-500 text-[11px] mt-1">
                {meeting.status === "completed"
                  ? "The recording contained insufficient speech to extract bullet points. Review the transcript below."
                  : "Click 'Re-process AI' above to trigger summarization."}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Action Items */}
        <div>
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4 border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="text-xs font-semibold tracking-wider uppercase text-stone-500 dark:text-stone-400">Action Items</h3>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                {actionItems.length}
              </span>
            </div>

            {actionItems.length === 0 ? (
              <p className="text-xs text-stone-400 dark:text-stone-500 italic py-4 text-center">No action items detected.</p>
            ) : (
              <div className="space-y-3">
                {actionItems.map((item) => (
                  <div key={item.id} className="p-3.5 bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 rounded">
                    <div className="flex items-start gap-2 mb-2">
                      <PriorityDot priority={item.priority} />
                      <p className="text-xs text-stone-900 dark:text-stone-100 font-medium leading-relaxed flex-1">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-stone-200/60 dark:border-stone-700/60 text-[11px]">
                      <span className="font-medium text-stone-500 dark:text-stone-400">
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
        <div className="mt-12 pt-8 border-t border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-stone-500 dark:text-stone-400">
              Full Transcript ({transcript.language || "en"})
            </h3>
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-xs font-medium uppercase tracking-wider text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 px-3 py-1.5 rounded"
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

      {/* Floating chat launcher */}
      {!chatOpen && transcript && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-2.5 text-xs font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full shadow-lg hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors"
        >
          Ask AI ✦
        </button>
      )}
      {chatOpen && token && (
        <MeetingChat
          meetingId={meetingId}
          token={token}
          onSeek={handleCitationSeek}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
