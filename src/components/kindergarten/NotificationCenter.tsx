import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NotificationCenter() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>مركز الإشعارات</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• رسالة يومية لأولياء الأمور</li>
          <li>• تنبيه غياب متكرر</li>
          <li>• تذكير فعالية قادمة</li>
        </ul>
      </CardContent>
    </Card>
  );
}
