# بروتوكول اختبار رحلة الدفع — v5

اختبار شامل على جهاز Android حقيقي قبل إطلاق نسخة Production.
استخدمه كـ checklist يدوية أثناء جلسة الاختبار.

---

## 0. الإعداد (مرة واحدة)

- [ ] Play Console → **Setup → License testing** → إضافة بريد حساب Google للـ tester.
- [ ] Play Console → **Testing → Internal testing** → إنشاء track → رفع AAB → دعوة الـ tester (قائمة بريد).
- [ ] على الجهاز: تسجيل الدخول بحساب tester في Google Play (Settings → Accounts).
- [ ] فتح رابط الاختبار الداخلي → "Become a tester" → تثبيت من Play Store.
- [ ] التحقق أن RTDN topic مربوط بدالة `play-rtdn-webhook` (Pub/Sub push).
- [ ] التحقق من المنتجات في Play Console:
  - `tt_monthly` (Subscription) + Base plan + Offer مع `7 day free trial`.
  - `tt_yearly`  (Subscription) + Base plan + Offer مع `7 day free trial`.
  - `tt_lifetime` (One-time product).
  - كلها **Active**.

> **مهم لـ tester**: مدة التجديد تصبح 5 دقائق = شهر، 30 دقيقة = سنة. التجربة المجانية 3 دقائق بدل 7 أيام.

---

## 1. تجربة 7 أيام المحلية (بدون شراء)

| # | خطوة | المتوقع | ✓ |
|---|---|---|---|
| 1.1 | تثبيت جديد ثم فتح أول مرة | الـ GlobalTrialBanner يظهر: "تبقّى 7 أيام" | ☐ |
| 1.2 | فتح أي أداة (Drugs/DDx/Protocols/Guidelines) | تعمل بدون Paywall | ☐ |
| 1.3 | في DevTools/ADB: `localStorage.setItem('obgyn_trial_started_at', String(Date.now() - 8*86400000))` ثم reload | AutoPaywall ينفتح خلال ثانية | ☐ |
| 1.4 | فتح أداة مقفلة من خلف Paywall | محتوى مقفل، CTA يفتح Paywall | ☐ |
| 1.5 | إغلاق Paywall (سحب لأسفل) | لا يُعاد فتحه في نفس الـ session | ☐ |
| 1.6 | إعادة تشغيل التطبيق (kill + open) | AutoPaywall يفتح مرة واحدة فقط | ☐ |
| 1.7 | فحص server: `select * from trial_starts where device_id = '<id>'` | صف موجود بـ `trial_started_at` يطابق المحلي | ☐ |

---

## 2. الشراء — Yearly مع تجربة Google Play (3 دقائق tester)

| # | خطوة | المتوقع | ✓ |
|---|---|---|---|
| 2.1 | فتح Paywall → اختيار خطة `سنوي` → "ابدأ ٧ أيام مجاناً" | الانتقال لخطوة `trial-explainer` | ☐ |
| 2.2 | الضغط على "ابدأ التجربة المجانية الآن" | تظهر شاشة Google Play الرسمية بـ `Free for 7 days then $X` | ☐ |
| 2.3 | إكمال الشراء | يُغلق Paywall، toast نجاح | ☐ |
| 2.4 | فحص `subscriptions` | صف بـ `plan='yearly'`, `status='active'`, `purchase_token` مملوء، `current_period_end` ≈ +3 دقائق tester | ☐ |
| 2.5 | فحص `purchase_events` | حدث `client_verify_anon` بـ `processed=true` و `raw_payload.paymentState ∈ (1,2)` | ☐ |
| 2.6 | فتح أي أداة مقفلة سابقاً | تعمل بدون Paywall | ☐ |
| 2.7 | Kill ثم إعادة فتح | لا Paywall، الأدوات تعمل (entitlement محفوظ محلياً) | ☐ |

---

## 3. الشراء — Lifetime (دفعة واحدة)

| # | خطوة | المتوقع | ✓ |
|---|---|---|---|
| 3.1 | اختيار `مدى الحياة` → CTA يقول "متابعة عبر Google Play" (بدون trial-explainer) | ✅ | ☐ |
| 3.2 | الشراء عبر Play | toast نجاح، `subscriptions.plan='lifetime'`, `current_period_end=null`, `status='active'` | ☐ |
| 3.3 | إعادة فتح التطبيق | وصول دائم، `daysLeft=9999` | ☐ |

---

## 4. Restore بعد إعادة التثبيت

