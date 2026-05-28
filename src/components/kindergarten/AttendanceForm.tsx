import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AttendanceForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>تسجيل الحضور اليومي</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">سجل حضور الأطفال بسرعة من شاشة واحدة.</p>
        <Button type="button" size="sm">حفظ الحضور</Button>
      </CardContent>
    </Card>
  );
}
