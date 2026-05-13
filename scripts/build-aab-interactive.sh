#!/usr/bin/env bash
# ==============================================================================
# Tips & Tricks — Interactive Local AAB Builder
# ==============================================================================
# سكربت تفاعلي يبني ملف AAB موقّع وجاهز للرفع على Google Play.
# يسألك عن مسار الـ keystore وكلمات المرور والـ alias، ثم يقوم بكل شيء تلقائياً.
#
# المتطلبات (تثبيت لمرة واحدة على جهازك):
#   - Node.js 20+         → https://nodejs.org
#   - Java JDK 21         → https://adoptium.net
#   - Android SDK 35      → عبر Android Studio أو cmdline-tools
#   - ملف release.keystore جاهز (إن لم يكن لديك، شغّل: keytool -genkey ...)
#
# الاستخدام:
#   bash scripts/build-aab-interactive.sh
#
# الإخراج:
#   android/app/build/outputs/bundle/release/app-release.aab
#   نسخة مؤرّخة في: dist-aab/app-release-<version>-<timestamp>.aab
# ==============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# ── ألوان للطباعة ────────────────────────────────────────────────────────────
B="\033[1m"; G="\033[32m"; Y="\033[33m"; R="\033[31m"; C="\033[36m"; N="\033[0m"

say()  { echo -e "${C}▶${N} $*"; }
ok()   { echo -e "${G}✓${N} $*"; }
warn() { echo -e "${Y}⚠${N} $*"; }
die()  { echo -e "${R}✗ $*${N}" >&2; exit 1; }
hr()   { echo -e "${B}────────────────────────────────────────────────────────${N}"; }

# ── 0. التحقق من المتطلبات ──────────────────────────────────────────────────
hr; say "0/9  فحص المتطلبات…"
command -v node    >/dev/null || die "Node.js غير مثبّت — ثبّته من https://nodejs.org"
command -v npm     >/dev/null || die "npm غير موجود"
command -v java    >/dev/null || die "Java JDK غير مثبّت — ثبّت Temurin 21"
command -v keytool >/dev/null || die "keytool غير موجود (يأتي مع JDK)"
command -v jarsigner >/dev/null || die "jarsigner غير موجود (يأتي مع JDK)"
NODE_V=$(node -v); JAVA_V=$(java -version 2>&1 | head -n1)
ok "Node: $NODE_V"
ok "Java: $JAVA_V"

# ── 1. طلب بيانات الـ keystore ──────────────────────────────────────────────
hr; say "1/9  بيانات الـ keystore"
DEFAULT_KS="release.keystore"
[ -f "android/app/release.keystore" ] && DEFAULT_KS="android/app/release.keystore"

read -r -p "  مسار ملف الـ keystore [${DEFAULT_KS}]: " KS_PATH
KS_PATH="${KS_PATH:-$DEFAULT_KS}"
[ -f "$KS_PATH" ] || die "الملف غير موجود: $KS_PATH"
KS_ABS="$(cd "$(dirname "$KS_PATH")" && pwd)/$(basename "$KS_PATH")"
ok "Keystore: $KS_ABS"

read -r -s -p "  كلمة سر الـ keystore (store password): " KS_PASS; echo
[ -n "$KS_PASS" ] || die "كلمة السر فارغة"

read -r -p "  اسم الـ alias: " KEY_ALIAS
[ -n "$KEY_ALIAS" ] || die "الـ alias فارغ"

read -r -s -p "  كلمة سر الـ key (اضغط Enter لاستخدام نفس كلمة سر الـ keystore): " KEY_PASS; echo
KEY_PASS="${KEY_PASS:-$KS_PASS}"

# تحقّق فوري قبل أي بناء
say "  التحقق من الـ keystore…"
keytool -list -keystore "$KS_ABS" -storepass "$KS_PASS" -alias "$KEY_ALIAS" >/dev/null 2>&1 \
  || die "كلمة السر أو الـ alias خطأ. شغّل: keytool -list -keystore \"$KS_ABS\" -v"
ok "بيانات الـ keystore صحيحة"

export KS_PASS KEY_ALIAS KEY_PASS

# ── 2. تثبيت الاعتماديات ────────────────────────────────────────────────────
hr; say "2/9  تثبيت اعتماديات npm…"
npm ci --no-audit --no-fund || npm install --no-audit --no-fund
ok "تم التثبيت"

# ── 3. بناء الويب ───────────────────────────────────────────────────────────
hr; say "3/9  بناء تطبيق الويب (production)…"
CAP_ENV=production NODE_ENV=production npm run build
ok "تم بناء dist/"

# ── 4. إعداد Android + cap sync ─────────────────────────────────────────────
hr; say "4/9  مزامنة Capacitor مع Android…"
if [ ! -d "android" ]; then
  npx cap add android
fi
CAP_ENV=production npx cap sync android
ok "تم cap sync"

# ── 5. أيقونات وسبلاش (اختياري) ─────────────────────────────────────────────
hr; say "5/9  توليد الأيقونات والسبلاش…"
if [ -f "resources/icon.png" ] && [ -f "resources/splash.png" ]; then
  npx --yes @capacitor/assets generate --android || warn "فشل توليد الأصول — تخطٍّ"
