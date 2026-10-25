/**
 * Locale-aware copy for the landing sections. Every section component takes a
 * `locale` prop and reads its strings from here, so the English and Hindi
 * pages render the exact same components and can never drift in structure.
 */
import { FAQS, FAQS_HI, STEPS, STEPS_HI, type Faq, type Step } from "./landing-content";

export type Locale = "en" | "hi";

export interface LandingCopy {
  htmlLang: string;
  homeHref: string;
  authCta: {
    openDashboard: string;
    createFree: string;
    signIn: string;
    tryFree: string;
    getExtension: string;
    startCapturing: string;
    howItWorks: string;
  };
  hero: { lead: string; emphasis: string; body: string; bullets: [string, string, string] };
  demo: {
    windowTitle: string;
    title: string;
    meta: string;
    decisionsLabel: string;
    decisions: [string, string];
    highlightLabel: string;
    quote: string;
    question: string;
    answer: string;
  };
  how: { eyebrow: string; heading: string; steps: Step[] };
  features: {
    eyebrow: string;
    lead: string;
    emphasis: string;
    items: [
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
    ];
  };
  extension: {
    eyebrow: string;
    heading: string;
    body: string;
    cta: string;
    privacy: string;
    widget: [string, string, string];
  };
  ask: {
    heading: string;
    body: string;
    meeting: string;
    answered: string;
    question: string;
    answer: string;
    placeholder: string;
    button: string;
  };
  faq: { eyebrow: string; lead: string; emphasis: string; items: Faq[] };
  footer: {
    tagline: string;
    howItWorks: string;
    product: string;
    salesTeams: string;
    hindiHinglish: string;
    getExtension: string;
    dashboard: string;
    signIn: string;
    createAccount: string;
    privacy: string;
    noBots: string;
  };
  jsonLd: { howToName: string; howToDescription: string; home: string };
}

const en: LandingCopy = {
  htmlLang: "en",
  homeHref: "/",
  authCta: {
    openDashboard: "Open dashboard",
    createFree: "Create free account",
    signIn: "Sign in",
    tryFree: "Try it free",
    getExtension: "Get the extension",
    startCapturing: "Start capturing — it's free",
    howItWorks: "How it works",
  },
  hero: {
    lead: "Meeting notes for Hindi, English,",
    emphasis: "and Hinglish sales calls.",
    body: "Minutes captures your client calls in Hindi, English, and Hinglish — mixed in the same sentence. You get timestamps, summaries, and action items after the call. Open source.",
    bullets: ["No bot joins your call", "Browser only — no admin setup", "Answers cite the transcript"],
  },
  demo: {
    windowTitle: "Your meeting summary",
    title: "Weekly Team Sync",
    meta: "Tuesday · 32 min · 4 people",
    decisionsLabel: "Key decisions",
    decisions: ["Approved the new onboarding flow for next sprint.", "Paused the homepage rewrite until research lands."],
    highlightLabel: "Transcript highlight",
    quote: "“…so the summary lands before standup, nobody needs to rewatch the call.”",
    question: "What did we decide about the launch?",
    answer: "Launch stays on Friday. The homepage rewrite is paused until research lands.",
  },
  how: { eyebrow: "How it works", heading: "Three steps. No bot.", steps: STEPS },
  features: {
    eyebrow: "Features",
    lead: "Everything after",
    emphasis: "“bye, thanks all”",
    items: [
      {
        title: "Transcripts you can trust",
        body: "Every word captured with timestamps. Click any moment to jump straight to that part of the audio.",
      },
      {
        title: "Summaries worth copying",
        body: "Decisions, blockers, highlights, next steps — structured so you can paste them straight into Slack or Notion.",
      },
      {
        title: "Action items that stick",
        body: "Owners, due dates, and priorities. Nothing evaporates after the call ends.",
      },
    ],
  },
  extension: {
    eyebrow: "Chrome extension",
    heading: "Installs in a minute.",
    body: "Add Minutes once, sign in, and it captures your Google Meet, Zoom or Teams tab audio while you record. A floating widget shows you're live — then the notes appear in your dashboard when the call ends.",
    cta: "Get the extension",
    privacy: "Privacy policy",
    widget: ["Recording tab audio", "Capturing your microphone", "Transcribing after the call"],
  },
  ask: {
    heading: "Ask your meetings anything.",
    body: "Open any processed meeting and type a question. Answers are grounded in that meeting's transcript and cite the exact moments — click a citation and the audio jumps there.",
    meeting: "Weekly Team Sync",
    answered: "answered",
    question: "What did we decide about the launch?",
    answer: "Launch stays on Friday. The homepage rewrite is paused until research lands.",
    placeholder: "Ask about this meeting…",
    button: "Ask",
  },
  faq: { eyebrow: "FAQ", lead: "Asked on", emphasis: "every call", items: FAQS },
  footer: {
    tagline: "Meeting notes for Hindi, English, and Hinglish sales calls. Open source.",
    howItWorks: "How it works",
    product: "Product",
    salesTeams: "Sales teams",
    hindiHinglish: "Hindi Hinglish transcription",
    getExtension: "Get the extension",
    dashboard: "Dashboard",
    signIn: "Sign in",
    createAccount: "Create account",
    privacy: "Privacy policy",
    noBots: "No bots join your calls.",
  },
  jsonLd: {
    howToName: "How to get meeting notes for Hindi, English, and Hinglish sales calls",
    howToDescription:
      "Record a meeting you are authorized to capture and review its transcript, summary and action items after processing.",
    home: "Home",
  },
};

