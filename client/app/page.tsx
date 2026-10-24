import type { Metadata } from "next";
import { SITE_DESCRIPTION, LANGUAGE_URLS } from "@/lib/site";
import { LandingNav } from "@/components/landing";
import {
  ExtensionSection,
  FaqSection,
  AskSection,
  Features,
  Hero,
  HowItWorks,
  JsonLd,
  SiteFooter,
} from "@/components/landing/sections";

export const metadata: Metadata = {
  title: "Meeting Notes for Hindi, English, and Hinglish Sales Calls",
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
    languages: LANGUAGE_URLS,
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0f0f0e] text-stone-900 dark:text-stone-50 antialiased overflow-x-clip">
      <JsonLd />
      <LandingNav />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <ExtensionSection />
        <AskSection />
        <FaqSection />
        <SiteFooter />
      </main>
    </div>
  );
}
