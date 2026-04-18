import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Trash2, Power, Send, Plus, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Notif = {
  id: string;
  title: string;
  body: string;
  scheduled_at: string;
  repeat_pattern: "none" | "daily" | "weekly";
  active: boolean;
  created_at: string;
};

const PASS_KEY = "admin_pass";

async function callAdmin(action: string, password: string, extra: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("admin-notifications", {
    body: { action, password, ...extra },
  });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data;
}

export default function Admin() {
  const [password, setPassword] = useState<string>(() => sessionStorage.getItem(PASS_KEY) ?? "");
  const [authed, setAuthed] = useState<boolean>(!!sessionStorage.getItem(PASS_KEY));
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);

  // form
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState(format(new Date(Date.now() + 5 * 60_000), "HH:mm"));
  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly">("none");
  const [sendNow, setSendNow] = useState(true);

  async function refresh(pwd = password) {
    if (!pwd) return;
    setLoading(true);
    try {
      const data: any = await callAdmin("list", pwd);
      setItems(data.items ?? []);
    } catch (e: any) {
      toast.error(e.message ?? "تعذر تحميل الإشعارات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authed) refresh();
    document.title = "لوحة الإشعارات — Tips & Tricks";
  }, [authed]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await callAdmin("login", password);
      sessionStorage.setItem(PASS_KEY, password);
      setAuthed(true);
      toast.success("تم تسجيل الدخول");
    } catch {
      toast.error("كلمة المرور خاطئة");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("العنوان والنص مطلوبان");
      return;
    }
    let scheduled_at: string;
    if (sendNow) {
      scheduled_at = new Date().toISOString();
    } else {
      if (!date) return toast.error("اختر التاريخ");
      const [hh, mm] = time.split(":").map(Number);
      const d = new Date(date);
      d.setHours(hh, mm, 0, 0);
      scheduled_at = d.toISOString();
    }
    setLoading(true);
    try {
      await callAdmin("create", password, {
        title: title.trim(),
        body: body.trim(),
        scheduled_at,
        repeat_pattern: repeat,
      });
      toast.success(sendNow ? "تم الإرسال للأجهزة" : "تمت الجدولة");
      setTitle("");
      setBody("");
      setRepeat("none");
      setSendNow(true);
      refresh();
    } catch (e: any) {
      toast.error(e.message ?? "فشل الإنشاء");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(n: Notif) {
    try {
      await callAdmin("toggle", password, { id: n.id, active: !n.active });
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function remove(id: string) {
    if (!confirm("حذف هذا الإشعار؟")) return;
    try {
      await callAdmin("delete", password, { id });
      toast.success("تم الحذف");
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>لوحة الإشعارات</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pwd">كلمة مرور المسؤول</Label>
                <Input
                  id="pwd"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                دخول
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">لوحة الإشعارات</h1>
            <p className="text-sm text-muted-foreground">أرسل إشعارات لأجهزة المستخدمين</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              sessionStorage.removeItem(PASS_KEY);
              setAuthed(false);
              setPassword("");
            }}
          >
            خروج
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              إشعار جديد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="t">العنوان</Label>
                <Input
                  id="t"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: تذكير سريري"
                  maxLength={200}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="b">النص</Label>
                <Textarea
                  id="b"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="نص الإشعار الذي سيظهر على الجهاز"
                  rows={3}
                  maxLength={1000}
                  required
                />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label className="cursor-pointer">إرسال فوري</Label>
                  <p className="text-xs text-muted-foreground">سيظهر للمستخدمين عند المزامنة التالية</p>
                </div>
                <Switch checked={sendNow} onCheckedChange={setSendNow} />
              </div>

              {!sendNow && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>التاريخ</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-right font-normal",
                            !date && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="ml-2 h-4 w-4" />
                          {date ? format(date, "yyyy-MM-dd") : "اختر التاريخ"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">الوقت</Label>
                    <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>التكرار</Label>
                <Select value={repeat} onValueChange={(v: any) => setRepeat(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون تكرار</SelectItem>
                    <SelectItem value="daily">يومي</SelectItem>
                    <SelectItem value="weekly">أسبوعي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                <Send className="ml-2 h-4 w-4" />
                {sendNow ? "إرسال الآن" : "جدولة"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الإشعارات ({items.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">لا توجد إشعارات بعد</p>
            )}
            {items.map((n) => (
              <div key={n.id} className="flex items-start gap-3 rounded-md border p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium truncate">{n.title}</h3>
                    {n.repeat_pattern !== "none" && (
                      <Badge variant="secondary" className="text-xs">
                        {n.repeat_pattern === "daily" ? "يومي" : "أسبوعي"}
                      </Badge>
                    )}
                    {!n.active && <Badge variant="outline" className="text-xs">معطّل</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{n.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(n.scheduled_at), "yyyy-MM-dd HH:mm")}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => toggleActive(n)} title="تفعيل/تعطيل">
                    <Power className={cn("h-4 w-4", n.active ? "text-primary" : "text-muted-foreground")} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(n.id)} title="حذف">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Footer: رابط مباشر للوحة التحكم الكاملة */}
        <footer className="pt-2 pb-4 text-center">
          <a
            href="/control"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Lock className="h-3 w-3" />
            الانتقال إلى لوحة التحكم الكاملة (/control)
          </a>
        </footer>
      </div>
    </div>
  );
}
