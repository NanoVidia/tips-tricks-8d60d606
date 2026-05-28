import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BillingInvoice() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ملخص الفواتير</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-1">
        <p>رسوم الاشتراك الشهرية</p>
        <p>الأنشطة الإضافية</p>
        <p>المدفوعات والمتأخرات</p>
      </CardContent>
    </Card>
  );
}
