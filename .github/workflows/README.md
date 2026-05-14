# Workflows

## `ci.yml` — فحص آلي
يعمل على كل push/PR: typecheck + lint + tests + web build.

## `build-aab.yml` — بناء AAB موقّع
يدوي فقط. أدخل `version_name` و `version_code` (أو اتركهما فارغين للتزايد التلقائي).
يولّد keystore تلقائياً عند أول تشغيل ويحفظه في GitHub Secrets إذا كان `GH_REPO_ADMIN_TOKEN` متاحاً.

> ملاحظة: `ci.yml` لم يعد يحاول إنشاء أو تحديث أسرار GitHub، لأن هذا كان يسبب فشل الـ CI. إدارة أسرار التوقيع أصبحت محصورة في `build-aab.yml` فقط.

### الأسرار
| السر | الغرض | إلزامي |
|---|---|---|
| `ANDROID_KEYSTORE_BASE64` + `_PASSWORD` + `_ALIAS` + `ANDROID_KEY_PASSWORD` | توقيع AAB | ✅ (تُولَّد تلقائياً) |
| `GH_REPO_ADMIN_TOKEN` | حفظ الأسرار المولَّدة في المستودع | اختياري |
