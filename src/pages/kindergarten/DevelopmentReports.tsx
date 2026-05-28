import { ReportChart } from "@/components/kindergarten/ReportChart";
import { getKindergartenLocale } from "@/lib/kindergarten/types";

export default function DevelopmentReports() {
  const locale = getKindergartenLocale();

  return (
    <main dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-background px-5 py-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <h1 className="text-3xl font-bold">{locale === "ar" ? "تقارير النمو والتطور" : "Development Reports"}</h1>
        <ReportChart />
      </div>
    </main>
  );
}
