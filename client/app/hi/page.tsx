import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DESCRIPTION } from "@/lib/site";
import { SiteFooter } from "@/components/landing/sections";

export const metadata: Metadata = {
  title: "सेल्स कॉल नोट्स हिंदी, अंग्रेजी और हिंग्लिश में — Minutes",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/hi/" },
};

export default function HindiHomePage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0f0f0e] text-stone-900 dark:text-stone-50 antialiased overflow-x-clip">
      <main className="max-w-4xl mx-auto px-6 pt-14 pb-24">
        <section className="mb-16">
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 dark:text-stone-500 mb-3">
            सेल्स कॉल नोट्स
          </p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight leading-tight text-stone-950 dark:text-stone-50 mb-6">
            बिक्री कॉल नोट्स — हिंदी, अंग्रेजी और हिंग्लिश में
          </h1>
          <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed max-w-xl">
            मिनट्स भारतीय सेल्स टीम के लिए मीटिंग नोट्स है। यह आपकी
            कॉल को हिंदी, अंग्रेजी और हिंग्लिश — एक ही वाक्य में मिलाकर —
            रिकॉर्ड करता है और कॉल के बाद टाइमस्टैम्प, सारांश और एक्शन आइटम देता है। ओपन सोर्स।
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <a
              href="/install"
              className="px-6 py-3 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-sm font-medium rounded-md hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors text-center"
            >
              एक्सटेंशन इंस्टॉल करें
            </a>
            <Link
              href="/"
              className="px-6 py-3 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-sm font-medium rounded-md hover:border-stone-900 dark:hover:border-stone-400 transition-colors text-center"
            >
              इंग्लिश में देखें
            </Link>
          </div>
        </section>

        <section className="space-y-8 mb-16">
          <h2 className="text-2xl font-light tracking-tight text-stone-950 dark:text-stone-50 mb-4">
            क्यों मिनट्स?
          </h2>
          <div className="space-y-4">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-stone-950 dark:text-stone-50 mb-2">
                मिश्रित भाषा वाली कॉल
              </h3>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                हिंदी, अंग्रेजी और हिंग्लिश एक साथ कैप्चर होते हैं। कॉल शुरू करने से पहले भाषा चुनने की ज़रूरत नहीं।
              </p>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-stone-950 dark:text-stone-50 mb-2">
                टाइमस्टैम्प और सारांश
              </h3>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                हर पल टाइमस्टैम्प के साथ होता है। सारांश में फैसले, ब्लॉकर और अगले कदम आते हैं।
              </p>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-stone-950 dark:text-stone-50 mb-2">
                कोई बॉट नहीं, कोई एडमिन सेटअप नहीं
              </h3>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                एक्सटेंशन आपके ब्राउज़र से रिकॉर्ड करता है। आपकी गूगल मीट में कोई भागीदार नहीं जुड़ता।
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
