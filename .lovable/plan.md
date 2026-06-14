## الهدف
1. **إلغاء سبلاش Android الأصلية** (الشاشة البيضاء التي يعرضها النظام قبل ظهور التطبيق) بحيث ينتقل المستخدم مباشرة إلى الواجهة.
2. **التحقق من تكامل نظام الإشعارات** للمستخدم وسد الفجوات المتبقية قبل إصدار v5.

---

## أ) إلغاء السبلاش الأصلية

### الوضع الحالي
- `@capacitor/splash-screen` **غير مثبّت** في `package.json` ✅
- `capacitor.config.ts` لا يحوي قسم `SplashScreen` ✅
- إذاً ما يراه المستخدم حالياً هو **Android 12+ System Splash** (يأتي من `android:windowSplashScreenAnimatedIcon` في `styles.xml` تلقائياً عند `npx cap add android`).

### الحل
لا يمكن إزالتها 100% (Android يفرض شاشة افتتاح دنيا)، لكن نجعلها **شفافة وفورية**:
- تعديل `android/app/src/main/res/values/styles.xml` لجعل theme الـ launch:
  - `windowSplashScreenBackground = #FFFFFF` (نفس خلفية التطبيق → لا وميض)
  - حذف `windowSplashScreenAnimatedIcon` → لا أيقونة متحركة
  - `windowSplashScreenAnimationDuration = 0`
- بما أن `android/` مولّد محلياً، نضع التعديل في **`docs/NATIVE_BUILD.md`** مع snippet جاهز للنسخ.

### في الكود
- التأكد أن لا شيء في `src/` يستدعي `SplashScreen.show/hide` (تحقّقت: لا شيء).
- لا تغييرات في React side.

---

## ب) التحقق من تكامل الإشعارات

### ما هو موجود ويعمل ✅
| المكوّن | الحالة |
|---|---|
| `useLocalNotifications` — boot + focus + online + realtime resync | ✅ |
| طلب POST_NOTIFICATIONS (Android 13+) | ✅ |
| إنشاء قناة High Importance | ✅ |
| `fireTestNotification` (زر اختبار في SafeHome) | ✅ |
| `useTrialExpiryNotification` (تذكير قبل ٤٨ ساعة) | ✅ |
| إدارة الإشعارات من Admin Panel | ✅ |

### الفجوات التي سنسدّها

#### 1. **مستمع نقر الإشعار (deep-link)**
حالياً عند نقر الإشعار → التطبيق يفتح فقط. لا يذهب لشاشة محدّدة.

**التغيير**: إضافة `useNotificationTapHandler` يُسجَّل في `App.tsx`:
```ts
LocalNotifications.addListener("localNotificationActionPerformed", (event) => {
  const route = event.notification.extra?.route;
  if (route) navigate(route);
});
```
وتعديل `useLocalNotifications.ts` و `useTrialExpiryNotification.ts` لتمرير `extra: { route: "..." }`:
- إشعار التجربة → `/?paywall=1`
- إشعارات Admin → الـ route الذي حدّده المسؤول (نضيف عمود `extra_route` لاحقاً لو طُلب — حالياً نسمح بحقل اختياري في `scheduled_notifications.body` كـ JSON أو نقتصر على home).

ملاحظة: لا حاجة لـ migration الآن — نمرّر `route` فقط لإشعارات النظام (trial expiry) وندع إشعارات Admin مفتوحة على home.

#### 2. **زر اختبار الإشعارات في مكان واضح للمستخدم**
حالياً `fireTestNotification` متاح فقط في صفحة `SafeHome`. لا يصل إليه المستخدم في الوضع الطبيعي.

**التغيير**: إضافة قسم "الإشعارات" في صفحة الإعدادات/الملف الشخصي (لو موجودة) أو زر صغير في `GlobalTrialBanner` لاختبار وصول الإشعارات.

أبحث أولاً عن صفحة Settings موجودة، وإلا نُضيف القسم في صفحة `Profile`/`Account` إذا وُجدت. إن لم تكن موجودة، نضع الزر داخل قائمة منسدلة في الـ Header.

#### 3. **تحسين رسائل الـ permission**
حالياً عند رفض المستخدم لإذن الإشعارات، نطبع `console.info` فقط. **التغيير**: عند الرفض، عرض toast صديق:
> "لتصلك تذكيرات يومية، فعّل الإشعارات من إعدادات التطبيق."
مع زر "فتح الإعدادات" (Capacitor App settings intent).

#### 4. **التأكد من المتطلبات النيتيف**
في `docs/NATIVE_BUILD.md` (موجود بالفعل):
- ✅ `ic_stat_icon` بكل DPIs
- ✅ `RECEIVE_BOOT_COMPLETED` في AndroidManifest
- ✅ `SCHEDULE_EXACT_ALARM` + `USE_EXACT_ALARM`

سنضيف فقرة جديدة "اختبار الإشعارات على الجهاز" بأربع خطوات تحقق سريعة.

---

## الملفات المعدّلة

| ملف | تغيير |
|---|---|
| `src/hooks/useNotificationTapHandler.ts` (جديد) | مستمع localNotificationActionPerformed + navigate |
| `src/App.tsx` | استدعاء `useNotificationTapHandler()` داخل NotificationsBootstrap |
| `src/hooks/useLocalNotifications.ts` | توست عند رفض الإذن + زر فتح الإعدادات |
| `src/hooks/useTrialExpiryNotification.ts` | إضافة `extra: { route: "/?paywall=1" }` |
| `src/components/NotificationsTestButton.tsx` (جديد) | زر صغير قابل لإعادة الاستخدام |
| إضافة الزر في مكان يصله المستخدم (سأحدد بعد قراءة هيكل الـ Settings/Profile) |
| `docs/NATIVE_BUILD.md` | snippet styles.xml لإلغاء السبلاش + قسم اختبار الإشعارات |

**لا تغييرات في**: schema، RLS، edge functions، plans، billing.

---

## التسليم
- إلغاء عملي للسبلاش (عبر docs لأنها native).
- 5 ملفات React صغيرة + توثيق.
- اختبار يدوي بعد بناء AAB التالي.

أوافق على البدء؟