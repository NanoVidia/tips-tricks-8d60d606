// Lightweight, branded skeleton shown while the home screen is hydrating.
// Mirrors the rough shape of HomeHero so the layout doesn't shift on load.
import { Skeleton } from "@/components/ui/skeleton";

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-muted/40 ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div
      className="relative space-y-4 pt-4 pb-24 motion-safe:animate-in motion-safe:fade-in"
      role="status"
      aria-busy="true"
      aria-label="Loading home"
    >
      {/* Text-size toggle row */}
      <div className="flex items-center justify-between gap-3 px-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* Emergency strip */}
      <Shimmer className="h-16" />

      {/* AI hero banner */}
      <div className="relative">
        <Shimmer className="h-44" />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
      </div>

      {/* Daily MCQ + Mini Case */}
      <div className="grid grid-cols-2 gap-2.5">
        <Shimmer className="h-28" />
        <Shimmer className="h-28" />
      </div>

      {/* Quick tools strip */}
      <div className="flex gap-2 overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <Shimmer key={i} className="h-20 flex-1 min-w-[68px]" />
        ))}
      </div>

      {/* Section grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border/50 bg-card p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-2.5 w-full" />
            <Skeleton className="h-2.5 w-3/4" />
          </div>
        ))}
      </div>

      <span className="sr-only">Loading content…</span>
    </div>
  );
}
