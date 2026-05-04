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
    return () => { document.body.classList.remove("no-bottom-bar"); };
  }, [hidden]);

  if (hidden) return null;

  const tabs = [
    { to: "/", label: "Home", icon: Home, match: (p: string) => p === "/" || p === "/index" },
    {
      to: "/?focus=search",
      label: "Search",
      icon: Search,
      match: (p: string) => p === "/" && typeof window !== "undefined" && window.location.search.includes("focus=search"),
    },
    { to: "/tools", label: "Tools", icon: Wrench, match: (p: string) => p.startsWith("/tools") },
    { to: "/menu/about", label: "Menu", icon: Menu, match: (p: string) => p.startsWith("/menu") || p === "/about" },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-card/95 backdrop-blur-md gpu-layer"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.label}>
              <NavLink
                to={tab.to}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors active:scale-95 ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 2} />
                <span className="leading-none">{tab.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
