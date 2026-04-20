import { motion } from "framer-motion";
import { Sparkles, Mail } from "lucide-react";

/**
 * Professional "Advertising Space Available" banner.
 * Uses semantic design tokens, animated shimmer, and gentle motion
 * to feel premium without being intrusive.
 */
export function AdSpaceBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.01 }}
      className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-card via-card/80 to-muted/50 shadow-lg"
      role="complementary"
      aria-label="Advertising space available"
    >
      {/* Animated conic sheen */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background:
            "conic-gradient(from 0deg at 50% 50%, hsl(var(--primary)/0.15), transparent 30%, hsl(var(--gold,38 70% 52%)/0.12) 60%, transparent 90%, hsl(var(--primary)/0.15))",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      />

      {/* Shimmer sweep */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-y-0 -left-1/3 w-1/3 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(var(--foreground)/0.08), transparent)",
        }}
        animate={{ x: ["0%", "500%"] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
      />

      {/* Dashed inner frame for "placeholder ad" feel */}
      <div className="relative m-2 rounded-2xl border border-dashed border-border/60 px-5 py-7 sm:py-8 flex flex-col items-center text-center gap-3 backdrop-blur-sm">
        <motion.div
          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-2.5 py-1 rounded-full bg-background/60 ring-1 ring-border/60"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="w-3 h-3 text-primary" />
          Premium Placement
        </motion.div>

        <motion.h3
          className="font-editorial text-2xl sm:text-3xl font-bold text-foreground tracking-tight"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{
            backgroundImage:
              "linear-gradient(90deg, hsl(var(--foreground)), hsl(var(--primary)), hsl(var(--foreground)))",
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Your Advertising Space
        </motion.h3>

        <motion.p
          className="text-sm text-muted-foreground max-w-md leading-relaxed"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Reach thousands of OB/GYN professionals. Showcase your brand, product, or service right here.
        </motion.p>

        <motion.a
          href="mailto:ads@example.com"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 mt-1 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 ring-1 ring-primary/30"
        >
          <Mail className="w-3.5 h-3.5" />
          Contact for Advertising
        </motion.a>
      </div>
    </motion.div>
  );
}
