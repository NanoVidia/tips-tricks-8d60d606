#!/usr/bin/env bash
# ==============================================================================
# رفع أسرار GitHub تلقائياً من ملف .keystore.env المحلّي
# ==============================================================================
# لا يمكن لأي سكربت رفع أسرار GitHub بدون مصادقة (هذه قاعدة أمنية من GitHub).
# هذا السكربت يستخدم GitHub CLI (`gh`) — يجب تسجيل الدخول لمرة واحدة فقط.
#
# الاستخدام:
#   bash scripts/setup-github-secrets.sh
#
# الأسرار التي تُرفع:
#   ANDROID_KEYSTORE_BASE64   ← من ملف KS_PATH (تشفير base64 تلقائي)
#   ANDROID_KEYSTORE_PASSWORD ← KS_PASS
#   ANDROID_KEY_ALIAS         ← KEY_ALIAS
#   ANDROID_KEY_PASSWORD      ← KEY_PASS
# ==============================================================================
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

B="\033[1m"; G="\033[32m"; Y="\033[33m"; R="\033[31m"; C="\033[36m"; N="\033[0m"
say()  { echo -e "${C}▶${N} $*"; }
ok()   { echo -e "${G}✓${N} $*"; }
warn() { echo -e "${Y}⚠${N} $*"; }
die()  { echo -e "${R}✗ $*${N}" >&2; exit 1; }

# ── فحص gh CLI ──────────────────────────────────────────────────────────────
if ! command -v gh >/dev/null; then
  cat >&2 <<EOF
${R}✗ GitHub CLI (gh) غير مثبّت.${N}

ثبّته من: https://cli.github.com/
  • macOS:   brew install gh
  • Ubuntu:  sudo apt install gh
  • Windows: winget install --id GitHub.cli

ثم سجّل الدخول مرّة واحدة:
  gh auth login
EOF
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  warn "غير مسجّل الدخول إلى GitHub CLI."
  say "تشغيل: gh auth login"
  gh auth login || die "فشل تسجيل الدخول"
fi

# ── تحميل ملف الإعدادات ────────────────────────────────────────────────────
CONFIG_FILE="${KEYSTORE_ENV:-.keystore.env}"
[ -f "$CONFIG_FILE" ] || die "$CONFIG_FILE غير موجود. شغّل أولاً: bash scripts/build-aab-interactive.sh لإنشائه."
set -a; . "$CONFIG_FILE"; set +a

[ -n "${KS_PATH:-}" ]   || die "KS_PATH غير معرّف في $CONFIG_FILE"
[ -n "${KS_PASS:-}" ]   || die "KS_PASS غير معرّف"
[ -n "${KEY_ALIAS:-}" ] || die "KEY_ALIAS غير معرّف"
[ -n "${KEY_PASS:-}" ]  || die "KEY_PASS غير معرّف"
[ -f "$KS_PATH" ]       || die "ملف الـ keystore غير موجود: $KS_PATH"

# ── تحديد المستودع ─────────────────────────────────────────────────────────
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)
if [ -z "$REPO" ]; then
  read -r -p "أدخل المستودع (owner/repo): " REPO
fi
ok "المستودع: $REPO"

# ── ترميز الـ keystore إلى base64 ──────────────────────────────────────────
say "ترميز الـ keystore إلى base64…"
if command -v base64 >/dev/null; then
  if base64 --help 2>&1 | grep -q -- '-w'; then
    KS_B64=$(base64 -w0 "$KS_PATH")        # GNU
  else
    KS_B64=$(base64 -i "$KS_PATH" | tr -d '\n')  # macOS/BSD
  fi
else
  die "base64 غير موجود"
fi
ok "حجم base64: ${#KS_B64} حرف"

# ── رفع الأسرار ────────────────────────────────────────────────────────────
say "رفع الأسرار إلى $REPO…"
printf '%s' "$KS_B64"     | gh secret set ANDROID_KEYSTORE_BASE64    --repo "$REPO" --body -
printf '%s' "$KS_PASS"    | gh secret set ANDROID_KEYSTORE_PASSWORD  --repo "$REPO" --body -
printf '%s' "$KEY_ALIAS"  | gh secret set ANDROID_KEY_ALIAS          --repo "$REPO" --body -
printf '%s' "$KEY_PASS"   | gh secret set ANDROID_KEY_PASSWORD       --repo "$REPO" --body -
ok "تم رفع الأسرار الأربعة"

# ── عرض الأسرار الموجودة ───────────────────────────────────────────────────
echo
echo -e "${B}── الأسرار في $REPO ──${N}"
gh secret list --repo "$REPO" | grep -E "^ANDROID_" || true

cat <<EOF

${G}✅ تم بنجاح!${N}

الخطوة التالية:
  1) افتح: https://github.com/$REPO/actions
  2) شغّل workflow: ${B}Build Android AAB${N}
  3) حمّل ${B}app-release-aab${N} من Artifacts بعد ~8 دقائق
EOF
