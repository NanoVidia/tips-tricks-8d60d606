import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground px-5 py-10 max-w-3xl mx-auto leading-relaxed">
      <Link to="/" className="text-sm text-primary underline">← Back to home</Link>
      <h1 className="text-3xl font-bold mt-4 mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-6">Last updated: May 2026</p>

      <section className="space-y-4 text-sm">
        <h2 className="text-xl font-semibold">1. Introduction</h2>
        <p>
          At <strong>Tips &amp; Tricks</strong> (an educational and informational application in the
          field of women's health and reproductive medicine) we respect your privacy. This policy
          explains how we collect, use, and protect your data.
        </p>

        <h2 className="text-xl font-semibold">2. Data We Collect</h2>
        <ul className="list-disc pr-6 space-y-1">
          <li><strong>Account data:</strong> Email address, name (optional).</li>
          <li><strong>Usage data:</strong> Pages visited, questions answered, study progress.</li>
          <li><strong>Technical data:</strong> Device type, operating system, app version (for performance improvements).</li>
          <li><strong>We do not collect</strong> any personal health data or patient information.</li>
        </ul>

        <h2 className="text-xl font-semibold">3. Medical Calculators and Inputs</h2>
        <p>
          Any values you enter in the calculators (such as last menstrual period date, weight, or
          gestational week) are processed <strong>locally on your device only</strong> and are not
          sent to or stored on our servers.
        </p>

        <h2 className="text-xl font-semibold">4. How We Use Your Data</h2>
        <ul className="list-disc pr-6 space-y-1">
          <li>To operate the application and deliver the service.</li>
          <li>To save your progress in questions and exams.</li>
          <li>To manage paid subscriptions via Google Play.</li>
          <li>To improve content and features.</li>
          <li>To send updates and notifications (can be disabled).</li>
        </ul>

        <h2 className="text-xl font-semibold">5. Data Sharing</h2>
        <p>
          <strong>We never sell your data.</strong> We share it only with:
        </p>
        <ul className="list-disc pr-6 space-y-1">
          <li><strong>Supabase / Lovable Cloud:</strong> For database hosting.</li>
          <li><strong>Google Play Billing:</strong> For subscription processing.</li>
          <li><strong>RevenueCat:</strong> For subscription status verification.</li>
          <li><strong>Government authorities:</strong> Only when required by a formal legal request.</li>
        </ul>

        <h2 className="text-xl font-semibold">6. Cookies &amp; Local Storage</h2>
        <p>
          We use local storage (LocalStorage) to save your preferences (language, dark mode, progress).
          We do not use third-party tracking cookies.
        </p>

        <h2 className="text-xl font-semibold">7. Security</h2>
        <p>
          We use encryption (HTTPS / TLS) for all communications and RLS policies to protect the
          database. However, absolute security on the internet cannot be guaranteed.
        </p>

        <h2 className="text-xl font-semibold">8. Your Rights</h2>
        <ul className="list-disc pr-6 space-y-1">
          <li>Request a copy of your data.</li>
          <li>Correct or delete your data.</li>
          <li>Delete your account at any time.</li>
          <li>Withdraw consent for data processing.</li>
        </ul>
        <p>
          To exercise these rights:{" "}
          <a href="mailto:privacy@tips-tricks.app" className="text-primary underline">privacy@tips-tricks.app</a>
        </p>

        <h2 className="text-xl font-semibold">9. Children</h2>
        <p>
          This application is not directed at children under 18 years of age, and we do not
          knowingly collect their data.
        </p>

        <h2 className="text-xl font-semibold">10. Updates</h2>
        <p>
          We may update this policy. You will be notified of any material change within the
          application before it takes effect.
        </p>

        <h2 className="text-xl font-semibold">11. Contact</h2>
        <p>
          Email: <a href="mailto:privacy@tips-tricks.app" className="text-primary underline">privacy@tips-tricks.app</a><br />
          Location: Sultanate of Oman
        </p>
      </section>
    </main>
  );
}
