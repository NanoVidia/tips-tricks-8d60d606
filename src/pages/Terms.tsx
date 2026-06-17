import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground px-5 py-10 max-w-3xl mx-auto leading-relaxed">
      <Link to="/" className="text-sm text-primary underline">← Back to home</Link>
      <h1 className="text-3xl font-bold mt-4 mb-2">Terms of Use</h1>
      <p className="text-sm text-muted-foreground mb-6">Last updated: May 2026</p>

      <section className="space-y-4 text-sm">
        <h2 className="text-xl font-semibold">1. Nature of the Application</h2>
        <p>
          <strong>Tips &amp; Tricks</strong> is an <strong>educational and informational platform</strong>{" "}
          for those interested in women's health, pregnancy, obstetrics, and reproductive medicine
          (medical students, practitioners, and health-conscious individuals). The application is{" "}
          <strong>not a medical device</strong>, does not provide diagnosis or treatment, and does
          not replace consultation with a qualified clinician.
        </p>

        <h2 className="text-xl font-semibold">2. Acceptance of Terms</h2>
        <p>
          By using the application you agree to these terms in full. If you do not agree, please
          discontinue use. We reserve the right to modify these terms at any time; you will be
          notified of updates within the application.
        </p>

        <h2 className="text-xl font-semibold">3. Account and Subscription</h2>
        <ul className="list-disc pr-6 space-y-1">
          <li>You must be at least 18 years of age to use the application.</li>
          <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
          <li>Paid subscriptions are processed through Google Play and are subject to its policies (refunds within 48 hours).</li>
          <li>We reserve the right to suspend any account that violates these terms without prior notice.</li>
        </ul>

        <h2 className="text-xl font-semibold">4. Permitted Use</h2>
        <ul className="list-disc pr-6 space-y-1">
          <li>Personal educational use only.</li>
          <li>Copying, reselling, or commercially distributing content is prohibited.</li>
          <li>Using the application for any unlawful or harmful purpose is prohibited.</li>
        </ul>

        <h2 className="text-xl font-semibold">5. Intellectual Property</h2>
        <p>
          All content (texts, calculators, questions, designs) is protected by intellectual property
          rights and is owned by or licensed to the application. Reuse without written permission
          is not permitted.
        </p>

        <h2 className="text-xl font-semibold">6. Disclaimer</h2>
        <p>
          Information presented is for general guidance and educational purposes only. We do not
          guarantee its complete accuracy or suitability for any individual case. The final clinical
          decision must always rest with a qualified clinician. See the{" "}
          <Link to="/disclaimer" className="text-primary underline">Educational Disclaimer</Link> page.
        </p>

        <h2 className="text-xl font-semibold">7. Limitation of Liability</h2>
        <p>
          The application and its developers accept no liability for any direct or indirect harm
          resulting from the use of the information provided, including any clinical decision made
          on the basis of that information.
        </p>

        <h2 className="text-xl font-semibold">8. Governing Law</h2>
        <p>
          These terms are governed by the laws of the Sultanate of Oman. Any dispute shall be
          resolved amicably; failing that, it shall be referred to the competent authorities in Oman.
        </p>

        <h2 className="text-xl font-semibold">9. Contact</h2>
        <p>
          For enquiries:{" "}
          <a href="mailto:Dr.sahar.ask@gmail.com" className="text-primary underline">Dr.sahar.ask@gmail.com</a>
        </p>
      </section>
    </main>
  );
}
