import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Search, Wrench, Menu } from "lucide-react";

/**
 * Native-style bottom tab bar — fixed to viewport bottom, safe-area aware.
 * Hidden on admin/control routes and on the disclaimer splash. When hidden,
 * the body's reserved bottom padding is also removed so pages render flush.
 */
export function BottomTabBar() {
  const { pathname } = useLocation();
  const hidden =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/control") ||
    pathname.startsWith("/disclaimer");

  useEffect(() => {
    document.body.classList.toggle("no-bottom-bar", hidden);
    return () => {
      document.body.classList.remove("no-bottom-bar");
    };
  }, [hidden]);

  if (hidden) return null;

  const tabs = [
    { to: "/", label: "Home", icon: Home, match: (p: string) => p === "/" || p === "/index" },
    {
      to: "/?focus=search",
      label: "Search",
      icon: Search,
      match: (p: string) =>
        p === "/" && typeof window !== "undefined" && window.location.search.includes("focus=search"),
    },
    { to: "/tools", label: "Tools", icon: Wrench, match: (p: string) => p.startsWith("/tools") },
    {
      to: "/menu",
      label: "Menu",
      icon: Menu,
      match: (p: string) => p.startsWith("/menu") || p === "/about",
    },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/98 backdrop-blur-xl shadow-[0_-4px_20px_-4px_hsl(var(--foreground)/0.08)] gpu-layer"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4 max-w-lg mx-auto px-2 pt-1.5 pb-1">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.label} className="flex">
              <NavLink
                to={tab.to}
                aria-current={active ? "page" : undefined}
                className="group relative flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl active:scale-95 transition-transform"
              >
                {/* Active pill background behind icon */}
                <span
                  className={`flex items-center justify-center w-12 h-7 rounded-2xl transition-all ${
                    active
                      ? "bg-primary/15"
                      : "bg-transparent group-hover:bg-muted/60"
                  }`}
                >
                  <Icon
                    className={`w-[22px] h-[22px] transition-all ${
                      active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                </span>
                <span
                  className={`text-[11px] leading-none tracking-tight transition-colors ${
                    active ? "text-primary font-bold" : "text-muted-foreground font-semibold group-hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </span>
                {/* Top accent indicator for active tab */}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full bg-primary"
                  />
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
