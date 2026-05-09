import { Link } from "react-router-dom";
import { BookOpen, GraduationCap, ShieldCheck, Users, ArrowLeft } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center gap-3">
          <Link to="/" aria-label="Back to home" className="p-2 rounded-lg hover:bg-muted transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold">About — Tips & Tricks</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-8">
        <section>
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-2">
            Educational Platform
          </span>
          <h2 className="text-3xl font-bold leading-tight mb-3">
            An academic reference for women's-health learners
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            An educational quiz and reference app for academic study and exam preparation. Includes daily questions, study notes and reference summaries for educational purposes only — not for diagnosis or treatment.
          </p>
        </section>

        <section className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: BookOpen, title: "Reference Library", body: "Curated educational scenarios, study notes and quick-reference summaries." },
            { icon: GraduationCap, title: "Exam Preparation", body: "MCQ banks and study modes for academic preparation." },
            { icon: ShieldCheck, title: "Privacy First", body: "No personal health data is collected. Inputs are processed locally on your device." },
            { icon: Users, title: "For Learners", body: "Built for students and people interested in women's-health education — not a clinical tool." },
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
            This application does not diagnose, treat, cure or prevent any disease or
            condition. It does not replace professional medical advice. For any personal
            health concern please consult a qualified healthcare professional. In an
            emergency, contact your local emergency services immediately.
          </p>
        </section>

        <section>
          <h3 className="font-semibold mb-3">Legal</h3>
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
