import type { Metadata } from "next";
import { SITE_DESCRIPTION } from "@/lib/site";
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
  title: "सेल्स कॉल नोट्स हिंदी, अंग्रेजी और हिंग्लिश में — Minutes",
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/hi/",
    languages: { en: "/", hi: "/hi/" },
  },
};

export default function HindiHomePage() {
  return (
    <div lang="hi" className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-stone-900 dark:text-stone-50 antialiased overflow-x-clip">
      <JsonLd locale="hi" />
      <main>
        <Hero locale="hi" />
        <HowItWorks locale="hi" />
        <Features locale="hi" />
        <ExtensionSection locale="hi" />
        <AskSection locale="hi" />
        <FaqSection locale="hi" />
        <SiteFooter locale="hi" />
      </main>
    </div>
  );
}
