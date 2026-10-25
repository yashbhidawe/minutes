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

export const STEPS_HI: Step[] = [
  {
    n: "01",
    title: "एक्सटेंशन इंस्टॉल करें",
    body: "एक क्लिक में Chrome में मिनट्स जोड़ें और साइन इन करें।",
  },
  {
    n: "02",
    title: "हमेशा की तरह मीटिंग करें",
    body: "अपनी Google Meet में जुड़ें। रिकॉर्डिंग के दौरान एक्सटेंशन टैब का ऑडियो कैप्चर करता है।",
  },
  {
    n: "03",
    title: "नोट्स देखें",
    body: "कॉल के बाद ट्रांसक्रिप्ट, सारांश और एक्शन आइटम आपके डैशबोर्ड में आ जाते हैं।",
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

export const FAQS_HI: Faq[] = [
  {
    q: "मिनट्स क्या है?",
    a: "मिनट्स भारतीय सेल्स टीम के लिए मीटिंग नोट्स है। यह हिंदी, अंग्रेजी और हिंग्लिश सेल्स कॉल को एक ही वाक्य में कैप्चर करता है, फिर टाइमस्टैम्प, सारांश और एक्शन आइटम देता है। यह ओपन सोर्स है।",
  },
  {
    q: "क्या मेरी मीटिंग में कोई बॉट जुड़ता है?",
    a: "नहीं, आपकी कॉल में कोई बॉट शामिल नहीं होता। एक्सटेंशन इंस्टॉल करके साइन इन करने के बाद मिनट्स आपके ब्राउज़र से रिकॉर्ड करता है, इसलिए रिकॉर्डिंग और प्रतिभागियों को सूचित करने से जुड़े लागू नियमों का पालन करना आपकी ज़िम्मेदारी है।",
  },
  {
    q: "क्या मैं मीटिंग के बारे में सवाल पूछ सकता/सकती हूं?",
    a: "हां। कोई भी प्रोसेस हुई मीटिंग खोलकर पूछें — जवाब उसी मीटिंग के ट्रांसक्रिप्ट पर आधारित होते हैं और सटीक पलों का हवाला देते हैं, ताकि आप हवाले पर क्लिक करके मूल ऑडियो सुन सकें।",
  },
  {
    q: "क्या मेरा मीटिंग डेटा निजी है?",
    a: "मीटिंग आपके निजी अकाउंट से जुड़ी होती हैं। ऑडियो, ट्रांसक्रिप्ट और सारांश हमारे इंफ्रास्ट्रक्चर और AI प्रोवाइडर द्वारा प्रोसेस किए जाते हैं। मीटिंग हटाने पर उसका सक्रिय ट्रांसक्रिप्ट, नोट्स, एक्शन आइटम और संग्रहीत ऑडियो हट जाता है; प्रोसेसिंग का विवरण हमारी गोपनीयता नीति में देखें।",
  },
  {
    q: "क्या यह मुफ़्त है?",
    a: "मिनट्स ओपन सोर्स है। एक्सटेंशन इंस्टॉल करें और बिना किसी खर्च के इस्तेमाल करें।",
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
