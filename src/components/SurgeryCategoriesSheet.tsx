import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Scissors, ArrowRight } from "lucide-react";
import { surgeryCategories, type SurgeryCategory } from "@/data/surgeriesData";
import { useAllSurgeries } from "@/hooks/useSurgeries";
import { PhIcon } from "@/components/ui/PhIcon";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

/** Icon mapping per surgical category — phosphor set, medically appropriate. */
const CATEGORY_ICON: Record<SurgeryCategory, "Baby" | "Heartbeat" | "Flask" | "Drop" | "Dna" | "Siren" | "Cube" | "GenderFemale" | "MagnifyingGlass"> = {
  "Obstetric": "Baby",
  "Benign Gyn": "Heartbeat",
  "Oncology": "Flask",
  "Urogyn": "Drop",
  "Reproductive": "Dna",
  "Emergency": "Siren",
  "Minimally Invasive": "Cube",
  "Vaginal": "GenderFemale",
  "Hysteroscopic": "MagnifyingGlass",
};

export function SurgeryCategoriesSheet({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { surgeries } = useAllSurgeries();

  // Count per category (excluding the "All" bucket which we'll compute separately)
  const counts = surgeries.reduce<Record<string, number>>((acc, s) => {
    acc[s.category] = (acc[s.category] ?? 0) + 1;
    return acc;
  }, {});

  const go = (cat: SurgeryCategory | "All") => {
    onOpenChange(false);
    const url = cat === "All" ? "/tools?tab=surgeries" : `/tools?tab=surgeries&cat=${encodeURIComponent(cat)}`;
    setTimeout(() => navigate(url), 150);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] overflow-y-auto">
        <SheetHeader className="pb-3 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2 text-base">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-700 flex items-center justify-center shadow-sm shadow-rose-500/30">
              <Scissors className="w-4 h-4 text-white" />
            </span>
            Surgery Library
            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {surgeries.length} procedures
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-2 pt-4 pb-2">
          {surgeryCategories.map((c, idx) => {
            const isAll = c.id === "All";
            const count = isAll ? surgeries.length : (counts[c.id] ?? 0);
            const phName = isAll ? "Scissors" : (CATEGORY_ICON[c.id as SurgeryCategory] ?? "Scissors");

            return (
              <motion.button
                key={c.id}
                type="button"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.04 * idx, type: "spring", stiffness: 260, damping: 22 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => go(c.id)}
                className={`group relative overflow-hidden rounded-2xl p-3 bg-gradient-to-br ${c.color} shadow-md shadow-black/10 text-left`}
                aria-label={`Open ${c.label} surgeries`}
              >
                {/* Shimmer */}
                <span
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                  aria-hidden
                />
                {/* Background icon */}
                <div className="absolute -bottom-2 -right-2 opacity-15 pointer-events-none" aria-hidden>
                  <PhIcon name={phName} size={48} tone="white" weight="fill" />
                </div>

                <div className="relative flex flex-col gap-1.5 min-h-[72px]">
                  <motion.div
                    className="w-7 h-7 rounded-xl bg-white/25 backdrop-blur-sm ring-1 ring-white/30 flex items-center justify-center"
                    animate={{ y: [0, -2, 0], rotate: [0, -3, 3, 0] }}
                    transition={{ duration: 3.5 + idx * 0.2, repeat: Infinity, ease: "easeInOut", delay: idx * 0.1 }}
                  >
                    <PhIcon name={phName} size={14} tone="white" weight="duotone" />
                  </motion.div>
                  <div>
                    <p className="text-white font-bold text-[11px] leading-tight truncate">{c.label}</p>
                    <p className="text-white/70 text-[9px] font-bold uppercase tracking-wider mt-0.5">
                      {count} {count === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          onClick={() => go("All")}
          className="w-full mt-2 mb-2 py-2.5 rounded-xl bg-muted/50 hover:bg-muted text-foreground text-[12px] font-bold flex items-center justify-center gap-1.5 border border-border/50 transition"
        >
          Browse full library
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.button>
      </SheetContent>
    </Sheet>
  );
}