| # | خطوة | المتوقع | ✓ |
|---|---|---|---|
| 4.1 | بعد شراء ناجح (سيناريو 2): إلغاء تثبيت التطبيق | localStorage يُمسح | ☐ |
| 4.2 | إعادة التثبيت من Play Store | يبدأ كـ تجربة 7 أيام محلية (لأن `obgyn_trial_started_at` فارغ، لكن server-sync يعيد التاريخ الأصلي) | ☐ |
| 4.3 | فتح Paywall → "استعادة المشتريات" | toast `جارٍ الاستعادة…` يظهر | ☐ |
| 4.4 | خلال ≤ 8 ثوانٍ | toast نجاح، Paywall يُغلق، الأدوات تفتح | ☐ |
| 4.5 | اختبار "إنترنت بطيء" (Network throttling في DevTools أو وضع طيران ثم تشغيل): تكرار 4.3 | لا تظهر رسالة "لم نعثر…" قبل المهلة الكاملة + fallback إلى `check-access` | ☐ |
| 4.6 | إذا تم تسجيل دخول بحساب Google مختلف على الجهاز ثم Restore | رسالة: "لم نعثر على اشتراك نشط مرتبط بحساب Google الحالي…" (واضحة، غير مضللة) | ☐ |

---

## 5. الإلغاء (Cancel via Play Store)

| # | خطوة | المتوقع | ✓ |
|---|---|---|---|
| 5.1 | Google Play → Subscriptions → Cancel | خلال ≤ 60 ث: webhook يُحدّث `subscriptions.status='cancelled'`، `current_period_end` لا يتغير | ☐ |
| 5.2 | افتح التطبيق فوراً | الأدوات لا تزال تعمل (لم تنتهِ الفترة بعد) | ☐ |
| 5.3 | انتظر حتى انتهاء `current_period_end` (3 دقائق tester) → افتح التطبيق | `useAccess.status='expired'`، AutoPaywall يفتح | ☐ |
| 5.4 | فحص `check-access` يُعيد `hasAccess:false, status:'expired'` | ✅ | ☐ |

---

## 6. Refund

| # | خطوة | المتوقع | ✓ |
|---|---|---|---|
| 6.1 | Play Console → Order → Refund + Revoke | webhook يُحدّث `status='refunded'` | ☐ |
| 6.2 | تطبيق مفتوح → نقل لـ background ثم رجوع (يستدعي check-access) | الوصول يُسحب فوراً، Paywall يظهر | ☐ |

---

## 7. حالات الدفع المعلّق (Pending — اختياري)

| # | خطوة | المتوقع | ✓ |
|---|---|---|---|
| 7.1 | استخدام بطاقة test "Slow test card, approves after a few minutes" من Play | الشراء يعود `paymentState=0` | ☐ |
| 7.2 | استجابة `verify-purchase` | `202`، body: `{ ok:false, pending:true }` | ☐ |
| 7.3 | السلوك في الكود | لا يستدعي `p.finish()`، لا يمنح entitlement، لا toast خطأ | ☐ |
| 7.4 | بعد تأكيد البنك → Play يُعيد إرسال approved | يُمنح الـ entitlement تلقائياً، subscription `status='active'` | ☐ |

---

## 8. منع الحلقات والرسائل المضللة (cross-cutting)

أثناء كل ما سبق، تحقق أن:

- [ ] لا يظهر نفس الـ toast مرتين متتاليتين.
- [ ] لا يُفتح Paywall بعد أن أغلقه المستخدم في نفس الـ session.
- [ ] رسالة "تعذّر إتمام الشراء" لا تظهر بعد نجاح فعلي.
- [ ] زر "ابدأ ٧ أيام مجاناً" يتحول إلى "متابعة عبر Google Play" إذا كانت `access.status === 'expired'`.
- [ ] شاشة `trial-explainer` لا تظهر بعد انتهاء التجربة المحلية (لأن Google ستقرر).
- [ ] على شبكة بطيئة، toast "جارٍ الاستعادة…" يبقى ظاهراً حتى الانتهاء.
- [ ] ضغط زر "متابعة" مرتين بسرعة لا يفتح Google Play sheet مرتين (الزر `disabled` أثناء `busy`).

---

## 9. فحص نهائي قبل الإطلاق

- [ ] `select count(*) from subscriptions where status='active'` يطابق عدد المشترين الفعليين.
- [ ] لا errors في `supabase/functions/verify-purchase` logs آخر 24 ساعة.
- [ ] لا errors في `play-rtdn-webhook` logs.
- [ ] `version_code = 5`, `version_name = '1.0.4'` في `capacitor.config.ts` و `build.gradle`.
- [ ] AAB موقّع بـ release keystore.
- [ ] Privacy Policy URL + Data Safety form مُكمّلان في Play Console.

---

**عند اكتمال كل العناصر → جاهز للترقية من Internal Testing إلى Production.**
