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
    body: "Add Minute AI to Chrome in one click and sign in.",
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
    q: "What is Minute AI?",
    a: "Minute AI is an automatic note-taker for Google Meet. It captures meetings you are authorized to record, creates a timestamped transcript, and produces decisions, highlights and action items.",
  },
  {
    q: "Does a bot join my meeting?",
    a: "No bot joins your call. Minute AI records from your browser after you install and sign in, so you remain responsible for following applicable recording and participant-notice requirements.",
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
    q: "What does it cost?",
    a: "Free to start, no credit card required. Create an account, add the extension, and capture your next meeting.",
  },
];

export const DEFINITION_ANSWER =
  "Minute AI is an automatic note-taker for Google Meet. It captures meetings you are authorized to record, creates a timestamped transcript, and produces decisions, blockers, next steps and action items. Ask anything, and every answer cites the transcript. No bot joins your call and no admin setup is required.";

export const TICKER = [
  "Automatic capture",
  "Post-call summaries",
  "Action items",
  "Timestamped transcripts",
  "Decisions & next steps",
  "Ask AI",
  "Cited answers",
  "Copy & export",
  "Private account",
  "No bots",
];
