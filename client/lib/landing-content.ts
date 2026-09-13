/**
 * Static landing-page content shared between the server-rendered markup
 * and the JSON-LD structured data (FAQPage, HowTo). Single source of truth
 * so copy and schema can never drift apart.
 */

export interface Faq {
  q: string;
  a: string;
}

export interface Step {
  n: string;
  title: string;
  body: string;
}

export const DEFINITION_ANSWER =
  "Minute AI is an automatic note-taker for Google Meet. It captures your meeting, writes a searchable transcript, and produces a clear summary — key decisions, highlights, blockers, next steps and owned action items — minutes after you hang up. No bots join your call and no setup is required.";

export const FAQS: Faq[] = [
  {
    q: "What is Minute AI?",
    a: "Minute AI is an automatic note-taker for Google Meet. It captures your meeting, writes a searchable transcript, and produces decisions, highlights and action items — minutes after you hang up.",
  },
  {
    q: "Does a bot join my meeting?",
    a: "No. Nothing joins your call and your team sees no change. Minute AI works quietly in the background while you meet like normal.",
  },
  {
    q: "Do I need permission from IT or the host?",
    a: "No. There is nothing for an admin to install and no settings to change. If you can join the call, Minute AI can take notes for you.",
  },
  {
    q: "How fast do I get notes?",
    a: "Minutes after you hang up. Your dashboard updates on its own — you'll see the meeting move from recording to a finished summary without refreshing.",
  },
  {
    q: "What do I actually get per meeting?",
    a: "A searchable transcript, a clean summary (key decisions, highlights, blockers, next steps), action items with owners, plus the audio to listen back. Copy it, share it, done.",
  },
  {
    q: "Is my meeting data private?",
    a: "Yes. Meetings live in your private account only. Delete a meeting and its notes, action items and transcript are gone for good.",
  },
  {
    q: "What does it cost?",
    a: "Free to start, no credit card required. Create an account, add the extension, and capture your next meeting.",
  },
];

export const STEPS: Step[] = [
  {
    n: "01",
    title: "Meet like normal",
    body: "Join your Google Meet as usual. No bots to invite, nothing to click, zero setup for your team.",
  },
  {
    n: "02",
    title: "We capture it",
    body: "Minute AI captures the conversation automatically and takes over the moment the call ends.",
  },
  {
    n: "03",
    title: "Read every word",
    body: "Get a full transcript you can skim, search and revisit — every key moment timestamped.",
  },
  {
    n: "04",
    title: "Walk away with clarity",
    body: "Decisions, highlights, blockers, next steps and owned action items — ready to share in minutes.",
  },
];

export const TICKER = [
  "Automatic capture",
  "Instant summaries",
  "Action items",
  "Searchable transcripts",
  "Decisions & next steps",
  "One-click sharing",
  "Private by default",
  "No bots",
];
