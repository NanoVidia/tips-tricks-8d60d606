import { useEffect, useState } from "react";
import {
  Accessibility,
  Bell,
  BellRing,
  BookOpen,
  Bug,
  Check,
  Mail,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fireTestNotification } from "@/hooks/useLocalNotifications";
import { FaqSection } from "@/components/FaqSection";
import {
  APP_BUILD_DATE,
  APP_ID,
  APP_VERSION_NAME,
  APP_VERSION_CODE,
  APP_VERSION_LABEL,
} from "@/lib/appVersion";

// Re-exported so the rest of the app keeps importing { APP_VERSION } from here.
// Single source of truth lives in src/lib/appVersion.ts and is patched by the
// "Build Android AAB" GitHub Actions workflow.
export const APP_VERSION = APP_VERSION_NAME;
export const APP_BUILD = APP_VERSION_CODE;
export const APP_NAME = "Tips & Tricks — OB/GYN";

export const MENU_PAGE_IDS = [
  "about",
  "privacy",
  "terms",
  "contact",
  "faq",
  "help",
  "feedback",
  "version",
  "changelog",
  "licenses",
  "theme",
  "notifications",
  "accessibility",
  "bug",
  "sources",
] as const;

export type MenuPageId = typeof MENU_PAGE_IDS[number];

export function isMenuPageId(value: string | null | undefined): value is MenuPageId {
  return !!value && MENU_PAGE_IDS.includes(value as MenuPageId);
}

export function titleForMenuPage(
  id: MenuPageId,
  custom?: {
    aboutTitle?: string;
    privacyTitle?: string;
    termsTitle?: string;
  }
) {
  if (id === "about" && custom?.aboutTitle) return custom.aboutTitle;
  if (id === "privacy" && custom?.privacyTitle) return custom.privacyTitle;
  if (id === "terms" && custom?.termsTitle) return custom.termsTitle;

  const map: Record<MenuPageId, string> = {
    about: "About this app",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    contact: "Contact us",
    faq: "Frequently Asked Questions",
    help: "Help & Support",
    feedback: "Send Feedback",
    version: "Version Information",
    changelog: "What's New",
    licenses: "Open-source Licenses",
    theme: "Theme",
    notifications: "Notifications",
    accessibility: "Accessibility",
    bug: "Report a Bug",
    sources: "Scientific sources",
  };

  return map[id];
}

export function subtitleForMenuPage(id: MenuPageId) {
  const map: Record<MenuPageId, string> = {
    about: "Educational OB/GYN clinical reference",
    privacy: "How we handle your data",
    terms: "Conditions of use",
    contact: "Reach the team",
    faq: "Searchable answers across 7 topics",
    help: "Get assistance",
    feedback: "Help us improve",
    version: `v${APP_VERSION_NAME} · build ${APP_VERSION_CODE}`,
    changelog: "Recent updates",
    licenses: "Third-party software",
    theme: "Light or dark",
    notifications: "Manage alerts",
    accessibility: "Visual & motion preferences",
    sources: "Guidelines and evidence boundaries",
    bug: "Tell us what went wrong",
  };

  return map[id];
}

interface MenuPageBodyProps {
  id: MenuPageId;
  whatsapp: string;
  supportEmail: string;
  dark: boolean;
  onToggleTheme: () => void;
  aboutContent?: { title?: string; body?: string } | null;
  privacyContent?: { title?: string; body?: string } | null;
  termsContent?: { title?: string; body?: string } | null;
}

