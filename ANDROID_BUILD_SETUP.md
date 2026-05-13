# 🔐 إعداد بناء Android المووقّع

هذا الدليل يشرح كيفية إعداد جميع الأسرار اللازمة لبناء تطبيق Android موقّع تلقائياً عبر GitHub Actions.

## المتطلبات المسبقة

- Java JDK (إصدار 21 أو أحدث)
- keytool (يأتي مع Java)
- base64 utility (موجود في Linux/Mac/Git Bash)

## 1️⃣ إنشاء Keystore جديد

إذا لم تكن لديك keystore موجود، استخدم الأمر التالي:

```bash
keytool -genkey -v -keystore release.keystore -keyalg RSA \
  -keysize 2048 -validity 10000 -alias release-key

# عند الطلب أدخل:
# - Keystore Password: [اختر كلمة مرور قوية]
# - Key Password: [نفس الكلمة أو كلمة أخرى]
# - الأسماء والبيانات الشخصية كما هو مطلوب
```

> ⚠️ **احفظ Keystore و كلمات المرور في مكان آمن جداً!**

---

## 2️⃣ تحويل Keystore إلى Base64

بمجرد حصولك على `release.keystore`:

**على Linux / Mac:**
```bash
base64 -i release.keystore -o keystore.b64
cat keystore.b64
```

**على Windows (PowerShell):**
```powershell
$content = [Convert]::ToBase64String([IO.File]::ReadAllBytes("release.keystore"))
$content | Set-Clipboard
Write-Host "تم نسخ Base64 إلى الحافظة"
```

---

## 3️⃣ إضافة الأسرار إلى GitHub

1. انتقل إلى: **Settings → Secrets and variables → Actions**
2. اضغط **New repository secret** وأضف كل سر:

| اسم السر | القيمة | مثال |
|---------|---------|-------|
| `ANDROID_KEYSTORE_BASE64` | محتوى `keystore.b64` كاملاً (سطر واحد) | `MIIFDwIBADANBgkqhk...` |
| `ANDROID_KEYSTORE_PASSWORD` | كلمة مرور Keystore | `mySecurePassword123` |
| `ANDROID_KEY_ALIAS` | الاسم المستعار للمفتاح (عادة `release-key`) | `release-key` |
| `ANDROID_KEY_PASSWORD` | كلمة مرور المفتاح | `keyPassword456` |

> 💡 **نصيحة:** اتركها كنسخة احتياطية آمنة في مكان محمي (مثل مدير كلمات المرور).

---

## 4️⃣ اختبار الإعداد

لاختبار إذا تم إدخال جميع الأسرار بشكل صحيح:

1. اذهب إلى: **Actions → Build Android AAB**
2. اضغط **Run workflow**
3. اترك `version_name` و `version_code` فارغة للآن
4. اضغط **Run workflow**

إذا كان كل شيء صحيحاً ستظهر رسالة نجاح بعد ~8 دقائق.

---

## 🐛 استكشاف الأخطاء الشائعة

### ❌ "Missing secret ANDROID_KEYSTORE_BASE64"
**السبب:** لم تضف السر في GitHub Settings
**الحل:** تأكد من إضافة جميع الأسرار الأربعة في:
`Settings → Secrets and variables → Actions`

### ❌ "Keystore password OR alias is wrong"
**السبب:** البيانات في الأسرار غير متطابقة مع Keystore الفعلي
**الحل:** تحقق من:
- `ANDROID_KEYSTORE_PASSWORD` - كلمة مرور الـ store
- `ANDROID_KEY_ALIAS` - يجب أن يطابق ما في الـ keystore
- `ANDROID_KEY_PASSWORD` - كلمة مرور المفتاح المحدد

### ❌ "Decoded keystore too small"
**السبب:** Base64 لم يتم تحويله بشكل صحيح أو ملف keystore تالف
**الحل:** أعد تحويل الـ keystore:
```bash
base64 -i release.keystore | wc -c  # تحقق أنه أكثر من 2000 حرف
```

### ❌ "Could not find 'android {' block in build.gradle"
**السبب:** تنسيق `android/app/build.gradle` غير متوقع
**الحل:** تحقق من أن الملف يحتوي على `android { ... }` block

---

## 🔄 التحديثات المستقبلية

### تحديث رقم الإصدار تلقائياً

عند تشغيل الـ workflow:
- أدخل **version_name** مثل: `1.5.0`
- أدخل **version_code** مثل: `15`
- فعّل **commit_version_bump** لحفظ التحديث تلقائياً

يتم تحديث الملفات التالية تلقائياً:
- `capacitor.config.ts`
- `src/lib/appVersion.ts`
- `android/app/build.gradle`

---

## 📦 استخراج الـ AAB

بعد اكتمال البناء:
1. اذهب إلى: **Actions → آخر تشغيل ناجح**
2. في قسم **Artifacts** ستجد ملف AAB باسم:
   ```
   tipstricks-v1.5.0-vc15-a1b2c3d.aab
   ```
3. حمّله وارفعه إلى **Google Play Console**

---

## 🔒 أفضل الممارسات الأمنية

✅ **افعل:**
- احفظ Keystore في مكان آمن جداً (disk مشفّرة أو safe)
- استخدم كلمات مرور قوية (20+ حرف بأحرف وأرقام و رموز)
- لا تشارك Keystore أو كلمات المرور مع أحد

❌ **لا تفعل:**
- لا تضع Keystore أو كلمات المرور في الكود
- لا تشارك Base64 الـ keystore على الإنترنت
- لا تستخدم نفس Keystore لتطبيقات مختلفة (إلا إذا كانت بنفس الشركة)

---

## 📞 الدعم

إذا واجهت مشكلة:
1. تحقق من جميع الأسرار الأربعة موجودة و صحيحة
2. تأكد من أن Java و keytool مثبتة
3. جرّب اختبار Keystore محلياً أولاً بهذا الأمر:
   ```bash
   keytool -list -keystore release.keystore -storepass YOUR_PASSWORD
   ```
4. افتح issue في المستودع بالتفاصيل الدقيقة

---

**آخر تحديث:** 2026-05-13
**الإصدار:** 1.0.0
