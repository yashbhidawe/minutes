import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_URL } from "@/lib/site";

const title = "Create your free account";
const description =
  "Create a free Minutes account to turn your Google Meet calls into summaries, decisions and action items.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/register" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/register`,
    title: `${title} · Minutes`,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} · Minutes`,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
