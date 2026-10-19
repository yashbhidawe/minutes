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
  "Minutes turns meetings you are authorized to record into timestamped transcripts, summaries, decisions and action items. No bot joins your call, no admin setup, free to start.";
