#!/usr/bin/env bash
set -euo pipefail

KS_PATH="${1:-}"
STORE_PASS="${2:-}"
KEY_ALIAS="${3:-}"
KEY_PASS="${4:-}"

fail() {
  printf 'ERROR_CODE=%s\n' "$1"
  printf 'ERROR_MESSAGE=%s\n' "$2"
  exit 1
}

[ -n "$KS_PATH" ] || fail "MISSING_KEYSTORE_PATH" "لم يتم تمرير مسار ملف keystore."
[ -n "$STORE_PASS" ] || fail "MISSING_STORE_PASSWORD" "قيمة كلمة مرور keystore فارغة."
[ -n "$KEY_ALIAS" ] || fail "MISSING_KEY_ALIAS" "قيمة alias فارغة."
[ -n "$KEY_PASS" ] || fail "MISSING_KEY_PASSWORD" "قيمة كلمة مرور المفتاح فارغة."
[ -f "$KS_PATH" ] || fail "KEYSTORE_NOT_FOUND" "ملف keystore غير موجود على القرص."

command -v keytool >/dev/null || fail "KEYTOOL_MISSING" "أداة keytool غير متوفرة في البيئة."
command -v jarsigner >/dev/null || fail "JARSIGNER_MISSING" "أداة jarsigner غير متوفرة في البيئة."
command -v jar >/dev/null || fail "JAR_MISSING" "أداة jar غير متوفرة في البيئة."

SIZE=$(stat -c%s "$KS_PATH" 2>/dev/null || stat -f%z "$KS_PATH" 2>/dev/null || echo 0)
[ "$SIZE" -ge 1000 ] || fail "KEYSTORE_TOO_SMALL" "ملف keystore صغير جداً أو تالف بعد فك التشفير."

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

LIST_OUT="$TMP_DIR/keytool-list.out"
if ! keytool -list -keystore "$KS_PATH" -storepass "$STORE_PASS" >"$LIST_OUT" 2>&1; then
  if grep -qiE "password was incorrect|tampered with, or password was incorrect" "$LIST_OUT"; then
    fail "WRONG_STORE_PASSWORD" "كلمة مرور ANDROID_KEYSTORE_PASSWORD لا تطابق ملف keystore."
  fi

  fail "KEYSTORE_UNREADABLE" "تعذّر قراءة keystore بواسطة keytool."
fi

grep -qi "^${KEY_ALIAS}," "$LIST_OUT" || fail "ALIAS_NOT_FOUND" "الـ alias المطلوب غير موجود داخل keystore."

printf 'probe' > "$TMP_DIR/probe.txt"
jar --create --file "$TMP_DIR/probe.jar" -C "$TMP_DIR" probe.txt >/dev/null 2>&1 \
  || fail "PROBE_JAR_FAILED" "تعذّر إنشاء ملف probe للتحقق من صلاحية المفتاح."

SIGN_OUT="$TMP_DIR/jarsigner.out"
if ! jarsigner -keystore "$KS_PATH" -storepass "$STORE_PASS" -keypass "$KEY_PASS" "$TMP_DIR/probe.jar" "$KEY_ALIAS" >"$SIGN_OUT" 2>&1; then
  if grep -qiE "key associated with .* not a private key|Cannot recover key|password was incorrect|Given final block not properly padded|UnrecoverableKeyException|keystore password was incorrect" "$SIGN_OUT"; then
    fail "WRONG_KEY_PASSWORD" "كلمة مرور ANDROID_KEY_PASSWORD لا تطابق المفتاح داخل keystore."
  fi

  fail "KEY_SIGN_PROBE_FAILED" "تعذّر استخدام المفتاح الخاص من داخل keystore للتوقيع التجريبي."
fi

FINGERPRINT=$(keytool -list -v -keystore "$KS_PATH" -storepass "$STORE_PASS" -alias "$KEY_ALIAS" 2>/dev/null | awk -F'SHA256: ' '/SHA256:/ {print $2; exit}' | tr -d '\r')
[ -n "$FINGERPRINT" ] || fail "SHA256_READ_FAILED" "تعذّر استخراج بصمة SHA-256 من keystore."

printf 'KEYSTORE_SHA256=%s\n' "$FINGERPRINT"