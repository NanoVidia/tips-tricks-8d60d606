#!/usr/bin/env bash
# ==============================================================================
# 🔐 توليد keystore دائم ورفع الأسرار الأربعة تلقائياً إلى GitHub
# ------------------------------------------------------------------------------
# الاستخدام (مرة واحدة فقط):
#   1) ثبّت gh CLI:        https://cli.github.com/
#   2) سجّل دخول:           gh auth login
#   3) شغّل من جذر المشروع:  bash scripts/generate-and-upload-secrets.sh
#
# ما يفعله السكربت:
#   • يولّد keystore جديداً بصلاحية 30 سنة
#   • يرفعه + كلمات المرور كأسرار GitHub دائمة (4 أسرار)
#   • يحفظ نسخة احتياطية محلية في ./secrets-backup/ (لا تشاركها أبداً)
#   • بعدها كل تشغيل لـ Release سيستخدم نفس التوقيع — مناسب لـ Google Play
# ==============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."

# تحقق من المتطلبات
command -v gh      >/dev/null || { echo "❌ ثبّت gh CLI أولاً: https://cli.github.com/"; exit 1; }
command -v keytool >/dev/null || { echo "❌ keytool غير موجود — ثبّت Java JDK"; exit 1; }
command -v openssl >/dev/null || { echo "❌ openssl غير موجود"; exit 1; }
command -v base64  >/dev/null || { echo "❌ base64 غير موجود"; exit 1; }

# تحقق من تسجيل الدخول
gh auth status >/dev/null 2>&1 || { echo "❌ شغّل أولاً: gh auth login"; exit 1; }

# اكتشاف المستودع تلقائياً
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)
if [ -z "$REPO" ]; then
  echo "❌ لم يتم اكتشاف المستودع — شغّل من داخل مجلد git مرتبط بـ GitHub"
  exit 1
fi
echo "📦 المستودع: $REPO"

# تحذير في حال وجود أسرار سابقة
EXISTING=$(gh secret list --repo "$REPO" --json name -q '.[].name' | grep -E '^ANDROID_(KEYSTORE|KEY)' || true)
if [ -n "$EXISTING" ]; then
  echo ""
  echo "⚠️  توجد أسرار Android حالية في المستودع:"
  echo "$EXISTING" | sed 's/^/   • /'
  read -r -p "هل تريد استبدالها بـ keystore جديد؟ (سيُكسر التوقيع القديم) [y/N]: " ANS
  [[ "${ANS:-N}" =~ ^[Yy]$ ]] || { echo "ألغيت العملية."; exit 0; }
fi

# توليد kلمات مرور قوية
STORE_PASS=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-20)
KEY_PASS="$STORE_PASS"
ALIAS=tipstricks

mkdir -p secrets-backup
KS=secrets-backup/release.keystore
rm -f "$KS"

echo ""
echo "🔐 جاري توليد keystore جديد (صالح 30 سنة)..."
keytool -genkeypair -v \
  -keystore "$KS" \
  -alias "$ALIAS" \
  -storetype JKS \
  -keyalg RSA -keysize 2048 -validity 10950 \
  -storepass "$STORE_PASS" -keypass "$KEY_PASS" \
  -dname "CN=Tips and Tricks, OU=Mobile, O=Lovable App, L=NA, ST=NA, C=US" >/dev/null

KS_B64=$(base64 -w0 "$KS" 2>/dev/null || base64 "$KS" | tr -d '\n')

echo ""
echo "☁️  رفع الأسرار الأربعة إلى GitHub..."
echo "$KS_B64"     | gh secret set ANDROID_KEYSTORE_BASE64    --repo "$REPO" --body -
echo "$STORE_PASS" | gh secret set ANDROID_KEYSTORE_PASSWORD  --repo "$REPO" --body -
echo "$ALIAS"      | gh secret set ANDROID_KEY_ALIAS          --repo "$REPO" --body -
echo "$KEY_PASS"   | gh secret set ANDROID_KEY_PASSWORD       --repo "$REPO" --body -

# نسخة احتياطية محلية
cat > secrets-backup/SECRETS.txt <<EOF
════════════════════════════════════════════════════
🔐 Tips & Tricks — Android Signing Backup
════════════════════════════════════════════════════
احفظ هذا الملف في مكان آمن (1Password, Bitwarden, ...)
لا تضعه في git أبداً.
────────────────────────────────────────────────────
ANDROID_KEY_ALIAS         = ${ALIAS}
ANDROID_KEYSTORE_PASSWORD = ${STORE_PASS}
ANDROID_KEY_PASSWORD      = ${KEY_PASS}
ANDROID_KEYSTORE_BASE64   = (في الملف release.keystore)
────────────────────────────────────────────────────
المستودع: ${REPO}
التاريخ:  $(date -u +'%Y-%m-%d %H:%M UTC')
════════════════════════════════════════════════════
EOF

# منع رفع المجلد عن طريق الخطأ
grep -qxF 'secrets-backup/' .gitignore 2>/dev/null || echo 'secrets-backup/' >> .gitignore

echo ""
echo "✅ تم بنجاح!"
echo ""
echo "📋 النسخة الاحتياطية محفوظة في: secrets-backup/"
echo "   • release.keystore  ← احفظه في خزنة آمنة"
echo "   • SECRETS.txt       ← يحتوي كلمات المرور"
echo ""
echo "🚀 الآن شغّل Release من GitHub Actions — سيُبنى AAB موقّع تلقائياً"
echo "   كل البناءات القادمة ستستخدم نفس التوقيع (مناسب لـ Google Play)."
