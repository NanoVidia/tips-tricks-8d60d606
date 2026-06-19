import { BillingInvoice } from "@/components/kindergarten/BillingInvoice";
import { getKindergartenLocale } from "@/lib/kindergarten/types";

export default function BillingManagement() {
  const locale = getKindergartenLocale();

  return (
    <main dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-background px-5 py-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-3xl font-bold">{locale === "ar" ? "إدارة الرسوم والمالية" : "Billing Management"}</h1>
        <BillingInvoice />
      </div>
    </main>
  );
}
