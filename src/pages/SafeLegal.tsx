import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Non-clinical Terms & Disclaimer page for Safe Mode.
 * Pure educational/entertainment language — no medical claims.
 */
export default function SafeLegal({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="font-bold text-[16px] truncate">Terms &amp; Disclaimer</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-8 pb-24 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Terms of Use</h2>
          <p className="text-sm text-muted-foreground">Last updated: May 2026</p>
          <p className="text-sm">
            <strong>Tips &amp; Tricks</strong> is a general-knowledge and professional-tips
            entertainment app. By using the app you agree to use it for personal,
            non-commercial educational entertainment only.
          </p>
          <ul className="list-disc pr-6 ps-6 space-y-1 text-sm">
            <li>You must be 18 years or older to use the app.</li>
            <li>Content (questions, tips, text) is provided “as is” without warranty.</li>
            <li>Do not copy, resell, or redistribute the content without permission.</li>
            <li>We may update or change the content and features at any time.</li>
            <li>Misuse of the app may result in access being revoked.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">Disclaimer</h2>
          <div className="rounded-xl border border-amber-300/40 bg-amber-50/60 dark:bg-amber-950/20 p-3 text-[13px] text-amber-900 dark:text-amber-200">
            This app is for <strong>general knowledge and entertainment only</strong>.
            It is <strong>not</strong> medical, legal, or professional advice and is not
            intended to diagnose, treat, or guide any health decision.
          </div>
          <ul className="list-disc pr-6 ps-6 space-y-1 text-sm">
            <li>Questions cover history, language, communication and career topics.</li>
            <li>Always consult a qualified professional for personal decisions.</li>
            <li>The authors are not liable for any action taken based on this content.</li>
            <li>In emergencies, contact your local emergency services immediately.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">Privacy</h2>
          <p className="text-sm">
            The app does not collect personal health data. Quiz progress is stored
            locally on your device and can be reset at any time.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">Contact</h2>
          <p className="text-sm">
            Questions or feedback?{" "}
            <a href="mailto:support@tips-tricks.app" className="text-primary underline">
              support@tips-tricks.app
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
