import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, KeyRound, Rocket, ShieldAlert, ExternalLink, RefreshCw } from "lucide-react";
import sodium from "libsodium-wrappers";

// ============================================================================
// صفحة إعداد Keystore بنقرة واحدة
// ----------------------------------------------------------------------------
// تتيح لك:
//   1) لصق GitHub Personal Access Token مرة واحدة (لا يُحفظ على القرص)
//   2) رفعه كـ GH_REPO_ADMIN_TOKEN داخل أسرار المستودع (مشفّراً عبر libsodium)
//   3) تشغيل workflow "Build Android AAB" بنقرة واحدة ليولّد keystore عند الحاجة
//   4) متابعة آخر تشغيل والذهاب إليه مباشرة
// ============================================================================

const DEFAULT_OWNER = "";
const DEFAULT_REPO = "";
const WORKFLOW_FILE = "build-aab.yml";
const SECRET_NAME = "GH_REPO_ADMIN_TOKEN";

const LS_KEY = "keystore-setup-config";

type Cfg = { owner: string; repo: string; persistToken: boolean };

const loadCfg = (): Cfg => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { persistToken: true, ...JSON.parse(raw) };
  } catch {}
  return { owner: DEFAULT_OWNER, repo: DEFAULT_REPO, persistToken: true };
};

const ghHeaders = (token: string) => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
});

async function uploadSecretToRepo(owner: string, repo: string, token: string, secretName: string, secretValue: string) {
  await sodium.ready;

  const keyRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/secrets/public-key`, {
    headers: ghHeaders(token),
  });
  if (!keyRes.ok) throw new Error(`فشل جلب المفتاح العام (${keyRes.status}): ${await keyRes.text()}`);
  const { key, key_id } = await keyRes.json();

  const binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
  const binsec = sodium.from_string(secretValue);
  const encBytes = sodium.crypto_box_seal(binsec, binkey);
  const encrypted_value = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);

  const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/secrets/${secretName}`, {
    method: "PUT",
    headers: { ...ghHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ encrypted_value, key_id }),
  });
  if (!putRes.ok && putRes.status !== 201 && putRes.status !== 204) {
    throw new Error(`فشل رفع السر (${putRes.status}): ${await putRes.text()}`);
  }
}

async function dispatchWorkflow(owner: string, repo: string, token: string) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    {
      method: "POST",
      headers: { ...ghHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ ref: "main", inputs: {} }),
    }
  );
  if (!res.ok && res.status !== 204) {
    throw new Error(`فشل تشغيل الـ workflow (${res.status}): ${await res.text()}`);
  }
}

