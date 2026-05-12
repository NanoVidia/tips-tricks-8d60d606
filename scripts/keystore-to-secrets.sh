#!/usr/bin/env bash
# ==============================================================================
# keystore-to-secrets.sh
# ------------------------------------------------------------------------------
# يحوّل ملف release.keystore إلى Base64 ويولّد ملفاً جاهزاً للنسخ إلى
# GitHub Secrets (Settings → Secrets and variables → Actions).
#
# طريقة الاستخدام:
#   bash scripts/keystore-to-secrets.sh [مسار_الـkeystore] [الـalias]
#
# أمثلة:
#   bash scripts/keystore-to-secrets.sh
#   bash scripts/keystore-to-secrets.sh ~/Downloads/release.keystore tipstricks
#
# المخرجات (داخل مجلد ./keystore-secrets/):
#   - keystore.b64.txt   ← قيمة ANDROID_KEYSTORE_BASE64 (سطر واحد طويل)
#   - SECRETS.txt        ← ملخّص جاهز يحتوي القيم الأربع لإضافتها في GitHub
# ==============================================================================
set -euo pipefail

KEYSTORE="${1:-release.keystore}"
ALIAS="${2:-tipstricks}"
OUT_DIR="keystore-secrets"

# ---- 1) التحقق من وجود الملف ----
if [ ! -f "$KEYSTORE" ]; then
  echo "❌ الملف غير موجود: $KEYSTORE"
  echo ""
  echo "الاستخدام:"
  echo "  bash scripts/keystore-to-secrets.sh [مسار_الـkeystore] [الـalias]"
  exit 1
fi

mkdir -p "$OUT_DIR"

# ---- 2) تحويل إلى Base64 (سطر واحد، متوافق مع Linux/Mac/Windows-Git-Bash) ----
echo "🔐  تحويل الـ keystore إلى Base64..."
if base64 --help 2>&1 | grep -q -- '-w'; then
  # GNU base64 (Linux)
  base64 -w0 "$KEYSTORE" > "$OUT_DIR/keystore.b64.txt"
else
  # BSD base64 (macOS) — يُنتج سطراً واحداً افتراضياً
  base64 -i "$KEYSTORE" | tr -d '\n' > "$OUT_DIR/keystore.b64.txt"
fi

SIZE=$(wc -c < "$KEYSTORE" | tr -d ' ')
B64_SIZE=$(wc -c < "$OUT_DIR/keystore.b64.txt" | tr -d ' ')

# ---- 3) طلب كلمات المرور من المستخدم (لا تُخزَّن إلا في الملف الناتج) ----
echo ""
echo "📝  أدخل كلمات المرور التي استخدمتها عند إنشاء الـ keystore:"
echo "    (لن تظهر أثناء الكتابة)"
echo ""
read -s -p "    Store password: " STORE_PASS; echo
read -s -p "    Key password (اضغط Enter إذا كانت نفس Store password): " KEY_PASS; echo
KEY_PASS="${KEY_PASS:-$STORE_PASS}"

# ---- 4) كتابة ملف SECRETS.txt الجاهز ----
cat > "$OUT_DIR/SECRETS.txt" <<EOF
============================================================
🔐 GitHub Secrets — جاهزة للنسخ
   اذهب إلى: Settings → Secrets and variables → Actions
   ثم: New repository secret  (لكل واحدة من الأربع)
============================================================

[1] الاسم: ANDROID_KEYSTORE_BASE64
    القيمة: انسخ كامل محتوى الملف:
            $OUT_DIR/keystore.b64.txt
            (سطر واحد طويل — $B64_SIZE حرف)

[2] الاسم: ANDROID_KEYSTORE_PASSWORD
    القيمة: $STORE_PASS

[3] الاسم: ANDROID_KEY_ALIAS
    القيمة: $ALIAS

[4] الاسم: ANDROID_KEY_PASSWORD
    القيمة: $KEY_PASS

============================================================
ℹ️  معلومات الـ keystore:
   - المسار:        $KEYSTORE
   - الحجم الأصلي:  $SIZE bytes
   - حجم Base64:    $B64_SIZE chars
============================================================

⚠️  بعد إضافة الـ Secrets الأربعة في GitHub:
   1) احذف مجلد "$OUT_DIR" من جهازك (يحتوي كلمات مرور).
   2) احفظ ملف release.keystore الأصلي في مكان آمن للأبد
      (مثلاً Google Drive مشفر) — إذا فُقد لن تستطيع
      تحديث التطبيق على Google Play أبداً.
   3) شغّل workflow "Build Android AAB" من تبويب Actions.
============================================================
EOF

# ---- 5) ملخّص ----
echo ""
echo "✅  تم بنجاح!"
echo ""
echo "    📂 المجلد:  $OUT_DIR/"
echo "       ├── keystore.b64.txt   (انسخ محتواه إلى ANDROID_KEYSTORE_BASE64)"
echo "       └── SECRETS.txt        (يحتوي القيم الأربع جاهزة)"
echo ""
echo "    📖 افتح الآن:  $OUT_DIR/SECRETS.txt"
echo ""
echo "⚠️  لا تُشارك هذه الملفات مع أحد، واحذف المجلد بعد إضافة الـ Secrets."
