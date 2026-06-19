import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MediaUploader() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>رفع الوسائط</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>تنظيم الصور حسب التاريخ والنشاط ومشاركتها بأمان مع أولياء الأمور.</p>
        <Button type="button" size="sm">اختيار ملفات</Button>
      </CardContent>
    </Card>
  );
}
