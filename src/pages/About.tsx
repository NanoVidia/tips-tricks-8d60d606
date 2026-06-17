import { Link } from "react-router-dom";
import { BookOpen, GraduationCap, ShieldCheck, Users, ArrowLeft, Package } from "lucide-react";
import { APP_VERSION_NAME, APP_VERSION_CODE, APP_ID, APP_BUILD_DATE } from "@/lib/appVersion";

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center gap-3">
          <Link to="/" aria-label="Back to home" className="p-2 rounded-lg hover:bg-muted transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold">About — Tips &amp; Tricks OB/GYN</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-8">
        <section>
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-2">
            OB/GYN Reference
          </span>
          <h2 className="text-3xl font-bold leading-tight mb-3">
            A Specialised Academic Reference for Obstetrics &amp; Gynaecology
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            <strong>Tips &amp; Tricks – OB/GYN</strong> is a comprehensive academic reference for medical
            students, residents, and specialists in <strong>obstetrics and gynaecology</strong>. It includes
            an MCQ question bank, clinical scenarios, a surgical procedure library, emergency protocols,
            pregnancy and lactation drug references, and specialised calculators — intended solely for
            education and academic review, not as a substitute for clinical diagnosis or treatment.
          </p>
        </section>

        <section className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: BookOpen, title: "OB/GYN Reference Library", body: "Clinical scenarios, surgical procedures, protocols, and guidelines in obstetrics and gynaecology." },
            { icon: GraduationCap, title: "Exam Preparation", body: "MCQ question banks for specialty and board examinations in obstetrics and gynaecology." },
            { icon: ShieldCheck, title: "Your Privacy First", body: "No personal health data is collected. All calculator inputs are processed locally on the device." },
            { icon: Users, title: "Who Is This For?", body: "Medical students, residents, and OB/GYN specialists — an educational reference, not a clinical decision tool." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border/60 bg-card p-5">
              <Icon className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <h3 className="font-bold text-destructive mb-2">Not a Medical Device</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This application is an educational reference for obstetrics and gynaecology only. It does not
            diagnose, treat, or prevent any medical condition, and it is not a substitute for consultation
            with a qualified clinician. For any personal health concern, please consult a specialist; in
            an emergency, contact local emergency services immediately.
          </p>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">App Version</h3>
          </div>
          <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">versionName</dt>
            <dd className="font-mono font-semibold">{APP_VERSION_NAME}</dd>
            <dt className="text-muted-foreground">versionCode</dt>
            <dd className="font-mono font-semibold">{APP_VERSION_CODE}</dd>
            <dt className="text-muted-foreground">Application ID</dt>
            <dd className="font-mono text-xs break-all">{APP_ID}</dd>
            <dt className="text-muted-foreground">Build date</dt>
            <dd className="font-mono text-xs">{APP_BUILD_DATE}</dd>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Use these values to confirm that the AAB installed on the device matches the one built from GitHub Actions.
          </p>
        </section>

        <section>
          <h3 className="font-semibold mb-3">Legal Documents</h3>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link to="/terms" className="text-primary underline-offset-4 hover:underline">Terms of Use</Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/privacy" className="text-primary underline-offset-4 hover:underline">Privacy Policy</Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/disclaimer" className="text-primary underline-offset-4 hover:underline">Educational Disclaimer</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