const hi: LandingCopy = {
  htmlLang: "hi",
  homeHref: "/hi/",
  authCta: {
    openDashboard: "डैशबोर्ड खोलें",
    createFree: "मुफ़्त अकाउंट बनाएं",
    signIn: "साइन इन करें",
    tryFree: "मुफ़्त में आज़माएं",
    getExtension: "एक्सटेंशन इंस्टॉल करें",
    startCapturing: "रिकॉर्डिंग शुरू करें — मुफ़्त है",
    howItWorks: "कैसे काम करता है",
  },
  hero: {
    lead: "हिंदी, अंग्रेजी और हिंग्लिश",
    emphasis: "सेल्स कॉल के लिए मीटिंग नोट्स।",
    body: "मिनट्स आपकी क्लाइंट कॉल को हिंदी, अंग्रेजी और हिंग्लिश में कैप्चर करता है — एक ही वाक्य में मिलाकर भी। कॉल के बाद आपको टाइमस्टैम्प, सारांश और एक्शन आइटम मिलते हैं। ओपन सोर्स।",
    bullets: ["कोई बॉट आपकी कॉल में शामिल नहीं होता", "सिर्फ़ ब्राउज़र — कोई एडमिन सेटअप नहीं", "हर जवाब ट्रांसक्रिप्ट का हवाला देता है"],
  },
  demo: {
    windowTitle: "आपकी मीटिंग का सारांश",
    title: "वीकली टीम सिंक",
    meta: "मंगलवार · 32 मिनट · 4 लोग",
    decisionsLabel: "मुख्य फैसले",
    decisions: ["अगले स्प्रिंट के लिए नया ऑनबोर्डिंग फ़्लो मंज़ूर हुआ।", "रिसर्च आने तक होमपेज का रीराइट रोका गया।"],
    highlightLabel: "ट्रांसक्रिप्ट हाइलाइट",
    quote: "“…ताकि स्टैंडअप से पहले सारांश मिल जाए, किसी को कॉल दोबारा देखने की ज़रूरत न पड़े।”",
    question: "लॉन्च के बारे में हमने क्या तय किया?",
    answer: "लॉन्च शुक्रवार को ही रहेगा। रिसर्च आने तक होमपेज का रीराइट रुका हुआ है।",
  },
  how: { eyebrow: "कैसे काम करता है", heading: "तीन कदम। कोई बॉट नहीं।", steps: STEPS_HI },
  features: {
    eyebrow: "विशेषताएं",
    lead: "कॉल खत्म होने के बाद सब कुछ,",
    emphasis: "“bye, thanks all” के बाद",
    items: [
      {
        title: "भरोसेमंद ट्रांसक्रिप्ट",
        body: "हर शब्द टाइमस्टैम्प के साथ। किसी भी पल पर क्लिक करें और ऑडियो सीधे उसी हिस्से पर पहुंच जाता है।",
      },
      {
        title: "कॉपी करने लायक सारांश",
        body: "फैसले, ब्लॉकर, हाइलाइट और अगले कदम — इस तरह व्यवस्थित कि सीधे Slack या Notion में पेस्ट कर सकें।",
      },
      {
        title: "एक्शन आइटम जो याद रहें",
        body: "ज़िम्मेदार व्यक्ति, अंतिम तारीख और प्राथमिकता। कॉल खत्म होने के बाद कुछ भी गुम नहीं होता।",
      },
    ],
  },
  extension: {
    eyebrow: "Chrome एक्सटेंशन",
    heading: "एक मिनट में इंस्टॉल।",
    body: "मिनट्स को एक बार जोड़ें, साइन इन करें, और रिकॉर्डिंग के दौरान यह आपके Google Meet, Zoom या Teams टैब का ऑडियो कैप्चर करता है। एक फ्लोटिंग विजेट दिखाता है कि रिकॉर्डिंग चालू है — कॉल खत्म होते ही नोट्स आपके डैशबोर्ड में आ जाते हैं।",
    cta: "एक्सटेंशन इंस्टॉल करें",
    privacy: "गोपनीयता नीति",
    widget: ["टैब का ऑडियो रिकॉर्ड हो रहा है", "आपका माइक्रोफ़ोन कैप्चर हो रहा है", "कॉल के बाद ट्रांसक्रिप्शन होगा"],
  },
  ask: {
    heading: "अपनी मीटिंग से कुछ भी पूछें।",
    body: "कोई भी प्रोसेस हुई मीटिंग खोलें और सवाल लिखें। जवाब उसी मीटिंग के ट्रांसक्रिप्ट पर आधारित होते हैं और सटीक पलों का हवाला देते हैं — हवाले पर क्लिक करें और ऑडियो वहीं पहुंच जाता है।",
    meeting: "वीकली टीम सिंक",
    answered: "जवाब मिला",
    question: "लॉन्च के बारे में हमने क्या तय किया?",
    answer: "लॉन्च शुक्रवार को ही रहेगा। रिसर्च आने तक होमपेज का रीराइट रुका हुआ है।",
    placeholder: "इस मीटिंग के बारे में पूछें…",
    button: "पूछें",
  },
  faq: { eyebrow: "अक्सर पूछे जाने वाले प्रश्न", lead: "हर कॉल में", emphasis: "पूछे जाने वाले सवाल", items: FAQS_HI },
  footer: {
    tagline: "हिंदी, अंग्रेजी और हिंग्लिश सेल्स कॉल के लिए मीटिंग नोट्स। ओपन सोर्स।",
    howItWorks: "कैसे काम करता है",
    product: "उत्पाद",
    salesTeams: "सेल्स टीम",
    hindiHinglish: "हिंदी हिंग्लिश ट्रांसक्रिप्शन",
    getExtension: "एक्सटेंशन इंस्टॉल करें",
    dashboard: "डैशबोर्ड",
    signIn: "साइन इन करें",
    createAccount: "अकाउंट बनाएं",
    privacy: "गोपनीयता नीति",
    noBots: "आपकी कॉल में कोई बॉट शामिल नहीं होता।",
  },
  jsonLd: {
    howToName: "हिंदी, अंग्रेजी और हिंग्लिश सेल्स कॉल के मीटिंग नोट्स कैसे पाएं",
    howToDescription:
      "जिस मीटिंग को रिकॉर्ड करने की आपको अनुमति है उसे रिकॉर्ड करें और प्रोसेसिंग के बाद उसका ट्रांसक्रिप्ट, सारांश और एक्शन आइटम देखें।",
    home: "होम",
  },
};

export const COPY: Record<Locale, LandingCopy> = { en, hi };
