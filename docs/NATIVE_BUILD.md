# Native Build Checklist — v5

دليل خطوات Android الأصلية التي يجب تنفيذها على جهازك بعد `git pull` و `npx cap add android`.
هذه الملفات لا تعيش في مستودع Lovable — يجب إضافتها يدوياً مرة واحدة.

## 1. تثبيت ومزامنة

```bash
npm install
npm run build
npx cap add android      # أول مرة فقط
npx cap sync android     # كل مرة بعد تغيير الحزم
```

## 2. أيقونة الإشعار `ic_stat_icon` (إلزامي وإلا الإشعارات لن تظهر)

أنشئ PNG أبيض شفاف فقط (silhouette) من أيقونة التطبيق ثم ضعه بهذه الأحجام:

```text
android/app/src/main/res/drawable-mdpi/ic_stat_icon.png       (24×24)
android/app/src/main/res/drawable-hdpi/ic_stat_icon.png       (36×36)
android/app/src/main/res/drawable-xhdpi/ic_stat_icon.png      (48×48)
android/app/src/main/res/drawable-xxhdpi/ic_stat_icon.png     (72×72)
android/app/src/main/res/drawable-xxxhdpi/ic_stat_icon.png    (96×96)
```

أبسط طريقة: استخدم Android Studio → Image Asset → Notification Icons → استورد PNG أبيض شفاف.

## 3. أيقونة التطبيق + adaptive icon

```bash
npm i -D @capacitor/assets
mkdir resources
# ضع icon.png بحجم 1024×1024 (شفافية اختيارية للمقدمة)
npx capacitor-assets generate --android --iconBackgroundColor "#ffffff"
```

## 4. AndroidManifest.xml — تعديلات إلزامية

افتح `android/app/src/main/AndroidManifest.xml`:

### 4.1 منع نسخ بيانات التجربة احتياطياً
على وسم `<application>`:
```xml
android:allowBackup="false"
android:dataExtractionRules="@xml/data_extraction_rules"
android:fullBackupContent="false"
```

### 4.2 إذن إبقاء الإشعارات بعد إعادة التشغيل
```xml
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>
<uses-permission android:name="android.permission.USE_EXACT_ALARM"/>
```

## 5. Target SDK 35 (إلزامي للرفع على Google Play)

في `android/variables.gradle` تأكد:
```gradle
ext {
    minSdkVersion = 23
    compileSdkVersion = 35
    targetSdkVersion = 35
    androidxActivityVersion = '1.9.2'
    androidxAppCompatVersion = '1.7.0'
    androidxCoordinatorLayoutVersion = '1.2.0'
    androidxCoreVersion = '1.13.1'
    androidxFragmentVersion = '1.8.2'
    coreSplashScreenVersion = '1.0.1'
    androidxWebkitVersion = '1.11.0'
    junitVersion = '4.13.2'
    androidxJunitVersion = '1.2.1'
    androidxEspressoCoreVersion = '3.6.1'
    cordovaAndroidVersion = '10.1.1'
}
```

## 6. ProGuard rules لحماية cordova-plugin-purchase من R8

أنشئ `android/app/proguard-rules.pro` وأضف:
```
-keep class com.android.billingclient.** { *; }
-keep class com.google.android.gms.** { *; }
-keep class com.cordova.plugin.purchase.** { *; }
-keep class com.izettle.html2bitmap.** { *; }
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
```

ثم في `android/app/build.gradle` فعّل minify مع القواعد:
```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

## 7. توقيع AAB

استخدم صفحة `/keystore-setup` في التطبيق لإنشاء keystore أو استخدم keystore موجود.
ضع المعلومات في `android/keystore.properties` (لا ترفعه إلى git):
```
storeFile=../../my-release-key.jks
storePassword=...
keyAlias=...
keyPassword=...
```

ثم في `android/app/build.gradle`:
```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('keystore.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            // minifyEnabled + proguard من الخطوة 6
        }
    }
}
```

## 8. بناء AAB

```bash
cd android
./gradlew bundleRelease
# الناتج: android/app/build/outputs/bundle/release/app-release.aab
```

## 9. Play Console

- ارفع `app-release.aab` كـ Internal Testing أولاً
- أضف Tester بحسابه على Play Store
- أنشئ المنتجات: `tt_monthly`, `tt_yearly`, `tt_lifetime` بنفس الـ IDs المستخدمة في الكود
- فعّل التجربة المجانية 7 أيام داخل Subscription offers
- في **Monetization → Real-time developer notifications**: أنشئ Pub/Sub topic واربطه بـ:
  `https://hebhetjvcauitozkxggt.supabase.co/functions/v1/play-rtdn-webhook`
