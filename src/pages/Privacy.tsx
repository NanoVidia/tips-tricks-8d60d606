import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground px-5 py-10 max-w-3xl mx-auto leading-relaxed">
      <Link to="/" className="text-sm text-primary underline">← العودة للرئيسية</Link>
      <h1 className="text-3xl font-bold mt-4 mb-2">سياسة الخصوصية (Privacy Policy)</h1>
      <p className="text-sm text-muted-foreground mb-6">آخر تحديث: مايو 2026</p>

      <section className="space-y-4 text-sm">
        <h2 className="text-xl font-semibold">1. مقدمة</h2>
        <p>
          نحن في تطبيق <strong>Tips &amp; Tricks</strong> (تطبيق تعليمي وإرشادي في مجال صحة المرأة والخصوبة)
          نحترم خصوصيتك. توضح هذه السياسة كيف نجمع ونستخدم ونحمي بياناتك.
        </p>

        <h2 className="text-xl font-semibold">2. البيانات التي نجمعها</h2>
        <ul className="list-disc pr-6 space-y-1">
          <li><strong>بيانات الحساب:</strong> البريد الإلكتروني، الاسم (اختياري).</li>
          <li><strong>بيانات الاستخدام:</strong> الصفحات التي تزورها، الأسئلة التي تحلها، تقدمك التعليمي.</li>
          <li><strong>بيانات تقنية:</strong> نوع الجهاز، نظام التشغيل، إصدار التطبيق (لتحسين الأداء).</li>
          <li><strong>لا نجمع</strong> أي بيانات صحية شخصية أو معلومات مرضى.</li>
        </ul>

        <h2 className="text-xl font-semibold">3. الحاسبات الطبية والإدخالات</h2>
        <p>
          أي قيم تُدخلها في الحاسبات (مثل تاريخ آخر دورة، الوزن، أسبوع الحمل) تُعالج
          <strong> محلياً على جهازك فقط</strong> ولا تُرسل أو تُخزّن على خوادمنا.
        </p>

        <h2 className="text-xl font-semibold">4. كيف نستخدم بياناتك</h2>
        <ul className="list-disc pr-6 space-y-1">
          <li>تشغيل التطبيق وتقديم الخدمة.</li>
          <li>حفظ تقدمك في الأسئلة والاختبارات.</li>
          <li>إدارة الاشتراك المدفوع عبر Google Play.</li>
          <li>تحسين المحتوى والميزات.</li>
          <li>إرسال تحديثات وإشعارات (يمكن إيقافها).</li>
        </ul>

        <h2 className="text-xl font-semibold">5. مشاركة البيانات</h2>
        <p>
          <strong>لا نبيع بياناتك أبداً</strong>. نشاركها فقط مع:
        </p>
        <ul className="list-disc pr-6 space-y-1">
          <li><strong>Supabase / Lovable Cloud:</strong> لاستضافة قاعدة البيانات.</li>
          <li><strong>Google Play Billing:</strong> لمعالجة الاشتراكات.</li>
          <li><strong>RevenueCat:</strong> للتحقق من حالة الاشتراك.</li>
          <li><strong>الجهات الحكومية:</strong> فقط عند طلب قانوني رسمي.</li>
        </ul>

        <h2 className="text-xl font-semibold">6. ملفات تعريف الارتباط (Cookies)</h2>
        <p>
          نستخدم تخزيناً محلياً (LocalStorage) لحفظ تفضيلاتك (اللغة، الوضع الليلي، التقدم).
          لا نستخدم cookies تتبّعية لأطراف ثالثة.
        </p>

        <h2 className="text-xl font-semibold">7. الأمان</h2>
        <p>
          نستخدم تشفيراً (HTTPS / TLS) في جميع الاتصالات، وسياسات RLS لحماية قاعدة البيانات.
          ومع ذلك، لا يمكن ضمان أمان مطلق على الإنترنت.
        </p>

        <h2 className="text-xl font-semibold">8. حقوقك</h2>
        <ul className="list-disc pr-6 space-y-1">
          <li>طلب نسخة من بياناتك.</li>
          <li>تصحيح أو حذف بياناتك.</li>
          <li>إلغاء حسابك في أي وقت.</li>
          <li>سحب الموافقة على معالجة البيانات.</li>
        </ul>
        <p>
          للممارسة هذه الحقوق: <a href="mailto:privacy@tips-tricks.app" className="text-primary underline">privacy@tips-tricks.app</a>
        </p>

        <h2 className="text-xl font-semibold">9. الأطفال</h2>
        <p>
          التطبيق غير موجه للأطفال دون 18 عاماً، ولا نجمع بياناتهم عمداً.
        </p>

        <h2 className="text-xl font-semibold">10. التعديلات</h2>
        <p>
          قد نحدّث هذه السياسة. سنُعلمك بأي تغيير جوهري داخل التطبيق قبل تطبيقه.
        </p>

        <h2 className="text-xl font-semibold">11. التواصل</h2>
        <p>
          البريد: <a href="mailto:privacy@tips-tricks.app" className="text-primary underline">privacy@tips-tricks.app</a><br />
          الموقع: سلطنة عُمان
        </p>
      </section>
    </main>
  );
}
