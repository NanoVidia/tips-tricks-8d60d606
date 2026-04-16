import { Star } from "lucide-react";
import { useBookmarks } from "@/hooks/useBookmarks";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  id: string;
  label?: string;
  className?: string;
  size?: "sm" | "md";
  /** Stop the click from bubbling (e.g. inside accordion triggers). */
  stopPropagation?: boolean;
}

export function BookmarkButton({
  id,
  label,
  className,
  size = "sm",
  stopPropagation = true,
}: BookmarkButtonProps) {
  const { isBookmarked, toggle } = useBookmarks();
  const active = isBookmarked(id);
  const dim = size === "md" ? "w-8 h-8" : "w-7 h-7";
  const iconDim = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";

  return (
    <button
      type="button"
      onClick={(e) => {
        if (stopPropagation) {
          e.stopPropagation();
          e.preventDefault();
        }
        toggle(id);
      }}
      aria-pressed={active}
      aria-label={active ? `Remove ${label ?? "item"} from favorites` : `Add ${label ?? "item"} to favorites`}
      title={active ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "shrink-0 inline-flex items-center justify-center rounded-lg border transition",
        dim,
        active
          ? "bg-warning-soft border-warning/40 text-warning hover:bg-warning/15"
          : "bg-card border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        className,
      )}
    >
      <Star className={cn(iconDim, active && "fill-current")} />
    </button>
  );
}
