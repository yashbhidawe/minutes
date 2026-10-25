import type { Metadata, Viewport } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, LANGUAGE_URLS } from "@/lib/site";
import { HindiNav } from "@/components/landing/HindiNav";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — सेल्स कॉल नोट्स हिंदी, अंग्रेजी और हिंग्लिश में`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/hi/",
    languages: LANGUAGE_URLS,
  },
  openGraph: {
    type: "website",
    locale: "hi_IN",
    url: `${SITE_URL}/hi/`,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — सेल्स कॉल नोट्स हिंदी, अंग्रेजी और हिंग्लिश में`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — सेल्स कॉल नोट्स हिंदी, अंग्रेजी और हिंग्लिश में`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function HindiLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <HindiNav />
      {children}
    </>
  );
}
