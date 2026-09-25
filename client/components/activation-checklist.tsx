"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ExtensionStatus = "checking" | "not-installed" | "signed-out" | "ready";

type ActivationChecklistProps = {
  hasRecording: boolean;
  hasSummary: boolean;
};

type Step = {
  key: string;
  title: string;
  body: string;
  complete: boolean;
  href?: string;
  linkLabel?: string;
};

export function ActivationChecklist({ hasRecording, hasSummary }: ActivationChecklistProps) {
  const [extensionStatus, setExtensionStatus] = useState<ExtensionStatus>("checking");

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; authenticated?: unknown } | null;
      if (data?.type !== "MINUTE_AI_EXTENSION_STATUS") return;
      setExtensionStatus(data.authenticated === true ? "ready" : "signed-out");
    };

    window.addEventListener("message", handleMessage);
    window.postMessage(
      { type: "MINUTE_AI_EXTENSION_STATUS_REQUEST" },
      window.location.origin
    );

    const timeout = window.setTimeout(() => {
      setExtensionStatus((current) =>
        current === "checking" ? "not-installed" : current
      );
    }, 1500);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const extensionInstalled = extensionStatus !== "checking" && extensionStatus !== "not-installed";
  const steps: Step[] = [
    {
      key: "extension",
      title: "Install the Chrome extension",
      body:
        extensionStatus === "checking"
          ? "Checking this browser..."
          : extensionStatus === "not-installed"
            ? "Install Minute AI to record Google Meet calls."
            : "Minute AI is installed in this browser.",
      complete: extensionInstalled,
      href: extensionInstalled ? undefined : "/install",
      linkLabel: extensionInstalled ? undefined : "Install extension",
    },
    {
      key: "account",
      title: "Connect your account",
      body:
        extensionStatus === "ready"
          ? "Your dashboard session is connected to the extension."
          : "Open the extension popup and sign in with the account you use here.",
      complete: extensionStatus === "ready",
      href: extensionStatus === "ready" ? undefined : "/install#sign-in",
      linkLabel: extensionStatus === "ready" ? undefined : "Show sign-in steps",
    },
    {
      key: "recording",
      title: "Record your first Google Meet",
      body: hasRecording
        ? "Your first recording has been uploaded."
        : "Join a Google Meet call and let the extension finish uploading it.",
      complete: hasRecording,
    },
    {
      key: "summary",
      title: "Read your first summary",
      body: hasSummary
        ? "Your first meeting summary is ready in the dashboard."
        : "Your transcript, decisions and action items will appear here after processing.",
      complete: hasSummary,
    },
  ];

  const completedCount = steps.filter((step) => step.complete).length;

  if (completedCount === steps.length) {
    return (
      <section className="mb-8 rounded-lg border border-emerald-200 bg-emerald-50 p-5" aria-labelledby="activation-complete-heading">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm text-white">
            ✓
          </span>
          <div>
            <h2 id="activation-complete-heading" className="text-sm font-semibold text-emerald-950">
              Setup complete
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-emerald-800">
              Your extension is connected and your first meeting summary is ready.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8 rounded-lg border border-stone-200 bg-white p-5 sm:p-6" aria-labelledby="activation-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            First meeting setup
          </p>
          <h2 id="activation-heading" className="mt-1 text-lg font-semibold tracking-tight text-stone-950">
            Get from install to your first summary
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            Follow these four steps once. Minute AI will take care of the rest.
          </p>
        </div>
        <p className="text-xs font-medium text-stone-500 sm:pt-1">
          {completedCount} of {steps.length} complete
        </p>
      </div>
      <ol className="mt-5 grid gap-3 sm:grid-cols-2">
        {steps.map((step, index) => (
          <li
            key={step.key}
            className={`rounded-lg border p-4 ${step.complete ? "border-emerald-200 bg-emerald-50/50" : "border-stone-200 bg-stone-50"}`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${step.complete ? "bg-emerald-600 text-white" : "bg-stone-900 text-white"}`}
                aria-hidden
              >
                {step.complete ? "✓" : index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-stone-900">{step.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-stone-500">{step.body}</p>
                {step.href && step.linkLabel && (
                  <Link
                    href={step.href}
                    className="mt-2 inline-block text-xs font-semibold text-stone-900 underline underline-offset-4 hover:text-stone-600"
                  >
                    {step.linkLabel}
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
