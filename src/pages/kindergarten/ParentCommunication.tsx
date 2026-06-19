import { NotificationCenter } from "@/components/kindergarten/NotificationCenter";
import { getKindergartenLocale } from "@/lib/kindergarten/types";

export default function ParentCommunication() {
  const locale = getKindergartenLocale();

  return (
    <main dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-background px-5 py-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-3xl font-bold">{locale === "ar" ? "التواصل مع أولياء الأمور" : "Parent Communication"}</h1>
        <NotificationCenter />
      </div>
    </main>
  );
}
