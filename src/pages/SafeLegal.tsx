import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

/**
 * Non-clinical info & legal hub for Safe Mode.
 * Sections: About, FAQ, Credits, Changelog, Storage Notice, Terms, Disclaimer, Privacy.
 */
export default function SafeLegal({
  onBack,
  initialSection,
}: {
  onBack: () => void;
  initialSection?: string;
}) {
  useEffect(() => {
    if (!initialSection) return;
    const el = document.getElementById(initialSection);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [initialSection]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="font-bold text-[16px] truncate">Info &amp; Legal</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-10 pb-24 leading-relaxed">
        {/* About */}
        <section id="about" className="space-y-3 scroll-mt-20">
          <h2 className="text-xl font-bold">About</h2>
          <p className="text-sm">
            <strong>Tips &amp; Tricks</strong> is a light general-knowledge quiz app
            built for curious minds. Each round mixes history, language, communication
            and career topics into bite-sized questions you can answer in under a minute.
          </p>
          <p className="text-sm">
            Our goal: make daily learning feel like a small, enjoyable habit — clean
            interface, no ads in your face, and no account required.
          </p>
        </section>

        {/* FAQ */}
        <section id="faq" className="space-y-3 scroll-mt-20">
          <h2 className="text-xl font-bold">FAQ</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">How do I play?</p>
              <p className="text-muted-foreground">
                Pick an answer, read the explanation, then tap Next. Use Shuffle to
                randomize the order.
              </p>
            </div>
            <div>
              <p className="font-semibold">Is my progress saved?</p>
              <p className="text-muted-foreground">
                Yes — locally on your device. Nothing is uploaded. Reset score anytime.
              </p>
            </div>
            <div>
              <p className="font-semibold">Do I need an account?</p>
              <p className="text-muted-foreground">No. The app works fully offline.</p>
            </div>
            <div>
              <p className="font-semibold">Are the questions professional advice?</p>
              <p className="text-muted-foreground">
                No. All content is general-knowledge entertainment only.
              </p>
            </div>
            <div>
              <p className="font-semibold">How can I suggest a question?</p>
              <p className="text-muted-foreground">
                Email us at{" "}
                <a href="mailto:Dr.sahar.ask@gmail.com" className="text-primary underline">
                  Dr.sahar.ask@gmail.com
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Credits & Sources */}
        <section id="credits" className="space-y-3 scroll-mt-20">
          <h2 className="text-xl font-bold">Credits &amp; Sources</h2>
          <p className="text-sm">
            Questions are drawn from publicly available educational and historical
            references, including:
          </p>
          <ul className="list-disc pr-6 ps-6 space-y-1 text-sm">
            <li>Wikipedia (CC BY-SA) — historical and biographical facts.</li>
            <li>Merriam-Webster &amp; Oxford dictionaries — word origins.</li>
            <li>Public-domain books on communication and professional ethics.</li>
            <li>Open educational resources (OER) for general knowledge.</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Icons by Lucide. Fonts via system defaults. No third-party trackers.
          </p>
        </section>

        {/* Changelog */}
        <section id="changelog" className="space-y-3 scroll-mt-20">
          <h2 className="text-xl font-bold">Changelog</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <p className="font-semibold">v1.1.0 — May 12, 2026</p>
              <p className="text-muted-foreground">
                Restore Purchases button, clearer disclaimer banner,
                refined logo &amp; gradient, public Privacy/Terms links,
                and Android 14+ store-compliance polish.
              </p>
            </li>
            <li>
              <p className="font-semibold">v1.0.1 — May 2026</p>
              <p className="text-muted-foreground">
                Added Info &amp; Legal hub, FAQ, storage notice, Shuffle
                and Reset-Score controls.
              </p>
            </li>
            <li>
              <p className="font-semibold">v1.0.0 — May 2026</p>
              <p className="text-muted-foreground">
                Initial release — 100 general-knowledge questions.
              </p>
            </li>
          </ul>
        </section>

        {/* Storage Notice */}
        <section id="storage" className="space-y-3 scroll-mt-20">
          <h2 className="text-xl font-bold">Local Storage Notice</h2>
          <p className="text-sm">
            This app stores a small amount of data on your device only:
          </p>
          <ul className="list-disc pr-6 ps-6 space-y-1 text-sm">
            <li>Your current question index and score.</li>
            <li>Your accessibility preferences (motion, text size).</li>
          </ul>
          <p className="text-sm">
            No cookies are set, no analytics are sent, and no personal data leaves
            your device. You can clear all data anytime by clearing the app storage
            from your system settings.
          </p>
        </section>

        {/* Terms */}
        <section id="terms" className="space-y-3 scroll-mt-20">
          <h2 className="text-xl font-bold">Terms of Use</h2>
          <p className="text-sm text-muted-foreground">Last updated: May 2026</p>
          <p className="text-sm">
            By using <strong>Tips &amp; Tricks</strong> you agree to use it for
            personal, non-commercial educational purposes only.
          </p>
          <ul className="list-disc pr-6 ps-6 space-y-1 text-sm">
            <li>You must be 18 years or older.</li>
            <li>Content is provided “as is” without warranty.</li>
            <li>Do not copy, resell, or redistribute the content.</li>
            <li>We may update content and features at any time.</li>
          </ul>
          <a
            href="/terms.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-[13px] font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            Open full Terms &amp; Disclaimer ↗
          </a>
        </section>

        {/* Disclaimer */}
        <section id="disclaimer" className="space-y-3 scroll-mt-20">
          <h2 className="text-xl font-bold">Disclaimer</h2>
          <div className="rounded-xl border border-amber-300/40 bg-amber-50/60 dark:bg-amber-950/20 p-3 text-[13px] text-amber-900 dark:text-amber-200">
            This app is for <strong>educational and exam-preparation
            purposes only</strong>. It does <strong>not</strong> provide
            diagnosis, treatment recommendations, or drug dosages.
          </div>
          <ul className="list-disc pr-6 ps-6 space-y-1 text-sm">
            <li>Always rely on official guidelines and your own clinical judgement.</li>
            <li>The authors are not liable for actions taken based on this content.</li>
            <li>For urgent matters, follow your institution's protocols.</li>
          </ul>
          <a
            href="/terms.html#disclaimer"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-primary underline"
          >
            Read full disclaimer ↗
          </a>
        </section>

        {/* Privacy */}
        <section id="privacy" className="space-y-3 scroll-mt-20">
          <h2 className="text-xl font-bold">Privacy</h2>
          <p className="text-sm">
            We do not collect personal data. Quiz progress is stored locally on your
            device and can be reset at any time.
          </p>
          <a
            href="/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-[13px] font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            Open full Privacy Policy ↗
          </a>
        </section>

        {/* Contact */}
        <section id="contact" className="space-y-3 scroll-mt-20">
          <h2 className="text-xl font-bold">Contact</h2>
          <p className="text-sm">
            Questions or feedback?{" "}
            <a href="mailto:Dr.sahar.ask@gmail.com" className="text-primary underline">
              Dr.sahar.ask@gmail.com
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
