// Subscription plans — kept in sync with `app_settings.billing_plans` in the DB.
// These are the local fallbacks used when the DB is unreachable, and also the
// source of truth for Google Play product IDs.

export const TRIAL_DAYS = 7;

export type PlanId = "monthly" | "yearly" | "lifetime";

export interface Plan {
  id: PlanId;
  productId: string;        // Google Play SKU
  price: number;            // USD
  labelEn: string;
  labelAr: string;
  per: string;              // /mo, /yr, one-time
  badge?: string;           // e.g. "Save 48%"
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "monthly",
    productId: "obgyn_monthly",
    price: 3.99,
    labelEn: "Monthly",
    labelAr: "شهري",
    per: "/mo",
  },
  {
    id: "yearly",
    productId: "obgyn_yearly",
    price: 24.99,
    labelEn: "Yearly",
    labelAr: "سنوي",
    per: "/yr",
    badge: "Save 48%",
    highlight: true,
  },
  {
    id: "lifetime",
    productId: "obgyn_lifetime",
    price: 59.99,
    labelEn: "Lifetime",
    labelAr: "مدى الحياة",
    per: "one-time",
  },
];

// Features that remain FREE forever — never gated.
export const FREE_FEATURES = ["case_of_the_day", "ai_assistant"] as const;

// Features locked behind the paywall after the 7-day trial.
export const LOCKED_FEATURES = [
  "mcq_bank",
  "exams",
  "scenarios",
  "surgery_library",
  "tools",
  "calculators",
  "daily_mcq",
] as const;

export type FreeFeature = (typeof FREE_FEATURES)[number];
export type LockedFeature = (typeof LOCKED_FEATURES)[number];
