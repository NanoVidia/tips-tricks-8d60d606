# 🤖 GitHub Workflows

منظومة متكاملة من 6 workflows لإدارة دورة حياة التطبيق بالكامل.

| # | الملف | متى يعمل | الغرض | المدة |
|---|------|----------|-------|-------|
| 1 | `ci.yml` | كل push / PR على `main` | typecheck + lint + tests + build | ~3 د |
| 2 | `pr-preview.yml` | كل PR | بناء + مقارنة حجم الـ bundle مع `main` | ~5 د |
| 3 | `release.yml` | يدوي / push tag `v*` | بناء AAB موقّع + GitHub Release + Play upload | ~10 د |
| 4 | `nightly.yml` | كل ليلة 02:00 UTC | بناء تلقائي من `main` كـ pre-release | ~10 د |
| 5 | `keystore-management.yml` | يدوي | verify / generate / import للـ keystore | ~1 د |
| 6 | `security-audit.yml` | كل أحد + عند تعديل deps | npm audit + secrets scan + CodeQL | ~5 د |

---

## 🚀 سيناريوهات الاستخدام

### إصدار جديد (الطريقة الموصى بها)
1. Actions → **Release** → Run workflow
2. اختر `bump`: `patch` (1.0.0 → 1.0.1) أو `minor` (→ 1.1.0) أو `major` (→ 2.0.0)
3. (اختياري) `track`: `internal` للتجربة على Play Console
4. سيتم تلقائياً:
   - ترقية الإصدار في `capacitor.config.ts` و `appVersion.ts`
   - commit + push للترقية
   - بناء AAB + APK + mapping.txt موقّعة
   - إنشاء GitHub Release مع changelog من Conventional Commits
   - رفع لـ Google Play (إن كان `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` موجود + `track ≠ none`)
   - إشعار Telegram (إن كانت `TELEGRAM_*` موجودة)

### إصدار طارئ بإصدار يدوي
- Run → bump=`manual` → version_name=`1.5.0` → version_code=`12`

### استعادة keystore بعد فقدان الأسرار
- Actions → **Keystore Management** → mode=`import` → الصق base64 + كلمات المرور

### الإعداد لأول مرة (عند غياب أسرار Android)
- Actions → **Keystore Management** → Run workflow
- اترك `mode` على القيمة الافتراضية `generate`
- حمّل artifact: `keystore-backup-DOWNLOAD-AND-DELETE` واحفظه بمكان آمن

### التحقق من سلامة keystore الحالي
- mode=`verify` — يطبع SHA-1/SHA-256 fingerprints

---

## 🔐 الأسرار المطلوبة

اضبطها من **Settings → Secrets and variables → Actions**:

### إلزامية (تُولَّد تلقائياً عند أول تشغيل لـ Release)
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

### اختيارية
| السر | الغرض |
|------|-------|
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | رفع تلقائي على Google Play Console |
| `TELEGRAM_BOT_TOKEN` | إشعارات Telegram عند نجاح/فشل الإصدار |
| `TELEGRAM_CHAT_ID` | معرّف القناة/المحادثة المستلمة |

---

## 📝 Conventional Commits

لإفادة قصوى من الـ Changelog التلقائي، اكتب commit messages بالصيغة:
```
feat: إضافة شاشة المفضلة
fix: إصلاح زر الحفظ في iOS
chore: تحديث dependencies
perf: تحسين سرعة التحميل
docs: تحديث README
```

---

## 🔄 Dependabot

`.github/dependabot.yml` يفتح PRs أسبوعية كل اثنين 06:00 UTC لتحديث:
- npm packages (مجمّعة: radix-ui, capacitor, dev-deps)
- GitHub Actions

---

## 🔒 Branch Protection (موصى به)

من **Settings → Branches → main → Add rule**:
- ✅ Require status checks: `CI / quality`
- ✅ Require pull request reviews
- ✅ Include administrators

---

## 🆘 استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| `Capacitor CLI requires NodeJS >=22` | تأكد أن جميع الـ workflows تستخدم `node-version: "22"` |
| `keystore password is wrong` | شغّل `Keystore Management` → mode=`verify` |
| `versionCode must be greater than X` | استخدم Release → سيتم زيادة versionCode تلقائياً فوق آخر tag |
| `Play upload skipped` | أضف `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` + اختر `track ≠ none` |
