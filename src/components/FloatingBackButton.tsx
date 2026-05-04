import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Global floating back button. Renders on every route EXCEPT the home page
 * and the disclaimer splash. Uses browser history when possible, falls back
 * to "/" so users are never stranded.
 */
export function FloatingBackButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const hidden =
    pathname === "/" ||
    pathname === "/index" ||
    pathname.startsWith("/disclaimer");

  if (hidden) return null;

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back"
      className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-md backdrop-blur transition-all hover:bg-muted active:scale-95"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.6rem)" }}
    >
      <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
    </button>
  );
}
