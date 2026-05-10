import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  RefreshCw,
  CreditCard,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  Activity,
  Crown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminBillingMonitor, type BillingMonitorData } from "@/lib/adminApi";
import { toast } from "sonner";

type SubRow = BillingMonitorData["subscriptions"][number];
type EventRow = BillingMonitorData["events"][number];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  trial: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  expired: "bg-muted text-muted-foreground border-border",
  canceled: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClasses = {
    default: "bg-card border-border",
    success: "bg-emerald-500/5 border-emerald-500/30",
    warning: "bg-amber-500/5 border-amber-500/30",
    danger: "bg-rose-500/5 border-rose-500/30",
  }[tone];
  const iconClasses = {
    default: "text-primary",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-rose-600 dark:text-rose-400",
  }[tone];

  return (
    <Card className={toneClasses}>
      <CardContent className="p-3.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
              {label}
            </div>
            <div className="text-2xl font-black mt-0.5">{value}</div>
          </div>
          <Icon className={`h-7 w-7 ${iconClasses}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function copy(text: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success("Copied"),
    () => toast.error("Copy failed"),
  );
}

function shorten(s: string | null, n = 12) {
  if (!s) return "—";
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function SubscriptionRow({ sub }: { sub: SubRow }) {
  const [open, setOpen] = useState(false);
  const isExpired =
    sub.current_period_end && new Date(sub.current_period_end).getTime() < Date.now();

  return (
    <div className="border-b last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 text-left text-xs"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
        <Badge
          variant="outline"
          className={`${STATUS_COLORS[sub.status] ?? STATUS_COLORS.expired} text-[10px] font-bold uppercase shrink-0`}
        >
          {sub.status}
        </Badge>
        <span className="font-mono text-[10.5px] text-muted-foreground shrink-0 w-20">
          {sub.plan ?? "—"}
        </span>
        <span className="font-mono text-[10.5px] truncate flex-1 min-w-0" title={sub.user_id}>
          {shorten(sub.user_id, 18)}
        </span>
        <span className="text-[10.5px] text-muted-foreground shrink-0 hidden md:inline">
          {sub.current_period_end ? `إلى ${formatDate(sub.current_period_end).split(",")[0]}` : "—"}
        </span>
        {isExpired && sub.status === "active" && (
          <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 bg-muted/20 text-[11px] space-y-1.5 font-mono">
          <Field label="user_id" value={sub.user_id} mono copyable />
          <Field label="product_id" value={sub.product_id ?? "—"} mono />
          <Field label="order_id" value={sub.order_id ?? "—"} mono copyable />
          <Field label="purchase_token" value={shorten(sub.purchase_token, 40)} mono copyable copyValue={sub.purchase_token ?? ""} />
          <Field label="auto_renewing" value={String(sub.auto_renewing)} />
          <Field label="trial_ends_at" value={formatDate(sub.trial_ends_at)} />
          <Field label="current_period_end" value={formatDate(sub.current_period_end)} />
          <Field label="last_verified_at" value={formatDate(sub.last_verified_at)} />
          <Field label="updated_at" value={formatDate(sub.updated_at)} />
        </div>
      )}
    </div>
  );
}

function EventRow({ ev }: { ev: EventRow }) {
  const [open, setOpen] = useState(false);
  const isVerify = ev.event_type.includes("verify");
  const isRtdn = ev.event_type === "rtdn";

  return (
    <div className="border-b last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 text-left text-xs"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
        <Badge
          variant="outline"
          className={`text-[10px] font-bold uppercase shrink-0 ${
            isRtdn
              ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
              : isVerify
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                : "bg-muted"
          }`}
        >
          {ev.event_type}
        </Badge>
        {ev.notification_type !== null && (
          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
            type {ev.notification_type}
          </span>
        )}
        <span className="font-mono text-[10.5px] truncate flex-1 min-w-0">
          {ev.product_id ?? "—"}
        </span>
        <span className="text-[10.5px] text-muted-foreground shrink-0">
          {formatDate(ev.created_at)}
        </span>
        {ev.processed ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        ) : (
          <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 bg-muted/20 text-[11px] space-y-1.5">
          <Field label="event_id" value={ev.id} mono copyable />
          <Field label="user_id" value={ev.user_id ?? "anonymous"} mono />
          <Field label="order_id" value={ev.order_id ?? "—"} mono copyable />
          <div className="pt-1">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 font-bold">
              raw_payload
            </div>
            <pre className="text-[10.5px] bg-background border rounded p-2 overflow-x-auto max-h-64 leading-relaxed">
              {JSON.stringify(ev.raw_payload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
  copyable = false,
  copyValue,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
  copyValue?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground w-32 shrink-0 pt-0.5 font-bold">
        {label}
      </span>
      <span className={`flex-1 break-all ${mono ? "font-mono" : ""}`}>{value}</span>
      {copyable && (
        <button
          type="button"
          onClick={() => copy(copyValue ?? value)}
          className="text-muted-foreground hover:text-foreground shrink-0"
          title="Copy"
        >
          <Copy className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export default function BillingMonitor() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["billing-monitor"],
    queryFn: () => adminBillingMonitor({ eventsLimit: 200, subsLimit: 200 }),
    refetchInterval: 30_000,
  });

  const stats = data?.stats;
  const subs = data?.subscriptions ?? [];
  const events = data?.events ?? [];

  const filtered = (rows: SubRow[] | EventRow[]) => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Billing Monitor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            مراقبة الاشتراكات وأحداث الشراء في الوقت الحقيقي
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-3.5 w-3.5 ml-1.5 ${isFetching ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="إجمالي المشتركين" value={stats?.total ?? "…"} />
        <StatCard icon={CheckCircle2} label="نشطون" value={stats?.active ?? "…"} tone="success" />
        <StatCard icon={Clock} label="فترة تجريبية" value={stats?.trial ?? "…"} tone="warning" />
        <StatCard icon={XCircle} label="منتهون / ملغون" value={(stats?.expired ?? 0) + (stats?.canceled ?? 0)} tone="danger" />
      </div>

      {/* Plan + activity */}
      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              توزيع الخطط
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1.5">
            <div className="flex justify-between">
              <span>شهري</span>
              <span className="font-mono font-bold">{stats?.byPlan.monthly ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>سنوي</span>
              <span className="font-mono font-bold">{stats?.byPlan.yearly ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>مدى الحياة</span>
              <span className="font-mono font-bold">{stats?.byPlan.lifetime ?? 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              نشاط الأحداث
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1.5">
            <div className="flex justify-between">
              <span>آخر 24 ساعة</span>
              <span className="font-mono font-bold">{data?.events24h ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>آخر 7 أيام</span>
              <span className="font-mono font-bold">{data?.events7d ?? 0}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>المعروضة الآن</span>
              <span className="font-mono">{events.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Input
        placeholder="بحث (user_id, order_id, product_id, JSON…)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="text-xs font-mono"
      />

      {/* Tabs */}
      <Tabs defaultValue="subscriptions">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="subscriptions" className="text-xs">
            الاشتراكات ({subs.length})
          </TabsTrigger>
          <TabsTrigger value="events" className="text-xs">
            الأحداث ({events.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="mt-3">
          <Card className="overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">جاري التحميل…</div>
            ) : subs.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                لا توجد اشتراكات بعد. ستظهر هنا فور أن يبدأ مستخدم تجربة أو شراء حقيقي.
              </div>
            ) : (
              filtered(subs).map((s) => <SubscriptionRow key={(s as SubRow).id} sub={s as SubRow} />)
            )}
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-3">
          <Card className="overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">جاري التحميل…</div>
            ) : events.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                لا توجد أحداث بعد.
              </div>
            ) : (
              filtered(events).map((e) => <EventRow key={(e as EventRow).id} ev={e as EventRow} />)
            )}
          </Card>

          {data?.eventTypes && Object.keys(data.eventTypes).length > 0 && (
            <Card className="mt-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                  أنواع الأحداث
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs flex flex-wrap gap-1.5">
                {Object.entries(data.eventTypes).map(([type, count]) => (
                  <Badge key={type} variant="outline" className="font-mono">
                    {type}: <span className="font-bold mr-1">{count}</span>
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
