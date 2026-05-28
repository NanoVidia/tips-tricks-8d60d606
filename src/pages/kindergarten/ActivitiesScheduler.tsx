import { ActivityCard } from "@/components/kindergarten/ActivityCard";
import { getKindergartenLocale } from "@/lib/kindergarten/types";

export default function ActivitiesScheduler() {
  const locale = getKindergartenLocale();

  return (
    <main dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-background px-5 py-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <h1 className="text-3xl font-bold">{locale === "ar" ? "الجدول والأنشطة" : "Activities Scheduler"}</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          <ActivityCard title="الرسم الحر" category="الفنون" startsAt="09:00" />
          <ActivityCard title="حلقة قراءة" category="القراءة" startsAt="10:30" />
        </div>
      </div>
    </main>
  );
}
