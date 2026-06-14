# فجوات على مستوى APK لا يمكن إصلاحها بـ OTA — قبل v5

> القاعدة: أي شيء يعيش في `android/` أو `capacitor.config.ts` أو `package.json` (plugins) أو الأصول الأصلية (drawable, mipmap) — لا تستفيد من تحديث Lovable المباشر. يحتاج بناء AAB جديد ورفع للـ Play Console.

## الحالة الحاضرة

- `cordova-plugin-purchase` غير مُثبَّت في `package.json` رغم استخدامه في `src/lib/billing/store.ts` — يحتاج إضافته الآن وإلا الشراء لن يعمل على الجهاز
- `@capacitor/app`, `@capacitor/status-bar`, `@capacitor/splash-screen` غير مُثبّتة
- مجلد `android/` غير موجود في المستودع (يُولَّد بـ `npx cap add android`) لذا أي ملف أصلي مطلوب يجب توثيقه ليُضاف بعد التوليد
- `smallIcon: "ic_stat_icon"` في إعداد LocalNotifications يشير إلى drawable غير موجود → الإشعارات لن تظهر إطلاقاً على Android 5+

## الفجوات المرتّبة بالخطورة

### 🔴 قاطعة — تعطل ميزات أساسية في v5 إذا لم تُحل

**1. `cordova-plugin-purchase` غير مُثبَّت**

- ملف `store.ts` يستدعي `window.CdvPurchase` لكن الحزمة ليست في `dependencies`
- بدون التثبيت + `cap sync` → كل عمليات الشراء تفشل صامتاً → الـ Paywall لن يفتح ورقة Google Play
- الحل: `npm i cordova-plugin-purchase`

**2. أيقونة الإشعارات `ic_stat_icon` مفقودة**

- بدون drawable أبيض شفاف بهذا الاسم → نظام Android يرفض عرض الإشعار (لا أيقونة = لا إشعار)
- إشعار "تنتهي تجربتك غداً" + الإشعارات اليومية كلها لن تظهر
- الحل: توليد PNG أبيض شفاف بأحجام mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi ووضعها في `android/app/src/main/res/drawable-*`، أو استخدام `@capacitor/assets`

**3. أيقونة التطبيق وشاشة البداية الافتراضية**

- بدون `@capacitor/assets` ومصدر أيقونة → APK يخرج بأيقونة Capacitor البيضاء الافتراضية
- لا شاشة splash مع شعار — مجرد شاشة بيضاء
- الحل: إنشاء `resources/icon.png` (1024×1024) و `resources/splash.png` (2732×2732) + تثبيت `@capacitor/assets` وتشغيل `npx capacitor-assets generate`

**4. لا fallback عند تعذُّر تحميل OTA**

- `server.url = https://tips-tricks.lovable.app` → إذا فشلت الشبكة أو سقط دومين lovable.app → شاشة بيضاء أبدية
- `webDir: "dist"` لا يُستخدم عندما `server.url` مضبوط
- الحل: إما طبقة Service Worker للأصول الأساسية، أو شاشة خطأ Native عبر `@capacitor/app` تكتشف فشل التحميل وتعرض زر "إعادة المحاولة"

**5. ProGuard / R8 يكسر `cordova-plugin-purchase**`

- إصدار release يُفعِّل R8 افتراضياً → reflection داخل الـ plugin تُمسح → الشراء يفشل بـ `ClassNotFoundException`
- الحل: قواعد `-keep class com.google.android.gms.** { *; }` و `-keep class com.cordova.plugin.purchase.** { *; }` في `android/app/proguard-rules.pro`

### 🟡 مهمة — رفض من Play أو تجربة سيئة

**6. Target SDK 35 إلزامي**

- Google يرفض رفع APK جديد بـ `targetSdk < 35` من أغسطس 2025
- يجب التأكد بعد `cap add android` أن `android/variables.gradle` يحدد `targetSdkVersion = 35`

**7. `android:allowBackup="true"` افتراضي**

- localStorage (بما فيه `obgyn_trial_started_at`) يُنسخ احتياطياً لـ Google Drive → يمكن استعادته على جهاز جديد لتمديد التجربة
- الحل: إضافة `android:allowBackup="false"` أو ملف `backup_rules.xml` يستثني تلك المفاتيح في AndroidManifest.xml

**8. شاشة splash تُغلق قبل تحميل التطبيق**

