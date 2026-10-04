import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard-shell";

export const metadata: Metadata = {
  title: "Ask All Meetings",
  description: "Ask questions across all your indexed meeting transcripts.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SearchLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
