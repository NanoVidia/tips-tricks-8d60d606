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
// One-Click Keystore Setup page
// ----------------------------------------------------------------------------
// Allows you to:
//   1) Paste a GitHub Personal Access Token once (not saved to disk)
//   2) Upload it as GH_REPO_ADMIN_TOKEN into repository secrets (encrypted via libsodium)
//   3) Trigger the "Build Android AAB" workflow with one click to generate the keystore when needed
//   4) Monitor the latest run and navigate to it directly
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
  if (!keyRes.ok) throw new Error(`Failed to fetch public key (${keyRes.status}): ${await keyRes.text()}`);
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
    throw new Error(`Failed to upload secret (${putRes.status}): ${await putRes.text()}`);
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
    throw new Error(`Failed to trigger workflow (${res.status}): ${await res.text()}`);
  }
}

async function fetchLatestRun(owner: string, repo: string, token: string) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${WORKFLOW_FILE}/runs?per_page=1`,
    { headers: ghHeaders(token) }
  );
  if (!res.ok) throw new Error(`Failed to fetch latest run (${res.status})`);
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
        toast.success(`${SECRET_NAME} uploaded to repository secrets`);
      }
      setBusy("run");
      await dispatchWorkflow(cfg.owner.trim(), cfg.repo.trim(), token.trim());
      toast.success("Build Android AAB triggered — monitor progress below");
      setTimeout(() => handleRefresh(), 3000);
    } catch (e: any) {
      toast.error(e?.message ?? "Unexpected error");
    } finally {
      setBusy(null);
    }
  }

  async function handleRefresh() {
    if (!cfg.owner || !cfg.repo || !token) {
      toast.error("Enter owner, repo, and token first");
      return;
    }
    try {
      setBusy("refresh");
      const run = await fetchLatestRun(cfg.owner.trim(), cfg.repo.trim(), token.trim());
      setLatestRun(run);
      if (!run) toast.info("No previous runs found yet");
    } catch (e: any) {
      toast.error(e?.message ?? "Refresh failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div dir="rtl" className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <KeyRound className="size-6 text-primary" />
          One-Click Keystore Setup
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your GitHub Personal Access Token once, save it as a permanent repository secret,
          then trigger an AAB build so the keystore is generated automatically when needed.
        </p>
      </header>

      <Alert variant="destructive">
        <ShieldAlert className="size-4" />
        <AlertTitle>Important Security Notice</AlertTitle>
        <AlertDescription className="text-xs leading-relaxed">
          The token is used in the browser only and is not saved to disk. Create it with the{" "}
          <code className="bg-muted px-1 rounded">repo</code> scope only, and revoke it from
          GitHub after setup is complete if desired.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Repository Details</CardTitle>
          <CardDescription>Found in your GitHub repository URL.</CardDescription>
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
          <CardTitle className="text-base">2. GitHub Personal Access Token</CardTitle>
          <CardDescription>
            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=lovable-keystore-setup"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline inline-flex items-center gap-1"
            >
              Create a new token with <code>repo</code> scope
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
              Save the token as a permanent secret named{" "}
              <code className="bg-muted px-1 rounded">GH_REPO_ADMIN_TOKEN</code> inside the
              repository (required once so the workflow can create signing secrets automatically
              in GitHub).
            </span>
          </label>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSaveAndRun} disabled={!ready || busy !== null} className="flex-1" size="lg">
          {busy === "save" && <Loader2 className="size-4 animate-spin" />}
          {busy === "run" && <Loader2 className="size-4 animate-spin" />}
          {!busy && <Rocket className="size-4" />}
          {cfg.persistToken ? "Save Token & Run Build" : "Run Build Only"}
        </Button>
      </div>

      <Separator />

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Latest Run</CardTitle>
            <CardDescription>Click Refresh to fetch status from GitHub.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={busy !== null}>
            {busy === "refresh" ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {latestRun ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-mono">
                  {latestRun.status} · {latestRun.conclusion ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Run Number</span>
                <span className="font-mono">#{latestRun.run_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-mono text-xs">
                  {new Date(latestRun.created_at).toLocaleString("en-US")}
                </span>
              </div>
              <Button asChild variant="link" className="h-auto p-0">
                <a href={latestRun.html_url} target="_blank" rel="noreferrer">
                  Open in GitHub <ExternalLink className="size-3 mr-1" />
                </a>
              </Button>
            </div>
          ) : (
            <Button asChild variant="link" className="h-auto p-0 text-xs">
              <a href={runUrl} target="_blank" rel="noreferrer">
                Open workflow page on GitHub <ExternalLink className="size-3 mr-1" />
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      <Alert>
        <AlertDescription className="text-xs leading-relaxed">
          After the first successful run: you will find an artifact named{" "}
          <code className="bg-muted px-1 rounded">keystore-backup-DOWNLOAD-AND-DELETE</code> inside
          the run page — download it and store it in a secure vault (1Password / Bitwarden). All
          subsequent builds from the{" "}
          <code className="bg-muted px-1 rounded">Build Android AAB</code> workflow will use the
          same signing key automatically.
        </AlertDescription>
      </Alert>
    </div>
  );
}
