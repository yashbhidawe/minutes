import { COPY, type Locale } from "@/lib/landing-copy";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

/* Structured data: one @graph so crawlers + answer engines get
   Organization, WebSite, SoftwareApplication, FAQPage, HowTo, Breadcrumb. */
export function JsonLd({ locale = "en" }: { locale?: Locale }) {
  const c = COPY[locale];
  const url = locale === "hi" ? `${SITE_URL}/hi/` : SITE_URL;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Chrome",
        url: SITE_URL,
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "FAQPage",
        mainEntity: c.faq.items.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "HowTo",
        name: c.jsonLd.howToName,
        description: c.jsonLd.howToDescription,
        step: c.how.steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.title,
          text: s.body,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: c.jsonLd.home, item: url },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(graph).replace(/</g, "\\u003c"),
      }}
    />
  );
}