- املأ **Data Safety form** و **Privacy Policy URL**: `https://tips-tricks.lovable.app/privacy`

## 10. اختبار الرحلة الكاملة

على جهاز حقيقي بحساب Tester:
1. تثبيت AAB من Internal Testing
2. فتح التطبيق → استخدام أي أداة (يجب أن تعمل لأن في فترة التجربة)
3. الانتظار 7 أيام (أو تعديل `obgyn_trial_started_at` في WebView devtools للتسريع)
4. ظهور Paywall تلقائياً → اختيار خطة → ورقة Google Play تفتح
5. الدفع بحساب Tester (لا خصم حقيقي)
6. التحقق من جدول `subscriptions` على Supabase أن الصف أُنشئ بـ `status: active`
7. إلغاء الاشتراك من Play Store → التحقق أن RTDN webhook حدّث `status: cancelled`

تم.

---

## 11. إلغاء سبلاش Android الافتراضية (Android 12+)

النظام يفرض شاشة افتتاح دنيا، لكن يمكن جعلها **فورية بلا وميض** بحيث ينتقل المستخدم مباشرة لواجهة التطبيق.

### `android/app/src/main/res/values/styles.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
  <style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar"/>

  <!-- Launch theme: لا أيقونة متحركة، لا تأخير، خلفية بيضاء = خلفية التطبيق -->
  <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
    <item name="windowSplashScreenBackground">@android:color/white</item>
    <item name="windowSplashScreenAnimationDuration">0</item>
    <item name="windowSplashScreenAnimatedIcon">@null</item>
    <item name="postSplashScreenTheme">@style/AppTheme</item>
  </style>
</resources>
```

> **ملاحظة**: على Android 11 وأقدم، Theme.SplashScreen compat library تعرض الـ `windowBackground` فقط — لا حاجة لإجراء إضافي.

### `android/app/src/main/res/values-night/styles.xml` (لو موجودة)
كرّر نفس البلوك مع `windowSplashScreenBackground=@android:color/black` لو الـ dark mode مفعّل.

### تأكيد عدم تثبيت Capacitor SplashScreen plugin
```bash
grep splash-screen package.json
# يجب ألا يُرجع شيئاً
```

---

## 12. اختبار الإشعارات على الجهاز (4 خطوات)

1. **افتح التطبيق لأول مرة** → يطلب إذن POST_NOTIFICATIONS (Android 13+) → اقبل.
2. **Menu → Notifications → اضغط "إرسال إشعار اختباري"** → يجب أن يظهر إشعار بعنوان "Tips & Tricks" خلال 5 ثوانٍ مع أيقونة `ic_stat_icon` (ليست مربعاً أبيض).
3. **اسحب لأسفل من شريط الإشعارات** → انقر الإشعار → التطبيق يفتح بدون كراش.
4. **محاكاة تذكير التجربة**: في DevTools console:
   ```js
   localStorage.setItem('obgyn_trial_started_at', String(Date.now() - 5*86400000));
   localStorage.removeItem('obgyn_trial_notif_scheduled_for');
   location.reload();
   ```
   إشعار "بقي يوم واحد…" يُجدوَل تلقائياً. عند النقر عليه → يفتح التطبيق على `/?paywall=1` ويظهر Paywall فوراً.

### إذا لم يظهر أي إشعار
- تأكد أن `ic_stat_icon.png` موجود في كل `drawable-*` (راجع القسم 2).
- في إعدادات التطبيق → Notifications → تأكد أن قناة "Daily Tips & Reminders" مفعّلة.
- على Xiaomi/Huawei: أضف التطبيق لقائمة "Autostart" و "Battery optimization → Don't optimize".
