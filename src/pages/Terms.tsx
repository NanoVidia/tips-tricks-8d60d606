import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground px-5 py-10 max-w-3xl mx-auto leading-relaxed">
      <Link to="/" className="text-sm text-primary underline">← العودة للرئيسية</Link>
      <h1 className="text-3xl font-bold mt-4 mb-2">شروط الاستخدام (Terms of Use)</h1>
      <p className="text-sm text-muted-foreground mb-6">آخر تحديث: مايو 2026</p>

      <section className="space-y-4 text-sm">
        <h2 className="text-xl font-semibold">1. طبيعة التطبيق</h2>
        <p>
          تطبيق <strong>Tips &amp; Tricks</strong> هو منصة <strong>تعليمية وإرشادية</strong> موجهة للمهتمين بمجال
          صحة المرأة والحمل والولادة والخصوبة (طلاب طب، ممارسين، مهتمين بالصحة العامة). التطبيق
          <strong> ليس جهازاً طبياً</strong>، ولا يقدم تشخيصاً أو علاجاً، ولا يحل محل استشارة الطبيب المختص.
        </p>

        <h2 className="text-xl font-semibold">2. قبول الشروط</h2>
        <p>
          باستخدامك للتطبيق فإنك توافق على هذه الشروط بالكامل. إذا لم توافق، يرجى عدم استخدام التطبيق.
          يحق لنا تعديل الشروط في أي وقت، وسيتم إعلامك بالتحديثات داخل التطبيق.
        </p>

        <h2 className="text-xl font-semibold">3. الحساب والاشتراك</h2>
        <ul className="list-disc pr-6 space-y-1">
          <li>يجب أن يكون عمرك 18 عاماً أو أكثر لاستخدام التطبيق.</li>
          <li>أنت مسؤول عن سرية بيانات الدخول الخاصة بك.</li>
          <li>الاشتراكات المدفوعة تتم عبر Google Play وتخضع لسياساتها (الاسترجاع خلال 48 ساعة).</li>
          <li>يحق لنا إيقاف أي حساب يخالف الشروط دون إشعار مسبق.</li>
        </ul>

        <h2 className="text-xl font-semibold">4. الاستخدام المسموح</h2>
        <ul className="list-disc pr-6 space-y-1">
          <li>الاستخدام الشخصي التعليمي فقط.</li>
          <li>يُمنع نسخ المحتوى أو إعادة بيعه أو توزيعه تجارياً.</li>
          <li>يُمنع استخدام التطبيق لأي غرض غير قانوني أو ضار.</li>
        </ul>

        <h2 className="text-xl font-semibold">5. الملكية الفكرية</h2>
        <p>
          جميع المحتويات (نصوص، حاسبات، أسئلة، تصاميم) محمية بحقوق الملكية الفكرية ومملوكة للتطبيق
          أو مُرخّصة له. لا يجوز إعادة استخدامها دون إذن خطي.
        </p>

        <h2 className="text-xl font-semibold">6. إخلاء المسؤولية</h2>
        <p>
          المعلومات المعروضة لأغراض إرشادية وتعليمية عامة فقط. لا نضمن دقتها الكاملة أو ملاءمتها
          لحالة فردية معينة. القرار الطبي النهائي يجب أن يكون دائماً من طبيب مختص. راجع صفحة{" "}
          <Link to="/disclaimer" className="text-primary underline">إخلاء المسؤولية</Link>.
        </p>

        <h2 className="text-xl font-semibold">7. حدود المسؤولية</h2>
        <p>
          لا يتحمل التطبيق أو مطوّروه أي مسؤولية عن أي ضرر مباشر أو غير مباشر ناتج عن استخدام
          المعلومات المقدمة، بما في ذلك أي قرار طبي يُتخذ بناءً عليها.
        </p>

        <h2 className="text-xl font-semibold">8. القانون الحاكم</h2>
        <p>
          تخضع هذه الشروط لقوانين سلطنة عُمان. أي نزاع يُحل ودياً، وإلا يُحال للجهات المختصة في عُمان.
        </p>

        <h2 className="text-xl font-semibold">9. التواصل</h2>
        <p>
          لأي استفسار: <a href="mailto:support@tips-tricks.app" className="text-primary underline">support@tips-tricks.app</a>
        </p>
      </section>
    </main>
  );
}