export function MenuPageBody({
  id,
  whatsapp,
  supportEmail,
  dark,
  onToggleTheme,
  aboutContent,
  privacyContent,
  termsContent,
}: MenuPageBodyProps) {
  if (id === "about") return (
    <div className="space-y-4 text-sm leading-relaxed">
      {aboutContent?.body ? (
        <p className="whitespace-pre-line">{aboutContent.body}</p>
      ) : (
        <>
          <p>
            <strong>{APP_NAME}</strong> is a fast, evidence-anchored chairside reference built for
            obstetricians, gynecologists, residents, midwives, and senior medical students who need
            confident answers in seconds — not minutes scrolling through textbooks.
          </p>

          <div>
            <p className="font-semibold text-foreground mb-1.5">What you get</p>
            <ul className="list-disc space-y-1 pr-5 text-muted-foreground">
              <li>Curated clinical scenarios with stepwise action plans and red flags.</li>
              <li>Searchable MCQ bank with explanations for board and exam prep.</li>
              <li>Surgery library, calculators, and an AI assistant for free-text questions.</li>
              <li>Aligned with ACOG, RCOG, NICE, WHO, FIGO and SMFM where relevant.</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1.5">Built for real practice</p>
            <p className="text-muted-foreground">
              Every entry is written by clinicians, reviewed against published guidelines, and
              updated as recommendations evolve. Works offline once loaded, respects your data, and
              stays out of your way during ward rounds, clinic, and on-call.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            ⚠️ Educational reference only. Not a diagnostic tool. Always follow your local
            protocols, individual patient assessment, and your clinical judgement.
          </p>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} — All rights reserved.</p>
        </>
      )}
    </div>
  );

  if (id === "privacy") return (
    <div className="space-y-4 text-sm leading-relaxed">
      {privacyContent?.body ? (
        <p className="whitespace-pre-line">{privacyContent.body}</p>
      ) : (
        <>
          <p className="text-muted-foreground">
            Effective date: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <p>
            Your privacy is fundamental to how this app is built. We collect the minimum data
            required to run the service and we never sell, rent, or trade your information.
          </p>

          <div>
            <p className="font-semibold text-foreground mb-1.5">What we store</p>
            <ul className="list-disc space-y-1 pr-5 text-muted-foreground">
              <li>App preferences (theme, language, accessibility) — stored locally on your device.</li>
              <li>Saved bookmarks, recent searches, and trial state — stored locally on your device.</li>
              <li>Anonymous device identifiers used only for license and trial validation.</li>
              <li>Optional crash reports and basic usage counters to fix bugs and improve quality.</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1.5">What we do NOT collect</p>
            <ul className="list-disc space-y-1 pr-5 text-muted-foreground">
              <li>Patient names, medical records, or any identifiable clinical data.</li>
              <li>Your contacts, photos, microphone, location, or background activity.</li>
              <li>Behavioral tracking or third-party advertising profiles.</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1.5">AI assistant</p>
            <p className="text-muted-foreground">
              When you use the AI assistant, your question is sent to our AI provider solely to
              generate the answer. Do not enter identifiable patient information. Conversations are
              not used to train external models.
            </p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1.5">Your rights</p>
            <p className="text-muted-foreground">
              You can clear all local data at any time from <em>Menu → Reset Local Data</em>, or
              uninstall the app to remove everything from your device. For access, correction, or
              deletion requests, contact us at <a href={`mailto:${"Dr.sahar.ask@gmail.com"}`} className="text-primary hover:underline">our support email</a>.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            This app is intended for healthcare professionals and is not directed at children under 16.
          </p>
        </>
      )}
    </div>
  );

  if (id === "terms") return (
    <div className="space-y-4 text-sm leading-relaxed">
      {termsContent?.body ? (
        <p className="whitespace-pre-line">{termsContent.body}</p>
      ) : (
        <>
          <p className="text-muted-foreground">
            Effective date: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <p>
            By installing or using <strong>{APP_NAME}</strong> you agree to the terms below. If you
            do not agree, please stop using the app and uninstall it from your device.
          </p>

          <div>
            <p className="font-semibold text-foreground mb-1.5">1. Educational use only</p>
            <p className="text-muted-foreground">
              All content is provided for professional education and reference. It is <strong>not</strong> a
              substitute for individualized clinical assessment, diagnosis, or treatment. Final
              decisions remain the sole responsibility of the treating clinician.
            </p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1.5">2. No doctor–patient relationship</p>
            <p className="text-muted-foreground">
              Using this app does not create a doctor–patient relationship with the authors, owners,
              or contributors. The app does not provide emergency services — for medical
              emergencies, contact your local emergency number immediately.
            </p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1.5">3. Accuracy & updates</p>
            <p className="text-muted-foreground">
              We work to keep content aligned with current guidelines (ACOG, RCOG, NICE, WHO, FIGO,
              SMFM), but medicine evolves. Always cross-check with your local protocols and the
              latest primary sources before acting.
            </p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1.5">4. Acceptable use</p>
            <p className="text-muted-foreground">
              Do not reverse-engineer, scrape, resell, or redistribute the content. Do not enter
              personally identifiable patient data into the AI assistant. Do not use the app in any
              way that violates applicable laws or professional standards.
            </p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1.5">5. Limitation of liability</p>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, the authors and publishers are not liable for
              any direct or indirect damages arising from clinical decisions, omissions, or errors
              related to the use of this app. The app is provided "as is" without warranties of any
              kind, express or implied.
            </p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1.5">6. Changes</p>
            <p className="text-muted-foreground">
              We may update these terms to reflect new features or legal requirements. Continued use
              after an update constitutes acceptance of the revised terms.
            </p>
          </div>
        </>
      )}
    </div>
  );

  if (id === "contact") return (
    <div className="space-y-3">
      <a href={`mailto:${supportEmail}`} className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted">
        <Mail className="h-4 w-4 text-primary" /> {supportEmail}
      </a>
      {whatsapp && (
        <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted">
          <MessageSquare className="h-4 w-4 text-primary" /> WhatsApp: +{whatsapp}
        </a>
      )}
    </div>
  );

  if (id === "faq") return <FaqSection />;

  if (id === "help") return (
    <div className="space-y-4 text-sm leading-relaxed">
      <p>
        Get the most out of <strong>{APP_NAME}</strong> in under a minute. Here are the moves that
        most clinicians use every shift.
      </p>

      <div>
        <p className="font-semibold text-foreground mb-1.5">⚡ Quick start</p>
        <ul className="list-disc space-y-1 pr-5 text-muted-foreground">
          <li>Use the search bar — it handles typos and synonyms across 200+ entries (try "PPH", "ectopic", "PCOS").</li>
          <li>Tap any scenario card for stepwise actions, red flags, and dosing guidance.</li>
          <li>The AI assistant (chat icon) answers free-text clinical questions in plain English.</li>
        </ul>
      </div>

      <div>
        <p className="font-semibold text-foreground mb-1.5">🎯 Power features</p>
        <ul className="list-disc space-y-1 pr-5 text-muted-foreground">
          <li><strong>Bookmarks</strong> — long-press or tap the bookmark icon to save anything for offline review.</li>
          <li><strong>MCQ bank</strong> — exam-style questions with explanations; tracks your weak topics.</li>
          <li><strong>Calculators</strong> — BMI, EDD, Bishop score, eGFR, and more, all under <em>Tools</em>.</li>
          <li><strong>Surgery library</strong> — illustrated step-by-step procedures for residents.</li>
          <li><strong>Dark mode</strong> — tap the moon/sun in the header; perfect for night shifts.</li>
        </ul>
      </div>

      <div>
        <p className="font-semibold text-foreground mb-1.5">🛠 Troubleshooting</p>
        <ul className="list-disc space-y-1 pr-5 text-muted-foreground">
          <li>Content looks stale? Pull down on the home screen to refresh.</li>
          <li>Something broken? Use <em>Menu → Report a Bug</em> — we read every report.</li>
          <li>Want to start fresh? <em>Menu → Reset Local Data</em> clears bookmarks and preferences.</li>
        </ul>
      </div>

      <div>
        <p className="font-semibold text-foreground mb-1.5">💬 Still need help?</p>
        <p className="text-muted-foreground">
          The team replies to every email — usually within one working day.
        </p>
        <a href={`mailto:${supportEmail}`} className="mt-2 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-primary transition-colors hover:bg-muted">
          <Mail className="h-4 w-4" /> Email support
        </a>
      </div>
    </div>
  );


  if (id === "feedback") return <FeedbackForm supportEmail={supportEmail} />;
  if (id === "bug") return <BugForm supportEmail={supportEmail} />;

  if (id === "version") return (
    <div className="space-y-2">
      <Row label="Version name" value={APP_VERSION_NAME} />
      <Row label="Version code" value={String(APP_VERSION_CODE)} />
      <Row label="Build date" value={APP_BUILD_DATE} />
      <Row label="Application ID" value={APP_ID} mono />
      <Row label="Full" value={APP_VERSION_LABEL} />
      <Row label="Mode" value={import.meta.env.MODE} />
      <Row label="Platform" value={navigator.platform || "Web"} />
      <Row label="User agent" value={navigator.userAgent.slice(0, 40) + "…"} mono />
    </div>
  );

  if (id === "changelog") return (
    <ul className="space-y-3">
      {[
        ["1.4.0", "Added pro app menu (19 items), improved search dismissal, fixed ad banner overlap."],
        ["1.3.0", "AI assistant, exams comparison, surgery library."],
        ["1.2.0", "Clinical scenarios database with search."],
        ["1.0.0", "Initial release."],
      ].map(([v, n]) => (
        <li key={v} className="border-l-2 border-primary/40 pl-3 pr-3">
          <p className="font-semibold text-primary">v{v}</p>
          <p className="text-xs text-muted-foreground">{n}</p>
        </li>
      ))}
    </ul>
  );


  if (id === "licenses") return (
    <ul className="space-y-1 font-mono text-xs text-muted-foreground">
      {[
        "React (MIT)",
        "Vite (MIT)",
        "Tailwind CSS (MIT)",
        "Radix UI (MIT)",
        "Framer Motion (MIT)",
        "Lucide (ISC)",
        "Supabase JS (MIT)",
        "TanStack Query (MIT)",
      ].map((license) => (
        <li key={license}>• {license}</li>
      ))}
    </ul>
  );

  if (id === "sources") return <ScientificSources />;
  if (id === "theme") return <ThemePanel dark={dark} onToggleTheme={onToggleTheme} />;
  if (id === "notifications") return <NotificationsPanel />;
  if (id === "accessibility") return <AccessibilityPanel />;

  return null;
}

