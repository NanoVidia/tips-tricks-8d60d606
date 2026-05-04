import { useNavigate } from "react-router-dom";
import {
  Info, Shield, FileText, Mail, HelpCircle, LifeBuoy,
  MessageSquare, Star, Tag, History, Award, Scale,
  Palette, Bell, Accessibility, Bug, LogOut, ClipboardCheck,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { APP_NAME, APP_VERSION, type MenuPageId } from "@/components/app-menu-content";

type Item = {
  icon: any;
  label: string;
  hint?: string;
  action: () => void;
  danger?: boolean;
};

export default function MenuHub() {
  const navigate = useNavigate();
  const openPage = (page: MenuPageId) => navigate(`/menu/${page}`);


  const handleRate = () => window.open("https://lovable.app", "_blank", "noopener,noreferrer");

  const handleLogout = () => {
    if (!confirm("Reset all local data?")) return;
    localStorage.clear();
    toast.success("Local data cleared");
    setTimeout(() => window.location.reload(), 600);
  };

  const sections: Array<{ title: string; items: Item[] }> = [
    { title: "Clinical reference", items: [
      { icon: Info, label: "About this app", hint: "What this is and isn't", action: () => openPage("about") },
      { icon: ClipboardCheck, label: "Scientific sources", hint: "Guidelines & evidence", action: () => openPage("sources") },
      { icon: HelpCircle, label: "Clinical FAQ", hint: "Common questions", action: () => openPage("faq") },
      { icon: LifeBuoy, label: "How to use", hint: "Quick walkthrough", action: () => openPage("help") },
    ]},
    { title: "Preferences", items: [
      { icon: Palette, label: "Theme", hint: "Light or dark", action: () => openPage("theme") },
      { icon: Bell, label: "Notifications", hint: "Manage alerts", action: () => openPage("notifications") },
      { icon: Accessibility, label: "Accessibility", hint: "Motion & contrast", action: () => openPage("accessibility") },
    ]},
    { title: "Support", items: [
      { icon: Mail, label: "Contact", action: () => openPage("contact") },
      { icon: MessageSquare, label: "Feedback", action: () => openPage("feedback") },
      { icon: Bug, label: "Report a bug", action: () => openPage("bug") },
      
      { icon: Star, label: "Rate us", action: handleRate },
      
    ]},
    { title: "Legal & build", items: [
      { icon: Shield, label: "Privacy Policy", action: () => openPage("privacy") },
      { icon: FileText, label: "Terms of Use", action: () => openPage("terms") },
      { icon: Scale, label: "Open-source licenses", action: () => openPage("licenses") },
      { icon: Award, label: "Credits", action: () => openPage("credits") },
      { icon: History, label: "Changelog", action: () => openPage("changelog") },
      { icon: Tag, label: `Version ${APP_VERSION}`, action: () => openPage("version") },
      { icon: LogOut, label: "Reset local data", action: handleLogout, danger: true },
    ]},
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-lg flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background px-5 py-5">
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{APP_NAME}</p>
          <h1 className="mt-1 text-2xl font-bold leading-tight">Menu</h1>
          <p className="mt-1 text-sm text-muted-foreground">Settings, support, and information</p>
        </header>

        <main className="flex-1 px-4 py-5 space-y-7">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {section.title}
              </h2>
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm divide-y divide-border/60">
                {section.items.map((it) => {
                  const Icon = it.icon;
                  return (
                    <button
                      key={it.label}
                      onClick={it.action}
                      className={`group flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors active:bg-muted/80 hover:bg-muted/50 ${it.danger ? "text-destructive" : ""}`}
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${it.danger ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                        <Icon className="h-5 w-5" strokeWidth={2.2} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[15px] font-semibold leading-tight">{it.label}</span>
                        {it.hint && <span className="mt-0.5 block text-xs text-muted-foreground">{it.hint}</span>}
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
