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
      toast.error(e.message ?? "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authed) refresh();
    document.title = "Notifications — Tips & Tricks";
  }, [authed]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await callAdmin("login", password);
      sessionStorage.setItem(PASS_KEY, password);
      setAuthed(true);
      toast.success("Signed in");
    } catch {
      toast.error("Incorrect password");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required");
      return;
    }
    let scheduled_at: string;
    if (sendNow) {
      scheduled_at = new Date().toISOString();
    } else {
      if (!date) return toast.error("Select a date");
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
      toast.success(sendNow ? "Sent to devices" : "Scheduled");
      setTitle("");
      setBody("");
      setRepeat("none");
      setSendNow(true);
      refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create notification");
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
    if (!confirm("Delete this notification?")) return;
    try {
      await callAdmin("delete", password, { id });
      toast.success("Deleted");
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pwd">Admin password</Label>
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
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground">Send notifications to user devices</p>
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
            Sign out
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              New notification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="t">Title</Label>
                <Input
                  id="t"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Example: Clinical reminder"
                  maxLength={200}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="b">Body</Label>
                <Textarea
                  id="b"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Notification body shown on the device"
                  rows={3}
                  maxLength={1000}
                  required
                />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label className="cursor-pointer">Send now</Label>
                  <p className="text-xs text-muted-foreground">Users will see it on the next sync</p>
                </div>
                <Switch checked={sendNow} onCheckedChange={setSendNow} />
              </div>

              {!sendNow && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "yyyy-MM-dd") : "Select a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Repeat</Label>
                <Select value={repeat} onValueChange={(v: any) => setRepeat(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No repeat</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                <Send className="mr-2 h-4 w-4" />
                {sendNow ? "Send now" : "Schedule"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications ({items.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No notifications yet</p>
            )}
            {items.map((n) => (
              <div key={n.id} className="flex items-start gap-3 rounded-md border p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium truncate">{n.title}</h3>
                    {n.repeat_pattern !== "none" && (
                      <Badge variant="secondary" className="text-xs">
                        {n.repeat_pattern === "daily" ? "Daily" : "Weekly"}
                      </Badge>
                    )}
                    {!n.active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{n.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(n.scheduled_at), "yyyy-MM-dd HH:mm")}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => toggleActive(n)} title="Toggle active">
                    <Power className={cn("h-4 w-4", n.active ? "text-primary" : "text-muted-foreground")} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(n.id)} title="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Footer: direct link to the full control panel */}
        <footer className="pt-2 pb-4 text-center">
          <a
            href="/control"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Lock className="h-3 w-3" />
            Open full control panel (/control)
          </a>
        </footer>
      </div>
    </div>
  );
}
