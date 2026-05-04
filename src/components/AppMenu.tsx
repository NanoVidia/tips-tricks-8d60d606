import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreVertical, Info, Shield, FileText, Mail, HelpCircle, LifeBuoy,
  MessageSquare, Star, Share2, Tag, History, Award, Scale,
  Palette, Bell, Accessibility, Bug, LogOut, Heart, ClipboardCheck,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAppSettings } from "@/hooks/useAppSettings";
import { APP_NAME, APP_VERSION, type MenuPageId } from "@/components/app-menu-content";

interface Props {
  dark: boolean;
  onToggleTheme: () => void;
}

export function AppMenu({ dark, onToggleTheme }: Props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { get, all } = useAppSettings();
  const settingsMap = (all as Record<string, any>) || {};

  const openPage = (page: MenuPageId) => {
    navigate(`/menu/${page}`, {
      state: {
        dark,
        settingsMap,
      },
    });
    setOpen(false);
  };

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
      { icon: Info, label: "About this app", action: () => openPage("about") },
      { icon: ClipboardCheck, label: "Scientific sources", action: () => openPage("sources") },
      { icon: HelpCircle, label: "Clinical FAQ", action: () => openPage("faq") },
      { icon: LifeBuoy, label: "How to use", action: () => openPage("help") },
    ]},
    { title: "Preferences", items: [
      { icon: Palette, label: "Theme", action: () => openPage("theme") },
      { icon: Bell, label: "Notifications", action: () => openPage("notifications") },
      { icon: Accessibility, label: "Accessibility", action: () => openPage("accessibility") },
    ]},
    { title: "Support", items: [
      { icon: Mail, label: "Contact", action: () => openPage("contact") },
      { icon: MessageSquare, label: "Feedback", action: () => openPage("feedback") },
      { icon: Bug, label: "Report a Bug", action: () => openPage("bug") },
      { icon: Share2, label: "Share App", action: handleShare },
      { icon: Star, label: "Rate Us", action: handleRate },
      { icon: Heart, label: "Donate / Support", action: () => window.open("https://lovable.app", "_blank") },
    ]},
    { title: "Legal & build", items: [
      { icon: Shield, label: "Privacy Policy", action: () => openPage("privacy") },
      { icon: FileText, label: "Terms of Use", action: () => openPage("terms") },
      { icon: Scale, label: "Open-source licenses", action: () => openPage("licenses") },
      { icon: Award, label: "Credits", action: () => openPage("credits") },
      { icon: History, label: "Changelog", action: () => openPage("changelog") },
      { icon: Tag, label: `Version ${APP_VERSION}`, action: () => openPage("version") },
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

    </>
  );
}