else
  warn "resources/icon.png أو resources/splash.png غير موجود — تخطّي"
fi

# ── 6. ضبط versionCode / versionName ───────────────────────────────────────
hr; say "6/9  ضبط الإصدار من capacitor.config.ts…"
VERSION_NAME=$(grep -oE 'APP_VERSION_NAME = "[^"]+"' capacitor.config.ts | sed -E 's/.*"([^"]+)".*/\1/')
VERSION_CODE=$(grep -oE 'APP_VERSION_CODE = [0-9]+' capacitor.config.ts | grep -oE '[0-9]+')
[ -n "$VERSION_NAME" ] && [ -n "$VERSION_CODE" ] || die "تعذّر قراءة الإصدار"
SED_INPLACE=(-i); sed --version >/dev/null 2>&1 || SED_INPLACE=(-i '')
sed "${SED_INPLACE[@]}" -E "s/versionCode [0-9]+/versionCode ${VERSION_CODE}/" android/app/build.gradle
sed "${SED_INPLACE[@]}" -E "s/versionName \"[^\"]+\"/versionName \"${VERSION_NAME}\"/" android/app/build.gradle
ok "versionName=$VERSION_NAME  versionCode=$VERSION_CODE"

# ── 7. صلاحيات + نسخ الـ keystore + حقن signingConfig ──────────────────────
hr; say "7/9  صلاحيات Android + إعداد التوقيع…"
MANIFEST="android/app/src/main/AndroidManifest.xml"
add_perm() {
  local p="$1"
  if ! grep -q "$p" "$MANIFEST"; then
    sed "${SED_INPLACE[@]}" "s|<application|<uses-permission android:name=\"$p\" />\n    <application|" "$MANIFEST"
    ok "  + $p"
  fi
}
add_perm "android.permission.INTERNET"
add_perm "android.permission.POST_NOTIFICATIONS"
add_perm "com.android.vending.BILLING"

cp "$KS_ABS" android/app/release.keystore
ok "تم نسخ الـ keystore إلى android/app/release.keystore"

GRADLE_FILE="android/app/build.gradle"
if ! grep -q "signingConfigs" "$GRADLE_FILE"; then
  python3 - <<'PY'
import re
path = "android/app/build.gradle"
content = open(path).read()
signing_block = '''    signingConfigs {
        release {
            storeFile file("release.keystore")
            storePassword System.getenv("KS_PASS")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASS")
        }
    }
'''
new, n = re.subn(r'(android\s*\{\r?\n)', r'\1' + signing_block, content, count=1)
if n == 0:
    raise SystemExit("لم أجد بلوك android { في build.gradle")
content = new
new, n = re.subn(
    r'(buildTypes\s*\{\s*\r?\n\s*release\s*\{\s*\r?\n)',
    r'\1            signingConfig signingConfigs.release\n',
    content, count=1,
)
if n == 0:
    new = re.sub(r'(release\s*\{)', r'\1\n            signingConfig signingConfigs.release', content, count=1)
open(path, "w").write(new)
print("  ✓ تم حقن signingConfigs")
PY
else
  ok "signingConfigs موجود مسبقاً"
fi

# ── 8. بناء الـ AAB ─────────────────────────────────────────────────────────
hr; say "8/9  بناء الـ AAB الموقّع (قد يأخذ 5-10 دقائق)…"
(
  cd android
  chmod +x gradlew
  ./gradlew bundleRelease --no-daemon --stacktrace
)

AAB="android/app/build/outputs/bundle/release/app-release.aab"
[ -f "$AAB" ] || die "لم يتم إنشاء ملف AAB"
SIZE=$(stat -c%s "$AAB" 2>/dev/null || stat -f%z "$AAB")
ok "تم البناء — الحجم: $SIZE bytes"

# ── 9. التحقق من التوقيع + نسخ الإخراج ─────────────────────────────────────
hr; say "9/9  التحقق من التوقيع…"
jarsigner -verify -strict "$AAB" >/tmp/jarsigner.log 2>&1 \
  || { cat /tmp/jarsigner.log; die "فشل التحقق من توقيع الـ AAB"; }
ok "jarsigner: التوقيع صحيح"

echo -e "${B}── بصمة الشهادة ──${N}"
keytool -printcert -jarfile "$AAB" 2>/dev/null | grep -E "SHA(1|256):" || true

mkdir -p dist-aab
TS=$(date +%Y%m%d-%H%M%S)
OUT="dist-aab/app-release-v${VERSION_NAME}-${VERSION_CODE}-${TS}.aab"
cp "$AAB" "$OUT"

hr
echo -e "${G}${B}✅ تم بنجاح!${N}"
echo
echo -e "  📦 الملف الأصلي : ${B}$AAB${N}"
echo -e "  📦 نسخة مؤرّخة  : ${B}$OUT${N}"
echo
echo -e "  ارفع الملف إلى Google Play Console:"
echo -e "    Production / Internal Testing → ${B}Create new release${N} → Upload"
hr
