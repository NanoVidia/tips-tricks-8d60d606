// Anonymous device identity + cached purchase tokens.
// Used to bind a Google Play purchase to the device when no user account exists.

const DEVICE_KEY = "obgyn_device_id";
const TOKENS_KEY = "obgyn_purchase_tokens"; // JSON: { productId: purchaseToken }

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function rememberPurchaseToken(productId: string, purchaseToken: string) {
  try {
    const cur = JSON.parse(localStorage.getItem(TOKENS_KEY) ?? "{}");
    cur[productId] = purchaseToken;
    localStorage.setItem(TOKENS_KEY, JSON.stringify(cur));
  } catch {
    localStorage.setItem(TOKENS_KEY, JSON.stringify({ [productId]: purchaseToken }));
  }
}

export function getRememberedTokens(): Array<{ productId: string; purchaseToken: string }> {
  try {
    const cur = JSON.parse(localStorage.getItem(TOKENS_KEY) ?? "{}");
    return Object.entries(cur).map(([productId, purchaseToken]) => ({
      productId,
      purchaseToken: String(purchaseToken),
    }));
  } catch {
    return [];
  }
}

export function clearRememberedTokens() {
  localStorage.removeItem(TOKENS_KEY);
}

/** Opens the Google Play subscription management page for this app. */
export function openManageSubscription(productId?: string) {
  const pkg = "app.lovable.tipstricks";
  const url = productId
    ? `https://play.google.com/store/account/subscriptions?sku=${productId}&package=${pkg}`
    : `https://play.google.com/store/account/subscriptions?package=${pkg}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
