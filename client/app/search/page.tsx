"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, GlobalCitation } from "@/lib/api";

interface GlobalMessage {
  role: "user" | "assistant";
  text: string;
  citations?: GlobalCitation[];
}

const SUGGESTIONS = [
  "What did we decide about the release this week?",
  "What blockers came up across my meetings?",
  "Summarize what each meeting was about.",
];

export default function SearchPage() {
  const { token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<GlobalMessage[]>([]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !token) router.push("/login");
  }, [token, authLoading, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking]);

  const send = async (question: string) => {
    const q = question.trim();
    if (!q || asking || !token) return;
    setInput("");
    setError("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setAsking(true);
    try {
      const res = await api.chat.askGlobal(q, token);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: res.answer, citations: res.citations },
      ]);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.status === 404
            ? "Nothing indexed yet — open a meeting and ask it something first."
            : err.message
          : "Failed to get an answer. Try again.";
      setError(msg);
      setMessages((prev) => prev.slice(0, -1));
      setInput(q);
    } finally {
      setAsking(false);
    }
  };

  if (authLoading || !token) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 flex flex-col items-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-stone-800 dark:border-stone-200 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium text-stone-500 dark:text-stone-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col min-h-[calc(100vh-3.5rem)]">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Ask all meetings</h1>
      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 mb-8">
        Searches every indexed transcript you own. Answers name their source meetings.
      </p>

      <div className="flex-1 space-y-3 mb-6">
        {messages.length === 0 && !asking && (
          <div className="grid grid-cols-1 gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-left text-sm text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-4 py-3 hover:border-stone-400 dark:hover:border-stone-500 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm leading-relaxed rounded-lg rounded-br-sm px-4 py-2.5"
                  : "max-w-full w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm text-stone-800 dark:text-stone-200 leading-relaxed rounded-lg rounded-bl-sm px-4 py-3"
              }
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.role === "assistant" && m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 space-y-1.5">
                  {m.citations.map((c, j) => (
                    <Link
                      key={j}
                      href={`/meetings/${c.meeting_id}`}
                      title={c.text}
                      className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 group"
                    >
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 group-hover:bg-stone-200 dark:group-hover:bg-stone-700">
                        {c.meeting_title}
                      </span>
                      <span className="truncate text-stone-500 dark:text-stone-400">{c.text.slice(0, 90)}…</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {asking && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg px-4 py-3 flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-stone-500 dark:text-stone-400">Searching all meetings...</span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg px-4 py-2.5">{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 sticky bottom-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-2 shadow-lg"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask across all meetings..."
          disabled={asking}
          className="flex-1 text-sm px-3 py-2 focus:outline-none placeholder:text-stone-400 dark:placeholder:text-stone-500 dark:text-stone-100 bg-transparent"
        />
        <button
          type="submit"
          disabled={asking || !input.trim()}
          className="px-4 py-2 text-xs font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors disabled:opacity-40"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
