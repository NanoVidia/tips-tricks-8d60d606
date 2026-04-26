import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CalendarDays,
  Database,
  GitBranch,
  GraduationCap,
  HelpCircle,
  Languages,
  LayoutGrid,
  Pill,
  Scissors,
  Settings,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminStats, ADMIN_TABLES_META, type AdminTable } from "@/lib/adminApi";

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
};

export default function ControlDashboard({
  onNavigate,
}: {
  onNavigate: (table: AdminTable) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: adminStats,
    staleTime: 30_000,
  });

  const counts = data?.counts ?? {};
  const total = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of app content
          </p>
        </div>
        <Card className="px-4 py-2 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2 text-sm">
            <Database className="h-4 w-4 text-primary" />
            <span className="font-bold text-primary">{total}</span>
            <span className="text-muted-foreground">records across {Object.keys(counts).length} tables</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {(Object.keys(ADMIN_TABLES_META) as AdminTable[]).map((table) => {
          const meta = ADMIN_TABLES_META[table];
          const Icon = ICON_MAP[meta.icon ?? "Database"] ?? Database;
          const count = counts[table];
          return (
            <Card
              key={table}
              role="button"
              tabIndex={0}
              onClick={() => onNavigate(table)}
              onKeyDown={(e) => e.key === "Enter" && onNavigate(table)}
              className="cursor-pointer hover:shadow-md hover:border-primary/40 transition-all group"
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition">
                    <Icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <span className="text-2xl font-bold tabular-nums">
                    {isLoading ? "—" : count ?? 0}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">{meta.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{table}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick guide</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Select any card above to open its table editor.</p>
          <p>• Changes are saved directly to the database and become visible immediately.</p>
          <p>• Content edits do not require republishing the app.</p>
          <p>• Upcoming sessions connect these tables to the app pages; some data may still come from code.</p>
        </CardContent>
      </Card>
    </div>
  );
}
