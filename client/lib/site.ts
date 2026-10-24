/**
 * Canonical site URL used for metadata, sitemap, robots and structured data.
 *
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://minutes.itsokyash.online)
 * — the fallback is only so builds never break without it.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://minutes.itsokyash.online"
).replace(/\/+$/, "");

export const SITE_NAME = "Minutes";

export const SITE_DESCRIPTION =
  "Minutes is meeting notes for Indian sales teams. It captures Hindi, English, and Hinglish sales calls in the same sentence, then gives you timestamps, summaries, and action items. Open source.";
