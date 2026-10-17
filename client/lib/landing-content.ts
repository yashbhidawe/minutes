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
  "Minute AI is an automatic note-taker for Google Meet. It captures meetings you are authorized to record, creates a timestamped transcript, and produces decisions, blockers, next steps and action items. Ask anything, and every answer cites the transcript. No bot joins your call and no admin setup is required.";

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
    q: "Do I need permission from IT or the host?",
    a: "No admin installation is required. You install the extension in your own browser, sign in, and can then record meetings you are authorized to capture.",
  },
  {
    q: "How fast do I get notes?",
    a: "After the recording uploads and processing completes, your dashboard updates with the transcript and summary. Processing time depends on recording length and service availability.",
  },
  {
    q: "What do I actually get per meeting?",
    a: "A timestamped transcript, a clean summary (key decisions, highlights, blockers, next steps), action items with owners when identified, and the audio to listen back. Ask anything and answers cite the transcript — copy or export the summary from your dashboard.",
  },
  {
    q: "Can I ask questions about a meeting?",
    a: "Yes. Open any processed meeting and ask — answers are grounded in that meeting's transcript and cite the exact moments, so you can click a citation and listen back to the source.",
  },
  {
    q: "Can I search across all my meetings?",
    a: "Yes. Ask a question across your indexed meeting history and the answer names the meetings it drew from, with links straight to the source.",
  },
  {
    q: "Is my meeting data private?",
    a: "Meetings are associated with your private account. Audio, transcripts and summaries are processed by our infrastructure and AI providers. Deleting a meeting removes its active transcript, notes, action items and stored audio; see the Privacy Policy for details.",
  },
  {
    q: "What does it cost?",
    a: "Free to start, no credit card required. Create an account, add the extension, and capture your next meeting.",
  },
  {
    q: "How do I install the extension without the Chrome Web Store?",
    a: "Download the extension zip from our install page, unzip it, open chrome://extensions, enable Developer mode, and click Load unpacked. It takes about 2 minutes and updates are a re-download until our Web Store listing is live.",
  },
];

export const STEPS: Step[] = [
  {
    n: "01",
    title: "Meet like normal",
    body: "Join your Google Meet as usual. No bot to invite. You stay responsible for meeting recording permissions and participant notice.",
  },
  {
    n: "02",
    title: "We capture it",
    body: "With the extension installed and signed in, it captures the active Meet tab while recording is active.",
  },
  {
    n: "03",
    title: "Read every word",
    body: "Skim a transcript with timestamps, ask a question and jump to the exact moment, or revisit the original audio when you need more context.",
  },
  {
    n: "04",
    title: "Walk away with clarity",
    body: "Decisions, highlights, blockers, next steps and action items — ready to copy, export and act on.",
  },
];

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
