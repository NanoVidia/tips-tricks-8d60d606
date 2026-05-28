import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationCenter } from "@/components/kindergarten/NotificationCenter";
import { getKindergartenLocale } from "@/lib/kindergarten/types";

const labels = {
  ar: {
    title: "لوحة تحكم الروضة",
    subtitle: "ملخص الأطفال والحضور والأنشطة",
    children: "عدد الأطفال",
    attendance: "حضور اليوم",
    activities: "أنشطة اليوم",
    back: "العودة للرئيسية",
  },
  en: {
    title: "Kindergarten Dashboard",
    subtitle: "Quick summary for children, attendance, and activities",
    children: "Children",
    attendance: "Today attendance",
    activities: "Today activities",
    back: "Back to home",
  },
} as const;

export default function KindergartenDashboard() {
  const locale = getKindergartenLocale();
  const t = labels[locale];

  return (
    <main dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-background px-5 py-8 text-foreground">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link to="/" className="text-sm text-primary underline">{t.back}</Link>
        <header>
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          {[{ key: t.children, value: 48 }, { key: t.attendance, value: "44/48" }, { key: t.activities, value: 6 }].map((item) => (
            <motion.div key={item.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{item.key}</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{item.value}</CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <NotificationCenter />
      </div>
    </main>
  );
}
