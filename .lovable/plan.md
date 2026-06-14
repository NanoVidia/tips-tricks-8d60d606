# مراجعة شاملة لرحلة الدفع — مستخدم بلا حساب

## الرحلة الحالية (ما يحدث فعلاً)

```text
اليوم 0  → تثبيت APK → فتح التطبيق
          → initStore() يسجّل المنتجات من Google Play
          → restore() تلقائي صامت (لا يوجد شيء — جديد)
          → دخول الأدوات → AccessGate يفحص localStorage
          → startTrialIfNeeded() يكتب obgyn_trial_started_at = now
          → status: trial, daysLeft: 7, وصول كامل

اليوم 5  → AccessGate يعرض شريطاً علوياً: "تنتهي تجربتك خلال N أيام"
          → الضغط يفتح Paywall

اليوم 7  → getAccessState() → hasAccess=false, status="expired"
          → AccessGate يستبدل الصفحة بشاشة قفل + زر "عرض خطط الاشتراك"
          → Paywall → اختيار خطة → handlePurchase()
          → CdvPurchase.store.order() → ورقة Google Play الرسمية
          → الدفع → callback `approved` → rememberPurchaseToken()
          → verify-purchase (edge) → Google Play API → upsert subscriptions
          → grantEntitlement() → p.finish() (ACK)
          → AccessGate ينعكس فوراً → hasAccess=true, status="paid"

بعد ذلك  → كل cold start: restore() صامت يعيد إطلاق approved لأي اشتراك
          → كل focus/visibility: useAccess يسأل check-access بـ tokens المحفوظة
          → RTDN webhook يحدّث DB عند التجديد/الإلغاء/الاسترداد
```

## الفجوات والمخاطر المكتشفة

### 🔴 حرجة — توقف الرحلة أو تكسر صامتة

**1. عدم تطابق قيم enum بين DB و RTDN webhook**
- DB `subscription_status` = `{trial, active, expired, cancelled, on_hold, paused, refunded}` (cancelled بحرفين l)
- الكود يرسل `"canceled"` (حرف l واحد) → upsert يفشل صامتاً → الإلغاءات لا تُسجَّل
- الكود يرسل `"pending"` لأي notification غير معروف → غير موجود في enum → فشل
- الكود يرسل `"active"` بدل `"on_hold"` للحالة 5 (ON_HOLD) — يمنح وصولاً وهمياً لمستخدم متوقف عن الدفع

**2. حلقة لانهائية في restore عند الاشتراك الملغى**
- `restore()` → plugin يطلق `approved` لكل token مملوك سابقاً (حتى المنتهية)
- `verifyOnServer` يرجع `valid: false` → throw → `p.finish()` لا يُستدعى
- في الإقلاع التالي يتكرر نفس الشيء → Google يستمر بإعادة التسليم بلا نهاية + بطارية + شبكة

**3. شاشة "انتهت التجربة" بلا قياس زمن آمن**
- مدة التجربة محفوظة فقط في `localStorage` بدون مرجع خادم
- مسح بيانات التطبيق (Settings → Apps → Clear data) يصفر العدّاد → تجربة لا نهائية
- تغيير ساعة الجهاز للوراء يُمدِّد التجربة
- بدون حساب لا توجد طريقة كاملة لمنع ذلك، لكن يمكن تخفيفه بربط بداية التجربة بـ `device_id` على الخادم

### 🟡 متوسطة — UX سيئة لكن لا تعطّل الرحلة

**4. شريط التحذير يظهر فقط داخل المسارات المحمية**
- المستخدم الذي يفتح فقط الصفحة الرئيسية في اليوم 6 لا يرى أي تذكير
- لا يكتشف أن تجربته على وشك الانتهاء حتى يضغط على أداة

**5. رسالة "تمت استعادة المشتريات" مضللة**
- `handleRestore` في Paywall يعرض النجاح فور انتهاء `restorePurchases()` بغضّ النظر هل وُجدت مشتريات أم لا
- `approved` callback يأتي بعدها بشكل غير متزامن
- المستخدم يرى "تمت الاستعادة" ثم يبقى مقفلاً → ارتباك

**6. لا يوجد إشعار محلي قبل انتهاء التجربة**
- `useLocalNotifications` يقرأ فقط من `scheduled_notifications` (إشعارات إدارية عامة)
- لا إشعار خاص "تنتهي تجربتك غداً" مرتبط بتاريخ تثبيت المستخدم

**7. لا يفتح Paywall تلقائياً يوم انتهاء التجربة**
- المستخدم الذي يفتح فقط الصفحة الرئيسية يوم 7 لا يرى أي تنبيه

**8. الصفحة الرئيسية تعرض "Daily MCQ" لكنه ضمن `LOCKED_FEATURES`**
- تناقض: قائمة الميزات المجانية تذكر "حالة سؤال اليوم"، لكن `daily_mcq` في القائمة المقفلة

### 🟢 منخفضة — تحسينات للمتانة

**9. RTDN بلا تحقق OIDC** — أي شخص يعرف URL يمكنه إرسال إشعار مزيف. لكن webhook يعيد الاستعلام من Google API بـ purchase_token → الرفض الفعلي يأتي من Google → الخطر منخفض، فقط يُلوّث `purchase_events`.

**10. اعتماد كامل على `cordova-plugin-purchase`** — لم يُختبر على جهاز حقيقي مع Capacitor 8.

