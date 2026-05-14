# Workflows

## `ci.yml` — فحص آلي
يعمل على كل push/PR: typecheck + lint + tests + web build.

## `build-aab.yml` — بناء AAB موقّع
يدوي فقط. أدخل `version_name` و `version_code` (أو اتركهما فارغين للتزايد التلقائي).
إذا كانت أسرار Android موجودة وصحيحة فسيستخدمها مباشرة. وإذا كانت ناقصة أو تالفة، فسيولّد keystore جديداً ويحفظ الأسرار الأربعة تلقائياً داخل GitHub **بشرط** وجود `GH_REPO_ADMIN_TOKEN` مرة واحدة فقط.

> ملاحظة: `ci.yml` لا يتعامل مع أسرار Android إطلاقاً. كل منطق التوقيع والـ keystore محصور في `build-aab.yml` فقط.

### الأسرار
| السر | الغرض | إلزامي |
|---|---|---|
| `ANDROID_KEYSTORE_BASE64` + `_PASSWORD` + `_ALIAS` + `ANDROID_KEY_PASSWORD` | توقيع AAB | ✅ بعد أول تهيئة |
| `GH_REPO_ADMIN_TOKEN` | bootstrap مرة واحدة لإنشاء أسرار GitHub تلقائياً | ✅ عند أول تشغيل فقط إذا لم تكن الأسرار موجودة |
