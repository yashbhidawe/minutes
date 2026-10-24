import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { HindiNav } from "@/components/landing/HindiNav";
import { SiteFooter } from "@/components/landing/sections";

export const metadata: Metadata = {
  title: "भारतीय सेल्स टीम के लिए मीटिंग नोट्स — Minutes",
  description:
    "मिनट्स भारतीय सेल्स टीम के लिए मीटिंग नोट्स है। यह हिंदी, अंग्रेजी और हिंग्लिश सेल्स कॉल को एक ही वाक्य में कैप्चर करता है, फिर टाइमस्टैम्प, सारांश और एक्शन आइटम देता है। ओपन सोर्स।",
  alternates: { canonical: "/hi/sales-teams" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/hi/sales-teams`,
    title: "भारतीय सेल्स टीम के लिए मीटिंग नोट्स — Minutes",
    description:
      "मिनट्स भारतीय सेल्स टीम के लिए मीटिंग नोट्स है। यह हिंदी, अंग्रेजी और हिंग्लिश सेल्स कॉल को एक ही वाक्य में कैप्चर करता है, फिर टाइमस्टैम्प, सारांश और एक्शन आइटम देता है। ओपन सोर्स।",
  },
  twitter: {
    card: "summary_large_image",
    title: "भारतीय सेल्स टीम के लिए मीटिंग नोट्स — Minutes",
    description:
      "मिनट्स भारतीय सेल्स टीम के लिए मीटिंग नोट्स है। यह हिंदी, अंग्रेजी और हिंग्लिश सेल्स कॉल को एक ही वाक्य में कैप्चर करता है, फिर टाइमस्टैम्प, सारांश और एक्शन आइटम देता है। ओपन सोर्स।",
  },
  robots: { index: true, follow: true },
};

export default function HindiSalesTeamsPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0f0f0e] text-stone-900 dark:text-stone-50 antialiased flex flex-col">
      <HindiNav />
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 pt-14 pb-24">
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 dark:text-stone-500 mb-3">
            सेल्स टीम
          </p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight leading-tight text-stone-950 dark:text-stone-50 mb-6">
            भारतीय सेल्स कॉल के लिए मीटिंग नोट्स।
          </h1>
          <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed mb-10 max-w-xl">
            आपकी क्लाइंट कॉल हिंदी, अंग्रेजी और हिंग्लिश में होती हैं — अक्सर एक ही वाक्य में।
            मिनट्स कॉल को रिकॉर्ड करता है, फिर फॉलो-अप के लिए टाइमस्टैम्प,
            सारांश और एक्शन आइटम देता है। कोई बॉट कॉल में शामिल नहीं होता। ओपन सोर्स।
          </p>

          <div className="space-y-8 mt-12">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50 mb-3">
                मिश्रित भाषा वाली कॉल
              </h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                हिंदी, अंग्रेजी और हिंग्लिश एक साथ कैप्चर होते हैं। कॉल शुरू करने से पहले भाषा चुनने की ज़रूरत नहीं।
              </p>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50 mb-3">
                टाइमस्टैम्प और सारांश
              </h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                हर पल टाइमस्टैम्प के साथ होता है। सारांश में फैसले, ब्लॉकर और अगले कदम आते हैं।
              </p>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50 mb-3">
                फॉलो-अप के लिए एक्शन आइटम
              </h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                एक्शन आइटम को अपने फॉलो-अप मैसेज में कॉपी करें। हर जवाब ट्रांसक्रिप्शन का हवाला देता है, ताकि आप साइटेशन पर क्लिक करके सटीक पल पर वापस जा सकें।
              </p>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50 mb-3">
                कोई बॉट नहीं, कोई एडमिन सेटअप नहीं
              </h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                एक्सटेंशन आपके ब्राउज़र से रिकॉर्ड करता है। आपकी गूगल मीट में कोई भागीदार नहीं जुड़ता। इंस्टॉल करें और रिकॉर्डिंग शुरू करें।
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
              href="/sales-teams"
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
