import type { Metadata } from "next";
import { SITE_DESCRIPTION } from "@/lib/site";
import { LandingNav } from "@/components/landing";
import {
  AnnouncementBar,
  Definition,
  ExtensionSection,
  FaqSection,
  Features,
  FinalCta,
  Hero,
  HowItWorks,
  JsonLd,
  ProductDeepDive,
  SiteFooter,
  StatsSection,
} from "@/components/landing/sections";

export const metadata: Metadata = {
  title: "Automatic Meeting Notes for Google Meet",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 antialiased overflow-x-clip">
      <JsonLd />
      <AnnouncementBar />
      <LandingNav />
      <main>
        <Hero />
        <Definition />
        <StatsSection />
        <HowItWorks />
        <Features />
        <ProductDeepDive />
        <ExtensionSection />
        <FaqSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
