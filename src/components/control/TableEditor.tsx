// محرّر عام لأي جدول — يعرض الأعمدة تلقائياً ويسمح بـ CRUD كامل
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit2, Trash2, Save, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  adminList,
  adminCreate,
  adminUpdate,
  adminDelete,
  ADMIN_TABLES_META,
  type AdminTable,
} from "@/lib/adminApi";

type Row = Record<string, unknown>;

const HIDDEN_COLS = new Set(["id", "created_at", "updated_at"]);
const PAGE_SIZE = 25;

function formatCellValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (Array.isArray(v)) return v.length === 0 ? "—" : `[${v.length}] ${v.slice(0, 2).join(", ")}${v.length > 2 ? "..." : ""}`;
  if (typeof v === "object") return JSON.stringify(v).slice(0, 60) + "...";
  if (typeof v === "boolean") return v ? "✓" : "✗";
  const s = String(v);
  return s.length > 80 ? s.slice(0, 80) + "..." : s;
}

function inferFieldType(key: string, value: unknown): "text" | "textarea" | "boolean" | "array" | "json" | "number" | "date" {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (Array.isArray(value)) return "array";
  if (value && typeof value === "object") return "json";
  if (key.includes("date") || key.includes("_at")) return "date";
  if (
    key === "stem" ||
    key === "explanation" ||
    key === "body" ||
    key === "answer" ||
    key === "notes" ||
    key === "description" ||
    key.includes("script") ||
    key.includes("situation") ||
    key.includes("action")
  )
    return "textarea";
  return "text";
}

function FieldEditor({
  fieldKey,
  type,
  value,
  onChange,
}: {
  fieldKey: string;
  type: ReturnType<typeof inferFieldType>;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (type === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <Switch checked={Boolean(value)} onCheckedChange={onChange} />
        <span className="text-xs text-muted-foreground">{value ? "Active" : "Inactive"}</span>
      </div>
    );
  }
  if (type === "number") {
    return (
      <Input
        type="number"
        value={value === null || value === undefined ? "" : Number(value)}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      />
    );
  }
  if (type === "array") {
    const arr = Array.isArray(value) ? value : [];
    return (
      <Textarea
        rows={4}
        value={arr.join("\n")}
        onChange={(e) =>
          onChange(
            e.target.value
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
        placeholder="One item per line"
        className="font-mono text-xs"
      />
    );
  }
  if (type === "json") {
    return (
      <Textarea
        rows={6}
        value={JSON.stringify(value ?? {}, null, 2)}
        onChange={(e) => {
          try {
            onChange(JSON.parse(e.target.value));
          } catch {
            // نسمح بكتابة غير صالحة مؤقتاً
          }
        }}
        className="font-mono text-xs"
      />
    );
  }
  if (type === "textarea") {
    return (
      <Textarea
        rows={4}
        value={value === null || value === undefined ? "" : String(value)}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (type === "date") {
    const v = value ? String(value).slice(0, 10) : "";
    return <Input type="date" value={v} onChange={(e) => onChange(e.target.value || null)} />;
  }
  return (
    <Input
      value={value === null || value === undefined ? "" : String(value)}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default function TableEditor({ table }: { table: AdminTable }) {
  const meta = ADMIN_TABLES_META[table];
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Row>({});
  const [busy, setBusy] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-list", table, search, page],
    queryFn: () =>
      adminList(table, { search, limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
    staleTime: 10_000,
  });

  const items = (data?.items ?? []) as Row[];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // الأعمدة المعروضة في الجدول (أول 4 عواميد ذات قيمة)
  const displayCols =
    items[0]
      ? Object.keys(items[0]).filter((k) => !HIDDEN_COLS.has(k)).slice(0, 4)
      : [];

  function startEdit(row: Row) {
    setDraft({ ...row });
    setEditing(row);
    setCreating(false);
  }

  function startCreate() {
    // نأخذ مفاتيح of أول صف موجود كقالب، أو نتركها فارغة
    const template: Row = {};
    if (items[0]) {
      for (const k of Object.keys(items[0])) {
        if (HIDDEN_COLS.has(k)) continue;
        const v = items[0][k];
        if (typeof v === "boolean") template[k] = false;
        else if (Array.isArray(v)) template[k] = [];
        else if (v && typeof v === "object") template[k] = {};
        else if (typeof v === "number") template[k] = 0;
        else template[k] = "";
      }
      // التفعيل افتراضياً true
      if ("active" in template) template.active = true;
    }
    setDraft(template);
    setCreating(true);
    setEditing(null);
  }

  async function handleSave() {
    setBusy(true);
    try {
      // إزالة الحقول المخفية والـ id غير المسموحة
      const payload: Row = {};
      for (const [k, v] of Object.entries(draft)) {
        if (HIDDEN_COLS.has(k)) continue;
        payload[k] = v;
      }
      if (creating) {
        await adminCreate(table, payload);
        toast.success("Added");
      } else if (editing) {
        await adminUpdate(table, String(editing.id), payload);
        toast.success("Updated");
      }
      setEditing(null);
      setCreating(false);
      setDraft({});
      qc.invalidateQueries({ queryKey: ["admin-list", table] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(row: Row) {
    if (!confirm("Delete this record permanently?")) return;
    try {
      await adminDelete(table, String(row.id));
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-list", table] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const dialogOpen = creating || editing !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">{meta.label}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {table} · {total} records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search..."
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No records. Select “Add” to get started.
            </div>
          ) : (
            <div className="divide-y">
              {items.map((row) => (
                <div
                  key={String(row.id)}
                  className="flex items-start justify-between gap-3 p-3 hover:bg-muted/30 transition"
                >
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                    {displayCols.map((col) => (
                      <div key={col} className="text-xs min-w-0">
                        <span className="text-muted-foreground">{col}: </span>
                        <span className="font-medium truncate inline-block max-w-full align-bottom">
                          {formatCellValue(row[col])}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(row)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(row)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <span className="text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null);
            setCreating(false);
            setDraft({});
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {creating ? "Add new record" : "Edit record"} — {meta.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {Object.keys(draft)
              .filter((k) => !HIDDEN_COLS.has(k))
              .map((key) => {
                const type = inferFieldType(key, draft[key]);
                return (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs font-mono text-muted-foreground">{key}</Label>
                    <FieldEditor
                      fieldKey={key}
                      type={type}
                      value={draft[key]}
                      onChange={(v) => setDraft((d) => ({ ...d, [key]: v }))}
                    />
                  </div>
                );
              })}
            {Object.keys(draft).filter((k) => !HIDDEN_COLS.has(k)).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No template is available yet. Add a record after seed data is available.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditing(null);
                setCreating(false);
              }}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={busy}>
              <Save className="h-4 w-4" />
              {busy ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
