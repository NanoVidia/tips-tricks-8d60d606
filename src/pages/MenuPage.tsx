import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  APP_NAME,
  MenuPageBody,
  isMenuPageId,
  subtitleForMenuPage,
  titleForMenuPage,
  type MenuPageId,
} from "@/components/app-menu-content";

type LocationState = {
  dark?: boolean;
};

export default function MenuPage() {
  const { pageId } = useParams();
  const location = useLocation();
  const { get, all } = useAppSettings();
  const settingsMap = useMemo(() => ((all as Record<string, any>) || {}), [all]);
  const currentPage = isMenuPageId(pageId) ? (pageId as MenuPageId) : null;
  const state = (location.state as LocationState | null) ?? null;
  const [dark, setDark] = useState(() => {
    if (typeof state?.dark === "boolean") return state.dark;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, [currentPage]);

  if (!currentPage) {
    return <Navigate to="/" replace />;
  }

  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme_mode", next ? "dark" : "light");
      return next;
    });
  };

  const whatsapp = String(get("whatsapp_number") || "").replace(/\D/g, "");
  const supportEmail = typeof settingsMap.support_email === "string"
    ? settingsMap.support_email
    : "Dr.sahar.ask@gmail.com";
  const aboutContent = settingsMap.about_content || null;
  const privacyContent = settingsMap.privacy_content || null;
  const termsContent = settingsMap.terms_content || null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col">
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95 px-4 py-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <Link to="/" aria-label="Back to home" className="rounded-xl border border-border/60 bg-card p-2 transition-colors hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{APP_NAME}</p>
              <h1 className="mt-1 text-xl font-semibold leading-tight">
                {titleForMenuPage(currentPage, {
                  aboutTitle: aboutContent?.title,
                  privacyTitle: privacyContent?.title,
                  termsTitle: termsContent?.title,
                })}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">{subtitleForMenuPage(currentPage)}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-5">
          <section className="rounded-[24px] border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur-sm">
            <div className="space-y-4 text-sm leading-relaxed">
              <MenuPageBody
                id={currentPage}
                whatsapp={whatsapp}
                supportEmail={supportEmail}
                dark={dark}
                onToggleTheme={toggleDark}
                aboutContent={aboutContent}
                privacyContent={privacyContent}
                termsContent={termsContent}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}