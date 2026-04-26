import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mail } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Professional "Available for Advertising / Sponsorship / Partnership" banner.
 */

type Phrase = { headline: string; sub: string; dir: "ltr" | "rtl"; lang: string };

const PHRASES: Phrase[] = [
  { lang: "en", dir: "ltr", headline: "Advertising · Sponsorship · Partnership", sub: "Available space — reach thousands of OB/GYN clinicians." },
  { lang: "fr", dir: "ltr", headline: "Publicité · Parrainage · Partenariat", sub: "Espace disponible — touchez des milliers de gynécologues." },
  { lang: "es", dir: "ltr", headline: "Publicidad · Patrocinio · Colaboración", sub: "Espacio disponible — llega a miles de ginecólogos." },
  { lang: "de", dir: "ltr", headline: "Werbung · Sponsoring · Partnerschaft", sub: "Platz verfügbar — erreichen Sie Tausende Gynäkologen." },
  { lang: "it", dir: "ltr", headline: "Pubblicità · Sponsorizzazione · Partnership", sub: "Spazio disponibile — raggiungi migliaia di ginecologi." },
  { lang: "tr", dir: "ltr", headline: "Reklam · Sponsorluk · Ortaklık", sub: "Alan müsait — binlerce kadın doğum uzmanına ulaşın." },
  { lang: "pt", dir: "ltr", headline: "Publicidade · Patrocínio · Parceria", sub: "Espaço disponível — alcance milhares de ginecologistas." },
  { lang: "hi", dir: "ltr", headline: "विज्ञापन · प्रायोजन · साझेदारी", sub: "स्थान उपलब्ध — हजारों स्त्री रोग विशेषज्ञों तक पहुँचें।" },
  { lang: "zh", dir: "ltr", headline: "广告 · 赞助 · 合作", sub: "广告位可用 — 触达数千名妇产科医生。" },
];

export function AdSpaceBanner() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % PHRASES.length), 3200);
    return () => clearInterval(t);
  }, []);

  const current = PHRASES[idx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.01 }}
      className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-card via-card/80 to-muted/50 shadow-lg"
      role="complementary"
      aria-label="Available for advertising, sponsorship, or partnership"
    >
      {/* Animated conic sheen */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background:
            "conic-gradient(from 0deg at 50% 50%, hsl(var(--primary)/0.18), transparent 30%, hsl(var(--accent)/0.15) 60%, transparent 90%, hsl(var(--primary)/0.18))",
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

      <div className="relative m-2 rounded-2xl border border-dashed border-border/60 px-5 py-7 sm:py-8 flex flex-col items-center text-center gap-3 backdrop-blur-sm">
        <motion.div
          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-2.5 py-1 rounded-full bg-background/60 ring-1 ring-border/60"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="w-3 h-3 text-primary" />
          Premium Placement
        </motion.div>

        {/* Rotating multilingual content — uses grid stacking to avoid overlap with siblings */}
        <div className="relative w-full grid">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.lang}
              dir={current.dir}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ gridArea: "1 / 1" }}
              className="w-full flex flex-col items-center justify-center gap-2 px-2"
            >
              <h3
                className="font-editorial text-[19px] sm:text-3xl font-bold tracking-tight leading-tight break-words"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, hsl(var(--foreground)), hsl(var(--primary)), hsl(var(--foreground)))",
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {current.headline}
              </h3>
              <p className="text-[12px] sm:text-sm text-muted-foreground max-w-md leading-relaxed break-words">
                {current.sub}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Language progress dots */}
        <div className="flex items-center gap-1 mt-1" aria-hidden="true">
          {PHRASES.map((p, i) => (
            <motion.span
              key={p.lang}
              className="rounded-full bg-muted-foreground/30"
              animate={{
                width: i === idx ? 14 : 4,
                opacity: i === idx ? 1 : 0.4,
                backgroundColor: i === idx ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)",
              }}
              style={{ height: 4 }}
              transition={{ duration: 0.4 }}
            />
          ))}
        </div>

        <motion.a
          href="mailto:ads@example.com"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 mt-1 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 ring-1 ring-primary/30"
        >
          <Mail className="w-3.5 h-3.5" />
          Contact us — Advertising · Sponsorship · Partnership
        </motion.a>
      </div>
    </motion.div>
  );
}
