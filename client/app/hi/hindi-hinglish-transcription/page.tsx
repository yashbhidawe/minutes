import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { HindiNav } from "@/components/landing/HindiNav";
import { SiteFooter } from "@/components/landing/sections";

export const metadata: Metadata = {
  title: "हिंदी, अंग्रेजी और हिंग्लिश मीटिंग ट्रांसक्रिप्शन — Minutes",
  description:
    "मीटिंग ट्रांसक्रिप्शन जो हिंदी, अंग्रेजी और हिंग्लिश में काम करता है। मिश्रित भाषा वाली सेल्स कॉल को एक ही वाक्य में कैप्चर करता है, टाइमस्टैम्प और सारांश के साथ। ओपन सोर्स।",
  alternates: { canonical: "/hi/hindi-hinglish-transcription" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/hi/hindi-hinglish-transcription`,
    title: "हिंदी, अंग्रेजी और हिंग्लिश मीटिंग ट्रांसक्रिप्शन — Minutes",
    description:
      "मीटिंग ट्रांसक्रिप्शन जो हिंदी, अंग्रेजी और हिंग्लिश में काम करता है। मिश्रित भाषा वाली सेल्स कॉल को एक ही वाक्य में कैप्चर करता है, टाइमस्टैम्प और सारांश के साथ। ओपन सोर्स।",
  },
  twitter: {
    card: "summary_large_image",
    title: "हिंदी, अंग्रेजी और हिंग्लिश मीटिंग ट्रांसक्रिप्शन — Minutes",
    description:
      "मीटिंग ट्रांसक्रिप्शन जो हिंदी, अंग्रेजी और हिंग्लिश में काम करता है। मिश्रित भाषा वाली सेल्स कॉल को एक ही वाक्य में कैप्चर करता है, टाइमस्टैम्प और सारांश के साथ। ओपन सोर्स।",
  },
  robots: { index: true, follow: true },
};

export default function HindiTranscriptionPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0f0f0e] text-stone-900 dark:text-stone-50 antialiased flex flex-col">
      <HindiNav />
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 pt-14 pb-24">
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 dark:text-stone-500 mb-3">
            ट्रांसक्रिप्शन
          </p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight leading-tight text-stone-950 dark:text-stone-50 mb-6">
            हिंदी, अंग्रेजी और हिंग्लिश — एक ही वाक्य में।
          </h1>
          <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed mb-10 max-w-xl">
            ज़्यादातर मीटिंग टूल अंग्रेजी-फर्स्ट हैं। मिनट्स उस तरह बनाया गया है जैसे भारतीय सेल्स टीम वास्तव में बात करती है — हिंदी, अंग्रेजी और हिंग्लिश मिलाकर। हर कॉल के बाद टाइमस्टैम्प वाला ट्रांसक्रिप्शन और सारांश पाएं। ओपन सोर्स।
          </p>

          <div className="space-y-8 mt-12">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50 mb-3">
                एक बार में एक भाषा स्विच
              </h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                आपको कॉल शुरू करने से पहले भाषा चुनने की ज़रूरत नहीं।
                हिंदी, अंग्रेजी और हिंग्लिश एक साथ कैप्चर होते हैं जब आप बोलते हैं।
              </p>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50 mb-3">
                क्लिक करने लायक टाइमस्टैम्प
              </h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                ट्रांसक्रिप्शन का हर शब्द टाइमस्टैम्प के साथ होता है। किसी पल पर क्लिक करें और ऑडियो वहां कूद जाए ताकि आप सत्यापित कर सकें कि क्या कहा गया था।
              </p>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50 mb-3">
                कॉल के बाद सारांश
              </h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                ट्रांसक्रिप्शन से फैसले, ब्लॉकर और अगले कदम निकाल दिए जाते हैं। हर जवाब स्रोत पल का हवाला देता है।
              </p>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50 mb-3">
                कोई बॉट आपकी कॉल में शामिल नहीं होता
              </h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                एक्सटेंशन आपके ब्राउज़र से टैब और माइक्रोफोन ऑडियो रिकॉर्ड करता है। आपकी गूगल मीट में कुछ भी भागीदार के रूप में नहीं दिखता।
              </p>
            </div>
          </div>

          <div className="mt-16 flex flex-col sm:flex-row gap-3">
            <a
              href="/install"
              className="px-6 py-3 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-sm font-medium rounded-md hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors text-center"
            >
              एक्सटेंशन इंस्टॉल करें
            </a>
            <Link
              href="/hindi-hinglish-transcription"
              className="px-6 py-3 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-sm font-medium rounded-md hover:border-stone-900 dark:hover:border-stone-400 transition-colors text-center"
            >
              इंग्लिश पेज पर जाएं
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
