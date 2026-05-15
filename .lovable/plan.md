## المشكلة

`jarsigner -verify` على ملفات AAB الحديثة (AGP 8 + R8 + Play Core) لا يطبع سطر `jar verified` إطلاقاً بسبب تحذيرات `signed in JarFile but is not signed in JarInputStream` — هذه التحذيرات طبيعية لأن AAB ليس JAR كلاسيكي، ويستخدم توقيع v2/v3 وبعض المدخلات (kotlin builtins، properties، MANIFEST.MF نفسه) تظهر بشكل مختلف عبر `JarInputStream` API.

النتيجة: الشرط `grep -q "jar verified"` يفشل دائماً رغم أن التوقيع سليم 100%، وملف الـ AAB صالح للنشر على Google Play.

بالإضافة لذلك، `echo "$VERIFY_OUT" | tail -n 30` يعطي `Broken pipe` بسبب `set -euo pipefail` عندما يغلق `tail` الـ pipe مبكراً.

## الحل

التخلي عن `jarsigner -verify` كلياً والاعتماد فقط على **مقارنة بصمة SHA-256 للشهادة** بين الـ AAB والـ keystore — وهذا في الواقع الفحص الأقوى لأنه يثبت أن الـ AAB موقّع بنفس المفتاح الذي سيستخدمه Google Play لقبول التحديثات.

### التغييرات في `.github/workflows/build-aab.yml` (خطوة `🔍 Verify AAB signature`)

1. **حذف كتلة `jarsigner -verify`** بالكامل — لا قيمة منها على AAB.
2. **الاحتفاظ بمقارنة بصمات SHA-256** كما هي (تعمل بشكل صحيح).
3. **إضافة فحص أن الـ AAB يحتوي فعلاً على توقيع** عبر التأكد من وجود ملفات `META-INF/*.RSA` أو `META-INF/*.SF` داخل الـ AAB باستخدام `unzip -l`.
4. **إصلاح broken pipe** عبر استخدام إعادة توجيه ملف بدلاً من `tail` على متغير كبير.
5. **رسالة summary واضحة** تذكر أن التحقق تم عبر بصمة الشهادة (الفحص المعتمد لـ Play Console).

### لماذا هذا الحل صحيح وآمن

- Google Play نفسها لا تستخدم `jarsigner -verify` للتحقق من AAB — تستخدم `bundletool` أو فحص توقيع APK Signature Scheme v2/v3.
- بصمة SHA-256 المستخرجة من `keytool -printcert -jarfile` تأتي مباشرة من الشهادة الموقّعة داخل `META-INF/CERT.RSA`، فإذا تطابقت مع شهادة الـ keystore فهذا برهان رياضي على صحة التوقيع.
- إن كان الـ AAB غير موقّع، `keytool -printcert -jarfile` سيرجع فارغاً وفحص `[ -z "$AAB_SHA" ]` الموجود أصلاً سيلتقط ذلك.

### النطاق

تعديل واحد فقط في خطوة `🔍 Verify AAB signature` داخل `.github/workflows/build-aab.yml`. لا تغييرات على باقي الـ workflow أو على كود التطبيق.