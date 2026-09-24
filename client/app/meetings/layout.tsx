import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Meeting notes",
  description: "Private meeting notes, transcript and action items.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MeetingsLayout({ children }: { children: ReactNode }) {
  return children;
}
