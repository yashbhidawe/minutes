import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_URL } from "@/lib/site";

const title = "Sign in";
const description =
  "Sign in to Minutes to access your meeting notes, summaries and action items.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/login" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/login`,
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

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
