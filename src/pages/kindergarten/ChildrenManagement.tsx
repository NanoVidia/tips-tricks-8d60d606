import { ChildCard } from "@/components/kindergarten/ChildCard";
import { getKindergartenLocale } from "@/lib/kindergarten/types";

export default function ChildrenManagement() {
  const locale = getKindergartenLocale();

  return (
    <main dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-background px-5 py-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <h1 className="text-3xl font-bold">{locale === "ar" ? "إدارة الأطفال" : "Children Management"}</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ChildCard name="آدم" age={4} guardianName="سارة" />
          <ChildCard name="ليان" age={5} guardianName="محمد" />
        </div>
      </div>
    </main>
  );
}
