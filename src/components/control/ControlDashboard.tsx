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
import { Progress } from "@/components/ui/progress";
import { adminStats, ADMIN_TABLES_META, type AdminTable } from "@/lib/adminApi";
import { ALL_MCQS } from "@/data/mcqBank";

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
  const targetMcqs = 1000;
  const shortExplanationCount = ALL_MCQS.filter((q) => q.explanation.trim().length < 80).length;
  const weakReferenceCount = ALL_MCQS.filter((q) => !q.reference || q.reference.trim().length < 8).length;
  const qualityReadyMcqs = Math.max(0, ALL_MCQS.length - shortExplanationCount - weakReferenceCount);
  const rawProgress = Math.round((ALL_MCQS.length / targetMcqs) * 100);
  const qualityProgress = Math.round((qualityReadyMcqs / targetMcqs) * 100);

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
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{meta.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            Content quality toward 1000 MCQs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-md border bg-card p-3">
              <p className="text-[11px] text-muted-foreground">Total MCQs</p>
              <p className="text-2xl font-bold tabular-nums">{ALL_MCQS.length}</p>
              <p className="text-[11px] text-muted-foreground">Gap: {Math.max(0, targetMcqs - ALL_MCQS.length)}</p>
            </div>
            <div className="rounded-md border bg-card p-3">
              <p className="text-[11px] text-muted-foreground">Quality-ready</p>
              <p className="text-2xl font-bold tabular-nums text-primary">{qualityReadyMcqs}</p>
              <p className="text-[11px] text-muted-foreground">Adjusted gap: {Math.max(0, targetMcqs - qualityReadyMcqs)}</p>
            </div>
            <div className="rounded-md border bg-card p-3">
              <p className="text-[11px] text-muted-foreground">Short explanations</p>
              <p className="text-2xl font-bold tabular-nums text-destructive">{shortExplanationCount}</p>
              <p className="text-[11px] text-muted-foreground">Need expanded reasoning</p>
            </div>
            <div className="rounded-md border bg-card p-3">
              <p className="text-[11px] text-muted-foreground">Weak references</p>
              <p className="text-2xl font-bold tabular-nums">{weakReferenceCount}</p>
              <p className="text-[11px] text-muted-foreground">Need source cleanup</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs"><span>Raw target progress</span><span>{rawProgress}%</span></div>
            <Progress value={rawProgress} className="h-2" />
            <div className="flex items-center justify-between text-xs"><span>Quality-adjusted progress</span><span>{qualityProgress}%</span></div>
            <Progress value={qualityProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick guide</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Select any card above to open its table editor.</p>
          <p>• Changes are saved directly to the database and become visible immediately.</p>
          <p>• Content edits do not require republishing the app.</p>
          <p>• The control panel covers interface text, settings, home sections, scenarios, questions, surgeries, tools, exams, and notifications.</p>
        </CardContent>
      </Card>
    </div>
  );
}
