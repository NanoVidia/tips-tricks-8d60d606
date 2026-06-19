import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>إعدادات الروضة</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2">
        <p>• ساعات العمل والعطلات</p>
        <p>• إدارة المعلمات والموظفين</p>
        <p>• الدعم والمساعدة</p>
      </CardContent>
    </Card>
  );
}
