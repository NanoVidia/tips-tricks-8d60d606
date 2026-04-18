import { useEffect, useState } from "react";
import { Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { adminLogin } from "@/lib/adminApi";

export default function ControlLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "لوحة التحكم — Tips & Tricks";
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    try {
      await adminLogin(password);
      toast.success("تم تسجيل الدخول");
      onSuccess();
    } catch (err) {
      toast.error((err as Error).message || "كلمة مرور خاطئة");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4"
      dir="rtl"
    >
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">لوحة التحكم الشاملة</CardTitle>
          <p className="text-sm text-muted-foreground">
            تحكّم بكل محتوى التطبيق من مكان واحد
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pwd" className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5" />
                كلمة مرور المسؤول
              </Label>
              <Input
                id="pwd"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
                placeholder="••••••••"
                className="text-center tracking-widest"
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? "جارِ التحقق..." : "دخول"}
            </Button>
            <p className="text-[11px] text-center text-muted-foreground pt-2">
              الجلسة صالحة لمدة 24 ساعة
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
