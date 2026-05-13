import { useState } from "react";
import {
  Accessibility,
  Bell,
  BookOpen,
  Bug,
  Check,
  Mail,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
    <>
      {aboutContent?.body ? (
        <p className="whitespace-pre-line">{aboutContent.body}</p>
      ) : (
        <p><strong>{APP_NAME}</strong> is a curated clinical reference for OB/GYN practitioners.</p>
      )}
      <p className="text-muted-foreground text-xs">⚠️ For educational purposes only. Always follow local protocols and clinical judgment.</p>
      <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} — All rights reserved.</p>
    </>
  );

  if (id === "privacy") return (
    <>
      {privacyContent?.body ? (
        <p className="whitespace-pre-line">{privacyContent.body}</p>
      ) : (
        <p>We respect your privacy. Preferences are stored locally on your device.</p>
      )}
    </>
  );

  if (id === "terms") return (
    <>
      {termsContent?.body ? (
        <p className="whitespace-pre-line">{termsContent.body}</p>
      ) : (
        <p>Content is educational and not a substitute for professional clinical judgement.</p>
      )}
    </>
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
    <>
      <p>Need help using the app?</p>
      <ul className="list-disc space-y-1 pr-5">
        <li>Tap any scenario card to open detailed action steps.</li>
        <li>Use the search bar to find topics across all categories.</li>
        <li>The AI assistant (chat icon) answers free-text clinical questions.</li>
      </ul>
      <a href={`mailto:${supportEmail}`} className="inline-flex items-center gap-2 text-primary hover:underline">
        <Mail className="h-4 w-4" /> Email support
      </a>
    </>
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
  const [granted, setGranted] = useState(typeof Notification !== "undefined" && Notification.permission === "granted");

  const request = async () => {
    if (typeof Notification === "undefined") {
      toast.error("Not supported");
      return;
    }

    const result = await Notification.requestPermission();
    setGranted(result === "granted");
    if (result === "granted") toast.success("Notifications enabled");
  };

  return (
    <>
      <p className="text-xs text-muted-foreground">Get reminders for new case-of-the-day and updates.</p>
      <Button onClick={request} disabled={granted} className="w-full">
        <Bell className="mr-2 h-4 w-4" />
        {granted ? "Enabled" : "Enable Notifications"}
      </Button>
    </>
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
