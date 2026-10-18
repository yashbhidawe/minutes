import type { Metadata } from "next";
import { SITE_DESCRIPTION } from "@/lib/site";
import { LandingNav } from "@/components/landing";
import {
  ExtensionSection,
  AskSection,
  Features,
  Hero,
  HowItWorks,
  JsonLd,
  SiteFooter,
} from "@/components/landing/sections";

export const metadata: Metadata = {
  title: "Automatic Meeting Notes for Google Meet",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
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
        <SiteFooter />
      </main>
    </div>
  );
}
