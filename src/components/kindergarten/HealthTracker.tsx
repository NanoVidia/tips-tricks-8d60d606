import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HealthTracker() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>الصحة والوجبات</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2">
        <p>• تتبع الحساسية الغذائية</p>
        <p>• متابعة الوجبات اليومية</p>
        <p>• ملاحظات الحالة الصحية</p>
      </CardContent>
    </Card>
  );
}