function ThemePanel({ dark, onToggleTheme }: { dark: boolean; onToggleTheme: () => void }) {
  return (
    <div className="space-y-2">
      {[{ k: "light", l: "Light" }, { k: "dark", l: "Dark" }].map((theme) => {
        const active = (theme.k === "dark") === dark;
        return (
          <button
            key={theme.k}
            onClick={() => { if (!active) onToggleTheme(); }}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted"
          >
            <span>{theme.l}</span>
            {active && <Check className="h-4 w-4 text-primary" />}
          </button>
        );
      })}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/40 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`break-all text-right text-xs ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function ScientificSources() {
  const sources = [
    ["ACOG", "Practice Bulletins, Clinical Practice Guidelines and Committee Opinions for obstetrics and gynecology topics."],
    ["RCOG", "Green-top Guidelines and patient-safety guidance for obstetric emergencies and operative practice."],
    ["NICE", "Evidence-based UK guidance for antenatal care, diabetes, preterm birth and related pathways."],
    ["WHO", "Global maternal health recommendations including postpartum hemorrhage and antenatal care guidance."],
    ["ESC", "Cardiovascular guidance relevant to pregnancy-associated cardiac risk and thromboembolic care."],
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-muted-foreground">
        The app should be treated as an educational clinical companion. It highlights topics and workflows, but it does not replace official guidelines, local hospital protocols, senior review, or individualized patient assessment.
      </p>
      <div className="space-y-2">
        {sources.map(([name, note]) => (
          <div key={name} className="rounded-lg border border-border/70 bg-muted/30 p-3">
            <p className="flex items-center gap-2 font-bold text-foreground">
              <BookOpen className="h-4 w-4 text-primary" />
              {name}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{note}</p>
          </div>
        ))}
      </div>
      <p className="text-xs font-semibold text-foreground/80">
        No generated image, protocol, AI answer, or summary should be considered authoritative unless verified against the current source document and local policy.
      </p>
    </div>
  );
}

function FeedbackForm({ supportEmail }: { supportEmail: string }) {
  const [msg, setMsg] = useState("");

  return (
    <>
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="Tell us what you love, what's missing, or what could be better…"
        className="min-h-[120px] w-full rounded-lg border border-border bg-background p-3 text-sm"
      />
      <a
        href={`mailto:${supportEmail}?subject=App Feedback&body=${encodeURIComponent(msg)}`}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
      >
        <Mail className="h-4 w-4" /> Send via Email
      </a>
    </>
  );
}

function BugForm({ supportEmail }: { supportEmail: string }) {
  const [msg, setMsg] = useState("");
  const meta = `\n\n---\nVersion: ${APP_VERSION}\nURL: ${window.location.href}\nUA: ${navigator.userAgent}`;

  return (
    <>
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="Steps to reproduce, expected vs actual behaviour…"
        className="min-h-[120px] w-full rounded-lg border border-border bg-background p-3 text-sm"
      />
      <a
        href={`mailto:${supportEmail}?subject=Bug Report&body=${encodeURIComponent(msg + meta)}`}
        className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground hover:opacity-90"
      >
        <Bug className="h-4 w-4" /> Send Bug Report
      </a>
    </>
  );
}

function NotificationsPanel() {
  const [native, setNative] = useState(false);
  const [granted, setGranted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core").catch(() => ({ Capacitor: null as any }));
        const isNative = !!Capacitor?.isNativePlatform?.();
        setNative(isNative);
        if (isNative) {
          const { LocalNotifications } = await import("@capacitor/local-notifications");
          const perm = await LocalNotifications.checkPermissions();
          setGranted(perm.display === "granted");
        } else {
          setGranted(typeof Notification !== "undefined" && Notification.permission === "granted");
        }
      } catch {
        /* noop */
      }
    })();
  }, []);

  const request = async () => {
    setBusy(true);
    try {
      if (native) {
        const { LocalNotifications } = await import("@capacitor/local-notifications");
        const req = await LocalNotifications.requestPermissions();
        const ok = req.display === "granted";
        setGranted(ok);
        if (ok) {
          toast.success("Notifications enabled");
        } else {
          toast.message("Notifications disabled", {
            description: "Open System Settings → Notifications → enable this app.",
          });
        }
      } else {
        if (typeof Notification === "undefined") {
          toast.error("Not supported in this browser");
          return;
        }
        const result = await Notification.requestPermission();
        setGranted(result === "granted");
        if (result === "granted") toast.success("Notifications enabled");
      }
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    try {
      const result = await fireTestNotification();
      if (result === "ok") {
        toast.success("A test notification will arrive in 5 seconds");
      } else if (result === "denied") {
        toast.error("Notifications denied — enable them in system settings");
      } else if (result === "web") {
        toast.info("Full notification testing is available only inside the mobile app");
      } else {
        toast.error("Failed to send the test notification");
      }
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Get daily reminders, Question of the Day alerts, and important updates.
      </p>
      <Button onClick={request} disabled={granted || busy} className="w-full">
        <Bell className="mr-2 h-4 w-4" />
        {granted ? "Notifications enabled" : busy ? "Working…" : "Enable notifications"}
      </Button>
      {native && (
        <Button onClick={sendTest} disabled={testing} variant="outline" className="w-full">
          <BellRing className="mr-2 h-4 w-4" />
          {testing ? "Sending…" : "Send a test notification"}
        </Button>
      )}
      {!native && (
        <p className="text-[11px] text-muted-foreground/80 text-center">
          Full notification testing is available only inside the mobile app.
        </p>
      )}
    </div>
  );
}

function AccessibilityPanel() {
  const [reduce, setReduce] = useState(localStorage.getItem("a11y_reduce") === "1");
  const [large, setLarge] = useState(localStorage.getItem("a11y_large") === "1");

  const toggle = (key: string, cls: string, value: boolean, setValue: (next: boolean) => void) => {
    const next = !value;
    setValue(next);
    localStorage.setItem(key, next ? "1" : "0");
    document.documentElement.classList.toggle(cls, next);
  };

  return (
    <div className="space-y-2">
      <button onClick={() => toggle("a11y_reduce", "reduce-motion", reduce, setReduce)} className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted">
        <span>Reduce motion</span>
        {reduce && <Check className="h-4 w-4 text-primary" />}
      </button>
      <button onClick={() => toggle("a11y_large", "large-text", large, setLarge)} className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted">
        <span>Larger text</span>
        {large && <Check className="h-4 w-4 text-primary" />}
      </button>
    </div>
  );
}
