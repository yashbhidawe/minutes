"use client";

import { useEffect, useRef, useState } from "react";
import { api, ChatCitation, ApiError } from "@/lib/api";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  citations?: ChatCitation[];
}

function formatTs(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

const SUGGESTIONS = [
  "What were the key decisions?",
  "List the action items and owners.",
  "What blockers were raised?",
];

export default function MeetingChat({
  meetingId,
  token,
  onSeek,
  onClose,
}: {
  meetingId: number;
  token: string;
  onSeek: (sec: number) => void;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking]);

  const send = async (question: string) => {
    const q = question.trim();
    if (!q || asking) return;
    setInput("");
    setError("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setAsking(true);
    try {
      const res = await api.chat.ask(meetingId, q, token);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: res.answer, citations: res.citations },
      ]);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.status === 400
            ? "No searchable transcript yet — transcribe this meeting first."
            : err.message
          : "Failed to get an answer. Try again.";
      setError(msg);
      setMessages((prev) => prev.slice(0, -1));
      setInput(q);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[22rem] max-w-[calc(100vw-3rem)] h-[32rem] max-h-[calc(100vh-6rem)] bg-white border border-stone-200 rounded-lg shadow-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-900 text-white shrink-0">
        <div>
          <p className="text-xs font-semibold tracking-wide">Ask this meeting</p>
          <p className="text-[10px] text-stone-400">Grounded in the transcript</p>
        </div>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-white text-sm px-1 transition-colors"
          aria-label="Close chat"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-stone-50">
        {messages.length === 0 && !asking && (
          <div>
            <p className="text-xs text-stone-500 leading-relaxed mb-3">
              Ask anything about this meeting. Answers cite the transcript — click a timestamp to jump the audio there.
            </p>
            <div className="space-y-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="block w-full text-left text-xs text-stone-700 bg-white border border-stone-200 rounded px-3 py-2 hover:border-stone-400 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] bg-stone-900 text-white text-xs leading-relaxed rounded-lg rounded-br-sm px-3 py-2"
                  : "max-w-[95%] bg-white border border-stone-200 text-xs text-stone-800 leading-relaxed rounded-lg rounded-bl-sm px-3 py-2"
              }
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.role === "assistant" && m.citations && m.citations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-stone-100">
                  {m.citations.map((c, j) => (
                    <button
                      key={j}
                      disabled={c.start_sec == null}
                      onClick={() => c.start_sec != null && onSeek(c.start_sec)}
                      title={c.text}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-600 hover:bg-stone-200 hover:text-stone-900 transition-colors disabled:opacity-40 disabled:cursor-default"
                    >
                      {c.start_sec != null ? `▶ ${formatTs(c.start_sec)}` : "cited"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {asking && (
          <div className="flex justify-start">
            <div className="bg-white border border-stone-200 rounded-lg rounded-bl-sm px-3 py-2.5 flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] text-stone-500">Searching transcript...</span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 px-3 py-2.5 border-t border-stone-100 bg-white shrink-0"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this meeting..."
          disabled={asking}
          className="flex-1 text-xs px-3 py-2 border border-stone-200 rounded bg-stone-50 focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder:text-stone-400"
        />
        <button
          type="submit"
          disabled={asking || !input.trim()}
          className="px-3 py-2 text-xs font-medium bg-stone-900 text-white rounded hover:bg-stone-700 transition-colors disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
