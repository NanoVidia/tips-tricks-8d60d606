## الوضع الحالي

عندك 4 workflows:

- `android-build.yml` — بناء AAB (debug-style، تكرار للـ release)
- `android-release.yml` — بناء AAB موقّع + توليد keystore تلقائي + GitHub Release ✅ ممتاز
- `generate-keystore.yml` — توليد keystore لمرة واحدة (مكرر مع release)
- `import-keystore.yml` — استيراد keystore موجود

**المشكلة:** تكرار + لا يوجد CI تلقائي + لا يوجد رفع لـ Google Play + لا يوجد فحص جودة + إدارة الإصدار يدوية بحتة.

يظهر هذا الخطأ

Run if [ ! -d "android" ]; then

  if [ ! -d "android" ]; then

    npx cap add android

  fi

  npx cap sync android

  shell: /usr/bin/bash -e {0}

  env:

    JAVA_HOME: /opt/hostedtoolcache/Java_Temurin-Hotspot_jdk/21.0.10-7/x64

    JAVA_HOME_21_X64: /opt/hostedtoolcache/Java_Temurin-Hotspot_jdk/21.0.10-7/x64

    ANDROID_HOME: /usr/local/lib/android/sdk

    ANDROID_SDK_ROOT: /usr/local/lib/android/sdk

    CAP_ENV: production

[fatal] The Capacitor CLI requires NodeJS >=22.0.0

        Please install the latest LTS version.

Error: Process completed with exit code 1.

---

## المنظومة المقترحة (6 workflows متكاملة)

### 1. `ci.yml` — فحص آلي عند كل Push/PR

يعمل تلقائياً على كل commit و PR. سريع (~3 دقائق).

- TypeScript typecheck + ESLint + Vitest
- بناء Vite للتأكد من سلامة الـ web build
- تقرير `content-quality-report.mjs` الموجود عندك
- يمنع merge إذا فشل (status check)

### 2. `pr-preview.yml` — معاينة لكل PR

- بناء الـ web ورفعه كـ artifact
- تعليق تلقائي على الـ PR بحجم الـ bundle ومقارنته بالـ main
- اكتشاف زيادات حجم > 10% تلقائياً

### 3. `release.yml` — الإصدار الرسمي (يستبدل android-release.yml الحالي)

نسخة محسّنة من الموجود، مع إضافات:

- **إدارة إصدار ذكية:** خيار `bump`: `patch`/`minor`/`major`/`manual` بدل إدخال يدوي فقط
- **Auto-increment لـ versionCode** بحيث لا يمكن أن يقل عن الموجود في الـ tags السابقة
- **Changelog تلقائي** من الـ commits (Conventional Commits)
- **Multi-artifact:** AAB + APK + mapping.txt (لـ ProGuard) + source-map للـ web
- **توقيع keystore تلقائي** (موجود)
- **رفع تلقائي لـ Google Play** عبر `r0adkll/upload-google-play` (track: internal/alpha/beta/production)
- **إنشاء GitHub Release** مع AAB + changelog + screenshots
- **إشعار Telegram/Discord** (اختياري عبر webhook secret)

### 4. `nightly.yml` — بناء يومي تجريبي

كل ليلة 02:00 UTC من فرع `main`:

- بناء AAB بـ versionCode = `<base> + run_number`
- رفع كـ pre-release تلقائي
- يُحذف بعد 14 يوم

### 5. `keystore-management.yml` — إدارة الـ keystore (يستبدل generate + import)

workflow واحد بـ 3 أوضاع عبر `mode` input:

- `generate` — توليد جديد (للمشاريع الجديدة فقط)
- `import` — استيراد keystore موجود (لاستعادة بعد فقدان الأسرار)
- `verify` — التحقق من صحة الأسرار الموجودة + طباعة fingerprints (SHA-1/SHA-256)

### 6. `security-audit.yml` — فحص أمني أسبوعي

كل أحد:

- `npm audit` للـ dependencies
- TruffleHog لاكتشاف أي secrets مسرّبة في الـ git history
- Snyk أو CodeQL للكود
- يفتح Issue تلقائياً لو وجد high/critical

---

## ملفات داعمة

- `.github/CODEOWNERS` — حمايتك كصاحب على الملفات الحساسة
- `.github/dependabot.yml` — تحديث dependencies أسبوعياً
- `.github/release.yml` — تصنيف الـ Changelog حسب labels
- `.github/workflows/README.md` — توثيق عربي شامل لكل workflow

---

## الأسرار المطلوبة في GitHub


| السر                                      | الغرض               | إلزامي               |
| ----------------------------------------- | ------------------- | -------------------- |
| `ANDROID_KEYSTORE_BASE64`                 | توقيع AAB           | ✅ (يُولَّد تلقائياً) |
| `ANDROID_KEYSTORE_PASSWORD`               | "                   | ✅                    |
| `ANDROID_KEY_ALIAS`                       | "                   | ✅                    |
| `ANDROID_KEY_PASSWORD`                    | "                   | ✅                    |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`        | رفع لـ Play Console | اختياري              |
| `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` | إشعارات             | اختياري              |


---

## خطوات الحذف/التنظيف

سأحذف:

- `android-build.yml` (مكرر — وظيفته داخل release.yml)
- `generate-keystore.yml` + `import-keystore.yml` (مدمجان في keystore-management.yml)

---

## السؤال قبل التنفيذ

1. **رفع Google Play تلقائي:** هل عندك Service Account من Google Play Console؟ (إن لا، أتركه disabled افتراضياً ويمكنك تفعيله لاحقاً)
2. **إشعارات:** Telegram أم Discord أم بدون؟
3. **Conventional Commits:** هل تلتزم بصيغة `feat:`/`fix:`/`chore:`؟ (يحدد جودة الـ changelog التلقائي)
4. **Dependabot:** هل تريد PRs تلقائية أسبوعية لتحديث الحزم؟

أجب على الأربعة (أو قل "كلها نعم" / "كلها لا") وأبدأ التنفيذ فوراً.