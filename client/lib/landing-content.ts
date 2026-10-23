/**
 * Static landing-page content shared between the server-rendered markup
 * and the JSON-LD structured data (FAQPage, HowTo). Single source of truth
 * so copy and schema can never drift apart.
 */

export interface Step {
  n: string;
  title: string;
  body: string;
}

export const STEPS: Step[] = [
  {
    n: "01",
    title: "Install the extension",
    body: "Add Minutes to Chrome in one click and sign in.",
  },
  {
    n: "02",
    title: "Meet like normal",
    body: "Join your Google Meet. The extension captures tab audio while you record.",
  },
  {
    n: "03",
    title: "Review the notes",
    body: "Transcript, summary, and action items appear in your dashboard after the call.",
  },
];

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: "What is Minutes?",
    a: "Minutes is meeting notes for Indian sales teams. It captures Hindi, English, and Hinglish sales calls in the same sentence, then gives you timestamps, summaries, and action items. It is open source.",
  },
  {
    q: "Does a bot join my meeting?",
    a: "No bot joins your call. Minutes records from your browser after you install and sign in, so you remain responsible for following applicable recording and participant-notice requirements.",
  },
  {
    q: "Can I ask questions about a meeting?",
    a: "Yes. Open any processed meeting and ask — answers are grounded in that meeting's transcript and cite the exact moments, so you can click a citation and listen back to the source.",
  },
  {
    q: "Is my meeting data private?",
    a: "Meetings are associated with your private account. Audio, transcripts and summaries are processed by our infrastructure and AI providers. Deleting a meeting removes its active transcript, notes, action items and stored audio; see our Privacy Policy for processing details.",
  },
  {
    q: "Is it free?",
    a: "Minutes is open source. Install the extension and use it at no cost.",
  },
];

export const DEFINITION_ANSWER =
  "Minutes is meeting notes for Indian sales teams. It captures Hindi, English, and Hinglish sales calls in the same sentence, then gives you timestamps, summaries, and action items. Ask anything, and every answer cites the transcript. No bot joins your call and no admin setup is required. Open source.";

export const TICKER = [
  "Hindi English Hinglish support",
  "Sales call notes",
  "Action items",
  "Timestamped transcripts",
  "Decisions & next steps",
  "Ask your meetings",
  "Cited answers",
  "Copy & export",
  "Private account",
  "No bots",
  "Open source",
];
