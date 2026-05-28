import { HealthTracker } from "@/components/kindergarten/HealthTracker";
import { getKindergartenLocale } from "@/lib/kindergarten/types";

export default function HealthNutrition() {
  const locale = getKindergartenLocale();

  return (
    <main dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-background px-5 py-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-3xl font-bold">{locale === "ar" ? "إدارة الصحة والوجبات" : "Health & Nutrition"}</h1>
        <HealthTracker />
      </div>
    </main>
  );
}