async function fetchLatestRun(owner: string, repo: string, token: string) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${WORKFLOW_FILE}/runs?per_page=1`,
    { headers: ghHeaders(token) }
  );
  if (!res.ok) throw new Error(`فشل جلب آخر تشغيل (${res.status})`);
  const data = await res.json();
  return data.workflow_runs?.[0];
}

export default function KeystoreSetup() {
  const [cfg, setCfg] = useState<Cfg>(loadCfg);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState<null | "save" | "run" | "refresh">(null);
  const [latestRun, setLatestRun] = useState<any>(null);

  useEffect(() => {
    const { owner, repo, persistToken } = cfg;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ owner, repo, persistToken }));
    } catch {}
  }, [cfg]);

  const ready = useMemo(
    () => cfg.owner.trim().length > 0 && cfg.repo.trim().length > 0 && token.trim().length >= 20,
    [cfg, token]
  );

  const runUrl = useMemo(
    () =>
      cfg.owner && cfg.repo
        ? `https://github.com/${cfg.owner}/${cfg.repo}/actions/workflows/${WORKFLOW_FILE}`
        : "#",
    [cfg]
  );

  async function handleSaveAndRun() {
    if (!ready) return;
    try {
      if (cfg.persistToken) {
        setBusy("save");
        await uploadSecretToRepo(cfg.owner.trim(), cfg.repo.trim(), token.trim(), SECRET_NAME, token.trim());
        toast.success(`تم رفع ${SECRET_NAME} إلى أسرار المستودع`);
      }
      setBusy("run");
      await dispatchWorkflow(cfg.owner.trim(), cfg.repo.trim(), token.trim());
      toast.success("تم تشغيل Build Android AAB — راقب التقدم بالأسفل");
      setTimeout(() => handleRefresh(), 3000);
    } catch (e: any) {
      toast.error(e?.message ?? "فشل غير متوقع");
    } finally {
      setBusy(null);
    }
  }

  async function handleRefresh() {
    if (!cfg.owner || !cfg.repo || !token) {
      toast.error("أدخل owner/repo والتوكن أولاً");
      return;
    }
    try {
      setBusy("refresh");
      const run = await fetchLatestRun(cfg.owner.trim(), cfg.repo.trim(), token.trim());
      setLatestRun(run);
      if (!run) toast.info("لا يوجد تشغيل سابق بعد");
    } catch (e: any) {
      toast.error(e?.message ?? "فشل التحديث");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div dir="rtl" className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <KeyRound className="size-6 text-primary" />
          إعداد Keystore بنقرة واحدة
        </h1>
        <p className="text-sm text-muted-foreground">
          أدخل GitHub Personal Access Token لمرة واحدة، احفظه كسرّ دائم في المستودع، ثم شغّل بناء AAB بحيث يتم توليد keystore تلقائياً عند الحاجة.
        </p>
      </header>

      <Alert variant="destructive">
        <ShieldAlert className="size-4" />
        <AlertTitle>تنبيه أمني مهم</AlertTitle>
        <AlertDescription className="text-xs leading-relaxed">
          التوكن يُستخدم في المتصفح فقط ولا يُحفظ على القرص. أنشئه بصلاحية{" "}
          <code className="bg-muted px-1 rounded">repo</code> فقط، واحذفه من GitHub بعد انتهاء الإعداد إن أردت.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">١. معلومات المستودع</CardTitle>
          <CardDescription>تجدها في رابط GitHub الخاص بمستودعك.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                placeholder="my-username"
                value={cfg.owner}
                onChange={(e) => setCfg({ ...cfg, owner: e.target.value })}
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="repo">Repository</Label>
              <Input
                id="repo"
                placeholder="tips-tricks"
                value={cfg.repo}
                onChange={(e) => setCfg({ ...cfg, repo: e.target.value })}
                dir="ltr"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">٢. GitHub Personal Access Token</CardTitle>
          <CardDescription>
            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=lovable-keystore-setup"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline inline-flex items-center gap-1"
            >
              أنشئ توكن جديد بصلاحية <code>repo</code>
              <ExternalLink className="size-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="token">PAT</Label>
            <Input
              id="token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              dir="ltr"
              autoComplete="off"
            />
          </div>
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={cfg.persistToken}
              onCheckedChange={(v) => setCfg({ ...cfg, persistToken: v === true })}
              className="mt-0.5"
            />
            <span className="text-muted-foreground leading-relaxed">
              احفظ التوكن كسرّ دائم باسم <code className="bg-muted px-1 rounded">GH_REPO_ADMIN_TOKEN</code> داخل
              المستودع (مطلوب مرة واحدة فقط لكي يستطيع workflow إنشاء أسرار التوقيع تلقائياً في GitHub).
            </span>
          </label>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSaveAndRun} disabled={!ready || busy !== null} className="flex-1" size="lg">
          {busy === "save" && <Loader2 className="size-4 animate-spin" />}
          {busy === "run" && <Loader2 className="size-4 animate-spin" />}
          {!busy && <Rocket className="size-4" />}
          {cfg.persistToken ? "احفظ التوكن وشغّل التوليد" : "شغّل التوليد فقط"}
        </Button>
      </div>

      <Separator />

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">آخر تشغيل</CardTitle>
            <CardDescription>اضغط تحديث لجلب الحالة من GitHub.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={busy !== null}>
            {busy === "refresh" ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            تحديث
          </Button>
        </CardHeader>
        <CardContent>
          {latestRun ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">الحالة</span>
                <span className="font-mono">
                  {latestRun.status} · {latestRun.conclusion ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">رقم التشغيل</span>
                <span className="font-mono">#{latestRun.run_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">التاريخ</span>
                <span className="font-mono text-xs">
                  {new Date(latestRun.created_at).toLocaleString("ar-EG")}
                </span>
              </div>
              <Button asChild variant="link" className="h-auto p-0">
                <a href={latestRun.html_url} target="_blank" rel="noreferrer">
                  افتح في GitHub <ExternalLink className="size-3 mr-1" />
                </a>
              </Button>
            </div>
          ) : (
            <Button asChild variant="link" className="h-auto p-0 text-xs">
              <a href={runUrl} target="_blank" rel="noreferrer">
                افتح صفحة الـ workflow في GitHub <ExternalLink className="size-3 mr-1" />
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      <Alert>
        <AlertDescription className="text-xs leading-relaxed">
          بعد نجاح التشغيل لأول مرة: ستجد artifact باسم{" "}
          <code className="bg-muted px-1 rounded">keystore-backup-DOWNLOAD-AND-DELETE</code> داخل صفحة الـ run —
          نزّله واحفظه في خزنة آمنة (1Password / Bitwarden). كل البناءات القادمة من workflow{" "}
          <code className="bg-muted px-1 rounded">Build Android AAB</code> ستستخدم نفس التوقيع تلقائياً.
        </AlertDescription>
      </Alert>
    </div>
  );
}
