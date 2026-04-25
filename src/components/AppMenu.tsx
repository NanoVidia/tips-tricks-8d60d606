import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreVertical, Info, Shield, FileText, Mail, HelpCircle, LifeBuoy,
  MessageSquare, Star, Share2, Tag, History, Award, Scale, Languages,
  Palette, Bell, Accessibility, Bug, LogOut, ExternalLink, Check, Heart,
  BookOpen, Stethoscope, ClipboardCheck,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAppSettings } from "@/hooks/useAppSettings";

const APP_VERSION = "1.4.0";
const APP_NAME = "Tips & Tricks — OB/GYN";

type DialogId =
  | "about" | "privacy" | "terms" | "contact" | "faq" | "help"
  | "feedback" | "version" | "changelog" | "credits" | "licenses"
  | "theme" | "notifications" | "accessibility" | "bug" | "sources" | null;

interface Props {
  dark: boolean;
  onToggleTheme: () => void;
}

export function AppMenu({ dark, onToggleTheme }: Props) {
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogId>(null);
  const navigate = useNavigate();
  const { get, all } = useAppSettings();
  const whatsapp = String(get("whatsapp_number") || "").replace(/\D/g, "");
  const settingsMap = (all as Record<string, any>) || {};
  const supportEmail = typeof settingsMap.support_email === "string"
    ? settingsMap.support_email
    : "support@tips-tricks.app";
  const aboutContent = settingsMap.about_content || null;
  const privacyContent = settingsMap.privacy_content || null;
  const termsContent = settingsMap.terms_content || null;

  const close = () => { setDialog(null); setOpen(false); };

  const handleShare = async () => {
    const data = { title: APP_NAME, text: "OB/GYN clinical reference", url: window.location.origin };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(data.url); toast.success("Link copied"); }
    } catch { /* user cancelled */ }
    setOpen(false);
  };

  const handleRate = () => {
    window.open("https://lovable.app", "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Local data cleared");
    setTimeout(() => window.location.reload(), 600);
  };

  const sections: Array<{ title: string; items: Array<{ icon: any; label: string; action: () => void; danger?: boolean }> }> = [
    { title: "Clinical reference", items: [
      { icon: Info, label: "About this app", action: () => setDialog("about") },
      { icon: ClipboardCheck, label: "Scientific sources", action: () => setDialog("sources") },
      { icon: HelpCircle, label: "Clinical FAQ", action: () => setDialog("faq") },
      { icon: LifeBuoy, label: "How to use", action: () => setDialog("help") },
    ]},
    { title: "Preferences", items: [
      { icon: Palette, label: "Theme", action: () => setDialog("theme") },
      { icon: Bell, label: "Notifications", action: () => setDialog("notifications") },
      { icon: Accessibility, label: "Accessibility", action: () => setDialog("accessibility") },
    ]},
    { title: "Support", items: [
      { icon: Mail, label: "Contact", action: () => setDialog("contact") },
      { icon: MessageSquare, label: "Feedback", action: () => setDialog("feedback") },
      { icon: Bug, label: "Report a Bug", action: () => setDialog("bug") },
      { icon: Share2, label: "Share App", action: handleShare },
      { icon: Star, label: "Rate Us", action: handleRate },
      { icon: Heart, label: "Donate / Support", action: () => window.open("https://lovable.app", "_blank") },
    ]},
    { title: "Legal & build", items: [
      { icon: Shield, label: "Privacy Policy", action: () => setDialog("privacy") },
      { icon: FileText, label: "Terms of Use", action: () => setDialog("terms") },
      { icon: Scale, label: "Open-source licenses", action: () => setDialog("licenses") },
      { icon: Award, label: "Credits", action: () => setDialog("credits") },
      { icon: History, label: "Changelog", action: () => setDialog("changelog") },
      { icon: Tag, label: `Version ${APP_VERSION}`, action: () => setDialog("version") },
      { icon: LogOut, label: "Reset Local Data", action: handleLogout, danger: true },
    ]},
  ];

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="p-2 rounded-xl bg-card border border-border/60 hover:border-primary/50 hover:bg-muted transition-all shrink-0 self-start"
            aria-label="App menu"
          >
            <MoreVertical className="w-4 h-4 text-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 max-h-[80vh] overflow-y-auto">
          <DropdownMenuLabel className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
            {APP_NAME}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {sections.map((section) => (
            <div key={section.title}>
              <DropdownMenuLabel className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground/80">
                {section.title}
              </DropdownMenuLabel>
              {section.items.map((it) => (
                <DropdownMenuItem
                  key={it.label}
                  onClick={(e) => { e.preventDefault(); it.action(); }}
                  className={`gap-2.5 cursor-pointer min-h-9 ${it.danger ? "text-destructive focus:text-destructive" : ""}`}
                >
                  <it.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 leading-tight">{it.label}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-editorial text-xl">
              {(dialog === "about" && aboutContent?.title)
                || (dialog === "privacy" && privacyContent?.title)
                || (dialog === "terms" && termsContent?.title)
                || titleFor(dialog)}
            </DialogTitle>
            <DialogDescription className="text-xs">{subtitleFor(dialog)}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="text-sm leading-relaxed space-y-3 pb-2">
              <DialogBody
                id={dialog}
                whatsapp={whatsapp}
                supportEmail={supportEmail}
                dark={dark}
                onToggleTheme={onToggleTheme}
                aboutContent={aboutContent}
                privacyContent={privacyContent}
                termsContent={termsContent}
              />
            </div>
          </ScrollArea>
          <div className="pt-3 border-t flex justify-end">
            <Button variant="outline" size="sm" onClick={close}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function titleFor(id: DialogId): string {
  const map: Record<string, string> = {
    about: "About this app", privacy: "Privacy Policy", terms: "Terms of Use",
    contact: "Contact us", faq: "Frequently Asked Questions", help: "Help & Support",
    feedback: "Send Feedback", version: "Version Information", changelog: "What's New",
    credits: "Credits & Acknowledgements", licenses: "Open-source Licenses",
    theme: "Theme", notifications: "Notifications",
    accessibility: "Accessibility", bug: "Report a Bug", sources: "Scientific sources",
  };
  return map[id || ""] || "";
}

function subtitleFor(id: DialogId): string {
  const map: Record<string, string> = {
    about: "Educational OB/GYN clinical reference",
    privacy: "How we handle your data",
    terms: "Conditions of use",
    contact: "Reach the team",
    faq: "Common questions",
    help: "Get assistance",
    feedback: "Help us improve",
    version: `Build ${APP_VERSION}`,
    changelog: "Recent updates",
    credits: "People & sources",
    licenses: "Third-party software",
    theme: "Light or dark",
    notifications: "Manage alerts",
    accessibility: "Visual & motion preferences",
    sources: "Guidelines and evidence boundaries",
    bug: "Tell us what went wrong",
  };
  return map[id || ""] || "";
}

function DialogBody({
  id, whatsapp, supportEmail, dark, onToggleTheme,
  aboutContent, privacyContent, termsContent,
}: {
  id: DialogId; whatsapp: string; supportEmail: string; dark: boolean; onToggleTheme: () => void;
  aboutContent?: { title?: string; body?: string } | null;
  privacyContent?: { title?: string; body?: string } | null;
  termsContent?: { title?: string; body?: string } | null;
}) {
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
      <a href={`mailto:${supportEmail}`} className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted">
        <Mail className="w-4 h-4 text-primary" /> {supportEmail}
      </a>
      {whatsapp && (
        <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted">
          <MessageSquare className="w-4 h-4 text-primary" /> WhatsApp: +{whatsapp}
        </a>
      )}
    </div>
  );

  if (id === "faq") return (
    <ul className="space-y-3">
      {[
        ["What are the main source families?", "Clinical entries are aligned with established guideline bodies where relevant: ACOG, RCOG, NICE, WHO and ESC."],
        ["Is this a guideline replacement?", "No. It is an educational bedside reference. Always verify against local protocols and current official guidance."],
        ["Does it work offline?", "Some interface data may remain available locally, but AI chat, videos and database updates need internet."],
        ["Can I bookmark items?", "Yes — use the bookmark icon on tools and surgeries."],
        ["Should patient identifiers be entered?", "No. Do not enter names, MRNs, phone numbers or identifiable patient data into free-text tools."],
      ].map(([q, a]) => (
        <li key={q}><p className="font-semibold">{q}</p><p className="text-muted-foreground">{a}</p></li>
      ))}
    </ul>
  );

  if (id === "help") return (
    <>
      <p>Need help using the app?</p>
      <ul className="list-disc pr-5 space-y-1">
        <li>Tap any scenario card to open detailed action steps.</li>
        <li>Use the search bar to find topics across all categories.</li>
        <li>The AI assistant (chat icon) answers free-text clinical questions.</li>
      </ul>
      <a href={`mailto:${supportEmail}`} className="inline-flex items-center gap-2 text-primary hover:underline">
        <Mail className="w-4 h-4" /> Email support
      </a>
    </>
  );

  if (id === "feedback") return <FeedbackForm supportEmail={supportEmail} />;
  if (id === "bug") return <BugForm supportEmail={supportEmail} />;

  if (id === "version") return (
    <div className="space-y-2">
      <Row label="Version" value={APP_VERSION} />
      <Row label="Build" value={import.meta.env.MODE} />
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
        <li key={v} className="border-l-2 border-primary/40 pr-3 pl-3">
          <p className="font-semibold text-primary">v{v}</p>
          <p className="text-muted-foreground text-xs">{n}</p>
        </li>
      ))}
    </ul>
  );

  if (id === "credits") return (
    <ul className="space-y-2">
      <li>Clinical content is structured as educational OB/GYN reference material.</li>
      <li>Icons by <a href="https://lucide.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Lucide</a> & <a href="https://phosphoricons.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Phosphor</a>.</li>
      <li>Built with React, Vite, Tailwind CSS and Lovable Cloud.</li>
      <li>Reference families used across the app include ACOG, RCOG, NICE, WHO and ESC where applicable.</li>
    </ul>
  );

  if (id === "licenses") return (
    <ul className="space-y-1 text-xs font-mono text-muted-foreground">
      {["React (MIT)", "Vite (MIT)", "Tailwind CSS (MIT)", "Radix UI (MIT)", "Framer Motion (MIT)", "Lucide (ISC)", "Supabase JS (MIT)", "TanStack Query (MIT)"].map(l => (
        <li key={l}>• {l}</li>
      ))}
    </ul>
  );

  if (id === "sources") return <ScientificSources />;

  if (id === "theme") return (
    <div className="space-y-2">
      {[{ k: "light", l: "Light" }, { k: "dark", l: "Dark" }].map(t => {
        const active = (t.k === "dark") === dark;
        return (
          <button
            key={t.k}
            onClick={() => { if (!active) onToggleTheme(); }}
            className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted"
          >
            <span>{t.l}</span>
            {active && <Check className="w-4 h-4 text-primary" />}
          </button>
        );
      })}
    </div>
  );

  if (id === "notifications") return (
    <NotificationsPanel />
  );

  if (id === "accessibility") return (
    <AccessibilityPanel />
  );

  return null;
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-border/40">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={`text-xs ${mono ? "font-mono" : ""} text-right break-all`}>{value}</span>
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
        className="w-full min-h-[120px] p-3 rounded-lg border bg-background text-sm"
      />
      <a
        href={`mailto:${supportEmail}?subject=App Feedback&body=${encodeURIComponent(msg)}`}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90"
      >
        <Mail className="w-4 h-4" /> Send via Email
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
        className="w-full min-h-[120px] p-3 rounded-lg border bg-background text-sm"
      />
      <a
        href={`mailto:${supportEmail}?subject=Bug Report&body=${encodeURIComponent(msg + meta)}`}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm hover:opacity-90"
      >
        <Bug className="w-4 h-4" /> Send Bug Report
      </a>
    </>
  );
}

function NotificationsPanel() {
  const [granted, setGranted] = useState(typeof Notification !== "undefined" && Notification.permission === "granted");
  const request = async () => {
    if (typeof Notification === "undefined") { toast.error("Not supported"); return; }
    const r = await Notification.requestPermission();
    setGranted(r === "granted");
    if (r === "granted") toast.success("Notifications enabled");
  };
  return (
    <>
      <p className="text-muted-foreground text-xs">Get reminders for new case-of-the-day and updates.</p>
      <Button onClick={request} disabled={granted} className="w-full">
        <Bell className="w-4 h-4 mr-2" />
        {granted ? "Enabled" : "Enable Notifications"}
      </Button>
    </>
  );
}

function AccessibilityPanel() {
  const [reduce, setReduce] = useState(localStorage.getItem("a11y_reduce") === "1");
  const [large, setLarge] = useState(localStorage.getItem("a11y_large") === "1");
  const toggle = (key: string, cls: string, val: boolean, set: (b: boolean) => void) => {
    const next = !val;
    set(next);
    localStorage.setItem(key, next ? "1" : "0");
    document.documentElement.classList.toggle(cls, next);
  };
  return (
    <div className="space-y-2">
      <button onClick={() => toggle("a11y_reduce", "reduce-motion", reduce, setReduce)} className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted">
        <span>Reduce motion</span>
        {reduce && <Check className="w-4 h-4 text-primary" />}
      </button>
      <button onClick={() => toggle("a11y_large", "large-text", large, setLarge)} className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted">
        <span>Larger text</span>
        {large && <Check className="w-4 h-4 text-primary" />}
      </button>
    </div>
  );
}
