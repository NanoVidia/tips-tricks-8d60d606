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
          <h1 className="text-lg font-bold">حول التطبيق — Tips & Tricks OB/GYN</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-8">
        <section dir="rtl">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-2">
            مرجع طب النساء والولادة • OB/GYN Reference
          </span>
          <h2 className="text-3xl font-bold leading-tight mb-3">
            مرجع تعليمي متخصص في طب النساء والولادة
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            تطبيق <strong>Tips & Tricks – OB/GYN</strong> هو مرجع أكاديمي متكامل لطلاب الطب والأطباء المقيمين والاختصاصيين في
            <strong> طب النساء والتوليد</strong>. يضم بنك أسئلة (MCQs)، سيناريوهات سريرية، مكتبة عمليات جراحية،
            بروتوكولات الطوارئ، أدوية الحمل والإرضاع، وأدوات حسابية متخصصة — لأغراض التعليم والمراجعة الأكاديمية فقط،
            وليس بديلاً عن التشخيص أو العلاج الطبي.
          </p>
        </section>

        <section className="grid sm:grid-cols-2 gap-4" dir="rtl">
          {[
            { icon: BookOpen, title: "مكتبة OB/GYN المرجعية", body: "سيناريوهات سريرية، عمليات جراحية، بروتوكولات وإرشادات في طب النساء والتوليد." },
            { icon: GraduationCap, title: "تحضير الامتحانات", body: "بنوك أسئلة MCQs لامتحانات الاختصاص والبورد في النساء والولادة." },
            { icon: ShieldCheck, title: "خصوصيتك أولاً", body: "لا نجمع أي بيانات صحية شخصية. كل المدخلات تُعالَج محلياً على جهازك." },
            { icon: Users, title: "لمن هذا التطبيق؟", body: "طلاب الطب، الأطباء المقيمون، اختصاصيو النساء والولادة — مرجع تعليمي وليس أداة سريرية." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border/60 bg-card p-5">
              <Icon className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5" dir="rtl">
          <h3 className="font-bold text-destructive mb-2">ليس جهازاً طبياً</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            هذا التطبيق مرجع تعليمي في طب النساء والولادة فقط، ولا يقوم بتشخيص أو علاج أو الوقاية من أي مرض،
            ولا يُغني عن استشارة طبيب مختص. لأي مشكلة صحية شخصية يُرجى مراجعة طبيب النساء والولادة المعالج،
            وفي حالات الطوارئ اتصل بخدمات الطوارئ المحلية فوراً.
          </p>
        </section>

        <section dir="rtl">
          <h3 className="font-semibold mb-3">المستندات القانونية</h3>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link to="/terms" className="text-primary underline-offset-4 hover:underline">شروط الاستخدام</Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/privacy" className="text-primary underline-offset-4 hover:underline">سياسة الخصوصية</Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/disclaimer" className="text-primary underline-offset-4 hover:underline">إخلاء المسؤولية التعليمي</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