- بدون `SplashScreen` plugin مضبوط بـ `launchAutoHide: false` → فلاش شاشة بيضاء بين splash و تحميل lovable.app (3-5 ثوانٍ على شبكة بطيئة)
- الحل: تثبيت `@capacitor/splash-screen` + استدعاء `SplashScreen.hide()` بعد `window.load`

**9. Status bar غير مضبوط — Android 15 edge-to-edge**

- Android 15 يفرض edge-to-edge → المحتوى يختفي خلف status bar إذا لم يُضبط `viewport-fit=cover` (موجود ✓) + StatusBar plugin
- الحل: `@capacitor/status-bar` مع `style: 'DARK'` + `overlaysWebView: false`

**10. زر الرجوع الصلب على Android يخرج من التطبيق فوراً**

- بدون handler عبر `@capacitor/app` `backButton` listener → ضغطة واحدة من الصفحة الرئيسية = خروج بلا تأكيد
- الحل: تثبيت `@capacitor/app` + handler يطلب تأكيد "اضغط مرة ثانية للخروج"

**11. RECEIVE_BOOT_COMPLETED للإشعارات المجدولة**

- بدون هذا الإذن، إعادة تشغيل الجهاز يلغي كل الإشعارات المجدولة محلياً
- `@capacitor/local-notifications` لا يضيفه افتراضياً
- الحل: إضافته يدوياً في AndroidManifest.xml بعد `cap add android`

**12. عدم تطابق إصدار التطبيق**

- `package.json`: `1.0.0` بينما `capacitor.config.ts`: `1.0.4 / code 5`
- لا يكسر شيئاً لكن يربك التتبع. مزامنة الاثنين

### 🟢 لطيفة — تحسينات بعد v5

**13. Deep link لاستلام إشعارات الإلغاء من Google Play** — اختياري
**14. WebView WebRTC/Camera permissions** — لا نحتاجها الآن
**15. App Bundle (AAB) optimization** — تلقائي

## ما يمكن تأجيله بأمان لـ OTA لاحقاً

- نصوص واجهة المستخدم
- إصلاحات منطق Paywall/AccessGate
- محتوى الأدوات والاختبارات
- ألوان وأنماط
- إصلاحات Edge Functions (تنزل فوراً)
- منطق RTDN webhook (سيرفر)

---

## خطة العمل المقترحة قبل بناء v5

**المرحلة A — تثبيت الحزم الناقصة (Lovable يقوم بها):**

```text
npm i cordova-plugin-purchase
npm i @capacitor/app @capacitor/status-bar @capacitor/splash-screen
npm i -D @capacitor/assets
```

**المرحلة B — تعديلات `capacitor.config.ts`:**

- إضافة `SplashScreen` config (`launchAutoHide: false`, مدة 2s, شعار مركزي)
- إضافة `StatusBar` config
- مزامنة `package.json.version` مع `APP_VERSION_NAME`

**المرحلة C — كود يضاف داخل التطبيق (Lovable):**

- استدعاء `SplashScreen.hide()` بعد تحميل التطبيق
- handler لـ hardware back button
- استدعاء `StatusBar.setStyle()` على البوت

**المرحلة D — أصول وملفات أصلية (تتم على جهازك بعد git pull):**

- وضع `resources/icon.png` و `resources/splash.png` ثم `npx capacitor-assets generate`
- توليد `ic_stat_icon` لكل drawable-*
- إنشاء `android/app/proguard-rules.pro` بقواعد cordova-plugin-purchase
- تعديل AndroidManifest.xml: `allowBackup="false"`, `RECEIVE_BOOT_COMPLETED`, `targetSdk=35`
- توقيع AAB بالـ keystore (صفحة KeystoreSetup موجودة)

**المرحلة E — رفع للـ Play Console:**

- ملء Data Safety form
- إضافة Privacy Policy URL (موجود `/privacy`)
- ربط Pub/Sub topic بـ RTDN webhook URL
- تفعيل المنتجات الثلاثة tt_monthly / tt_yearly / tt_lifetime

---

## ما أحتاج قرارك فيه

1. هل تريد أن أنفّذ **المراحل A + B + C كاملة الآن** (تثبيت الحزم + كود التطبيق)؟
2. هل تملك ملف أيقونة عالي الدقة (1024×1024) لاستخدامه في توليد الأيقونات والـ splash؟ أم أولّد واحدة افتراضية بشعار «Tips & Tricks»؟
3. للمرحلة D (الملفات الأصلية): سأكتب لك دليلاً تفصيلياً تنفّذه على جهازك بعد `npx cap add android`، لأن مجلد `android/` يُولَّد محلياً وليس في المستودع. موافق؟

لكن لا اريد سبلاش