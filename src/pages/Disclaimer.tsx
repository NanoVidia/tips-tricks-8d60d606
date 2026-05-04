import { Link } from "react-router-dom";

export default function Disclaimer() {
  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground px-5 py-10 max-w-3xl mx-auto leading-relaxed">
      <Link to="/" className="text-sm text-primary underline">← العودة للرئيسية</Link>
      <h1 className="text-3xl font-bold mt-4 mb-2">إخلاء المسؤولية (Disclaimer)</h1>
      <p className="text-sm text-muted-foreground mb-6">آخر تحديث: مايو 2026</p>

      <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6 text-sm">
        ⚠️ <strong>تنبيه مهم:</strong> هذا التطبيق <strong>تعليمي وإرشادي فقط</strong> ولا يقدم
        تشخيصاً أو علاجاً طبياً. لا تستخدمه بديلاً عن استشارة الطبيب.
      </div>

      <section className="space-y-4 text-sm">
        <h2 className="text-xl font-semibold">1. الغرض من التطبيق</h2>
        <p>
          <strong>Tips &amp; Tricks</strong> أداة تعليمية وإرشادية مصممة لمساعدة المهتمين بمجال
          صحة المرأة والحمل والولادة والخصوبة على فهم المفاهيم العامة، والمراجعة الذاتية،
          والتحضير للاختبارات الأكاديمية مثل Prometric وMRCOG.
        </p>

        <h2 className="text-xl font-semibold">2. ليس استشارة طبية</h2>
        <p>
          المعلومات والحاسبات والأسئلة المعروضة في التطبيق:
        </p>
        <ul className="list-disc pr-6 space-y-1">
          <li>لا تُعتبر استشارة طبية أو رأياً تشخيصياً.</li>
          <li>لا تحل محل الفحص السريري أو التحاليل المخبرية.</li>
          <li>لا يجب الاعتماد عليها لاتخاذ قرارات علاجية.</li>
          <li>قد تحتوي على أخطاء أو معلومات غير محدّثة.</li>
        </ul>

        <h2 className="text-xl font-semibold">3. الحاسبات الإرشادية</h2>
        <p>
          الحاسبات (مثل تاريخ الولادة المتوقع EDD، عمر الحمل، مؤشر BMI، نافذة الإباضة)
          تُقدم نتائج <strong>تقريبية</strong> بناءً على معادلات شائعة، وقد تختلف عن النتائج
          السريرية الفعلية. <strong>دائماً راجع طبيبك</strong> للحصول على تقييم دقيق.
        </p>

        <h2 className="text-xl font-semibold">4. الأسئلة والسيناريوهات</h2>
        <p>
          أسئلة الاختبارات والسيناريوهات السريرية مأخوذة من مصادر تعليمية عامة وأبحاث منشورة،
          وهي مخصصة <strong>للتدريب الأكاديمي فقط</strong>، وليست بديلاً عن المناهج الرسمية
          أو الكتب المرجعية المعتمدة.
        </p>

        <h2 className="text-xl font-semibold">5. مساعد الذكاء الاصطناعي (AI Mentor)</h2>
        <p>
          الردود التي يقدمها مساعد الذكاء الاصطناعي تُولَّد آلياً وقد تحتوي على أخطاء أو
          معلومات غير دقيقة. <strong>لا تستخدمها لاتخاذ قرارات طبية</strong>، واعتمد على
          المصادر الموثوقة والاستشارة المتخصصة دائماً.
        </p>

        <h2 className="text-xl font-semibold">6. حالات الطوارئ</h2>
        <p>
          إذا كنتِ تعانين من نزيف، ألم شديد، انخفاض حركة الجنين، أو أي عرض طارئ:
          <strong> توجهي فوراً إلى أقرب مستشفى أو اتصلي بالطوارئ</strong>. لا تستخدمي هذا
          التطبيق في حالات الطوارئ.
        </p>

        <h2 className="text-xl font-semibold">7. حدود المسؤولية</h2>
        <p>
          المطوّرون وفريق العمل والمساهمون في التطبيق <strong>غير مسؤولين</strong> عن أي ضرر
          مباشر أو غير مباشر، صحي أو مادي، ينتج عن:
        </p>
        <ul className="list-disc pr-6 space-y-1">
          <li>استخدام أو سوء استخدام المعلومات المعروضة.</li>
          <li>أي قرار طبي أو شخصي يُتخذ بناءً على محتوى التطبيق.</li>
          <li>أي خطأ أو نقص في المحتوى.</li>
        </ul>

        <h2 className="text-xl font-semibold">8. الفئة المستهدفة</h2>
        <p>
          التطبيق موجه للبالغين (18+) من المهتمين بالمعرفة الصحية، طلاب وطالبات الكليات الصحية،
          والممارسين الذين يستخدمونه <strong>كأداة مراجعة شخصية</strong> فقط.
        </p>

        <h2 className="text-xl font-semibold">9. اللغة الطبية</h2>
        <p>
          قد يحتوي التطبيق على مصطلحات طبية متقدمة. إذا كنت غير متخصص، فالمحتوى قد يكون
          صعب الفهم وقد يُساء تفسيره. <strong>استشر مختصاً</strong> لتفسير أي معلومة.
        </p>

        <h2 className="text-xl font-semibold">10. الموافقة</h2>
        <p>
          باستخدامك للتطبيق فإنك تُقر بأنك قرأت وفهمت هذا الإخلاء وتوافق عليه بالكامل.
        </p>

        <p className="text-xs text-muted-foreground mt-6">
          اطّلع أيضاً على{" "}
          <Link to="/terms" className="text-primary underline">شروط الاستخدام</Link> و{" "}
          <Link to="/privacy" className="text-primary underline">سياسة الخصوصية</Link>.
        </p>
      </section>
    </main>
  );
}