---

## خطة الإصلاح

### المرحلة 1 — إصلاحات حرجة (يجب قبل v5)

**1.1 محاذاة قيم enum في RTDN webhook**
ملف: `supabase/functions/play-rtdn-webhook/index.ts`
- تغيير `"canceled"` → `"cancelled"`
- إضافة حالات `on_hold`, `paused`, `refunded` بشكل صحيح
- استبدال fallback `"pending"` بـ `"active"` للحالات غير المعروفة مع log تحذير
- تطبيق نفس المعالجة في `verify-purchase` لكي تستخدم `"cancelled"` بدل `"expired"` عند `purchaseState=1`

**1.2 إنهاء معاملات Google Play دائماً + grant فقط عند valid**
ملف: `src/lib/billing/store.ts` — في `approved` callback:
- استدعاء `p.finish()` دائماً (ACK لـ Google) سواء صحّت أم لم تصحّ
- استدعاء `grantEntitlement()` فقط عند `result.ok === true`
- في حالة فشل الشبكة (لا رد من السيرفر): لا تنادِ `p.finish()` (Play سيعيد المحاولة) — تمييز خطأ الشبكة عن رفض السيرفر

**1.3 تتبع التجربة على الخادم بـ device_id**
- جدول `trial_starts` موجود بالفعل — استخدامه
- عند أول استدعاء لـ `getAccessState()` بعد `startTrialIfNeeded()`: إرسال `deviceId` لـ edge function جديدة `start-trial` (أو إعادة استخدام `check-access` مع field إضافي)
- الخادم: إن وُجد row للـ deviceId يعيد `trialStartedAt` الأصلي → الجهاز يحدّث `localStorage`
- يحمي ضدّ مسح البيانات وتلاعب الساعة
- `check-access` يقبل deviceId ويُرجِع `trialEndsAt` رسمي

### المرحلة 2 — تحسينات UX قبل v5

**2.1 شريط تحذير عالمي**
- نقل `TrialBanner` من داخل `AccessGate` إلى مكون عالمي مُركّب في `App.tsx` فوق `<Routes>`
- يظهر في كل الصفحات (بما فيها الرئيسية) عندما `daysLeft ≤ 3`

**2.2 إصلاح رسالة الاستعادة**
- `handleRestore` ينتظر حدث `entitlement-changed` لمدة 5 ثوانٍ
- إذا وصل → toast "تمت استعادة اشتراكك"
- إذا لم يصل → toast "لم يتم العثور على مشتريات مرتبطة بحساب Google Play هذا"

**2.3 إشعار محلي "تنتهي تجربتك غداً"**
- في `App.tsx` أو hook جديد: عند توفر Capacitor، جدولة إشعار محلي مرة واحدة عند `trialEndsAt - 24h`
- نص: "بقي يوم واحد على انتهاء تجربتك المجانية"
- يلغى تلقائياً عند الاشتراك

**2.4 فتح Paywall تلقائياً عند انتهاء التجربة (مرة واحدة)**
- في `App.tsx`: إذا `status === "expired"` ولم يُفتح Paywall بعد في هذه الجلسة → فتحه تلقائياً
- علامة في sessionStorage لمنع التكرار خلال الجلسة

**2.5 إصلاح تناقض Daily MCQ**
- حذف `daily_mcq` من `LOCKED_FEATURES` (لأنه على الصفحة الرئيسية المجانية)، أو
- إزالة "حالة سؤال اليوم" من نص الميزات المجانية في Paywall و AccessGate

### المرحلة 3 — متانة (اختياري لاحقاً)

**3.1 OIDC verification في RTDN**
- التحقق من `Authorization: Bearer <OIDC token>` + `aud` + `email` ضد Service Account المرتبط بـ Pub/Sub topic
- يمنع تلويث `purchase_events` بإشعارات مزيفة

**3.2 توحيد productId mapping**
- نقل `PRODUCT_TO_PLAN` إلى ملف مشترك (`_shared/products.ts`) بدل تكراره في 3 functions

---

## الملفات المتأثرة

```text
supabase/functions/play-rtdn-webhook/index.ts   (إصلاح enum + جميع الحالات)
supabase/functions/verify-purchase/index.ts     (status="cancelled" بدل "expired")
supabase/functions/check-access/index.ts        (قبول deviceId + trialEndsAt)
supabase/functions/start-trial/index.ts         (جديد — تسجيل بداية التجربة)
src/lib/billing/store.ts                        (دائماً p.finish + تمييز net error)
src/lib/billing/trial.ts                        (مزامنة trialStartedAt مع الخادم)
src/hooks/useAccess.ts                          (إرسال deviceId)
src/components/Paywall.tsx                      (إصلاح handleRestore)
src/components/AccessGate.tsx                   (نقل TrialBanner خارجاً)
src/App.tsx                                     (TrialBanner عالمي + إشعار محلي + auto-open Paywall)
src/lib/billing/plans.ts                        (إزالة daily_mcq من LOCKED أو من الميزات المجانية)
```

## ما لن أغيّره

- بنية الـ Paywall نفسها (الـ UI الحالي جيد)
- جدول `subscriptions` (تم بالفعل قبول user_id الاختياري + فهرس على purchase_token)
- منطق `verify-purchase` نفسه (الـ flow صحيح)
- منطق `restorePurchases()` (سلوك المكتبة، لا نتحكم به)
