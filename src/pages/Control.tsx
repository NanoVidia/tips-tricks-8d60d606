import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  GitBranch,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  LayoutGrid,
  Languages,
  LogOut,
  Menu,
  Palette,
  Pill,
  Scissors,
  Settings,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  ADMIN_TABLES_META,
  TABLE_GROUPS,
  adminLogout,
  adminVerify,
  getStoredToken,
  type AdminTable,
} from "@/lib/adminApi";
import ControlLogin from "@/components/control/ControlLogin";
import ControlDashboard from "@/components/control/ControlDashboard";
import TableEditor from "@/components/control/TableEditor";

const ICON_MAP: Record<string, React.ElementType> = {
  Languages,
  Settings,
  LayoutGrid,
  HelpCircle,
  Scissors,
  Stethoscope,
  CalendarDays,
  AlertTriangle,
  Pill,
  BookOpen,
  GitBranch,
  GraduationCap,
  Bell,
  Palette,
};

type View = "dashboard" | AdminTable;

function NavItem({
  active,
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  active: boolean;
  icon: React.ElementType;
  label: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition text-left ${
        active
          ? "bg-primary text-primary-foreground font-medium shadow-sm"
          : "hover:bg-muted text-foreground"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded ${
            active ? "bg-primary-foreground/20" : "bg-muted-foreground/10"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function Navigation({
  view,
  setView,
  onItemClick,
}: {
  view: View;
  setView: (v: View) => void;
  onItemClick?: () => void;
}) {
  const tables = Object.keys(ADMIN_TABLES_META) as AdminTable[];
  const groups = Array.from(new Set(tables.map((t) => ADMIN_TABLES_META[t].group)));

  return (
    <div className="space-y-4 p-3">
      <NavItem
        active={view === "dashboard"}
        icon={LayoutDashboard}
        label="Dashboard"
        onClick={() => {
          setView("dashboard");
          onItemClick?.();
        }}
      />

      {groups.map((g) => {
        const groupMeta = TABLE_GROUPS[g];
        const groupTables = tables.filter((t) => ADMIN_TABLES_META[t].group === g);
        const GroupIcon = ICON_MAP[groupMeta?.icon ?? "Settings"] ?? Settings;
        return (
          <div key={g}>
            <div className="flex items-center gap-2 px-2 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              <GroupIcon className="h-3 w-3" />
              <span>{groupMeta?.label ?? g}</span>
            </div>
            <div className="space-y-0.5 mt-1">
              {groupTables.map((t) => {
                const meta = ADMIN_TABLES_META[t];
                const Icon = ICON_MAP[meta.icon ?? "Settings"] ?? Settings;
                return (
                  <NavItem
                    key={t}
                    active={view === t}
                    icon={Icon}
                    label={meta.label}
                    onClick={() => {
                      setView(t);
                      onItemClick?.();
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Control() {
  const [authed, setAuthed] = useState<boolean>(() => !!getStoredToken());
  const [view, setView] = useState<View>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.title = "Control Panel — Tips & Tricks";
    if (!authed) return;
    // Verify session validity on load
    adminVerify().catch(() => {
      setAuthed(false);
      toast.error("Session expired, please sign in again");
    });
  }, [authed]);

  async function handleLogout() {
    await adminLogout();
    setAuthed(false);
    setView("dashboard");
    toast.success("Signed out");
  }

  if (!authed) return <ControlLogin onSuccess={() => setAuthed(true)} />;

  const currentTitle =
    view === "dashboard" ? "Dashboard" : ADMIN_TABLES_META[view].label;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 border-r bg-card shrink-0 sticky top-0 h-screen">
        <div className="px-4 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm">Control Panel</h2>
            <p className="text-[10px] text-muted-foreground">Tips & Tricks Admin</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <Navigation view={view} setView={setView} />
        </ScrollArea>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-3 py-2 flex items-center justify-between gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="px-4 py-4 border-b">
                <h2 className="font-bold text-sm">Control Panel</h2>
              </div>
              <ScrollArea className="h-[calc(100vh-60px)]">
                <Navigation view={view} setView={setView} onItemClick={() => setMobileOpen(false)} />
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <div className="flex-1 text-center text-sm font-medium truncate">{currentTitle}</div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <div className="p-4 lg:p-6 max-w-6xl mx-auto">
          {view === "dashboard" ? (
            <ControlDashboard onNavigate={(t) => setView(t)} />
          ) : (
            <>
              <button
                type="button"
                onClick={() => setView("dashboard")}
                className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-3 w-3" />
                Back to dashboard
              </button>
              <TableEditor table={view} />
            </>
          )}

          <Card className="mt-8 p-3 bg-amber-50/40 dark:bg-amber-950/10 border-amber-200/40 text-[11px] text-amber-900 dark:text-amber-200">
            <strong>Note:</strong> All core content areas are available here for editing. Changes save to the database and do not require republishing.
          </Card>
        </div>
      </main>
    </div>
  );
}
