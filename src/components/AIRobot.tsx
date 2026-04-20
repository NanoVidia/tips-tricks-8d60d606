import { motion } from "framer-motion";

interface AIRobotProps {
  size?: number;
  className?: string;
}

/**
 * Animated medical AI robot mascot — extracted from FloatingAIBot.
 * Pure SVG + framer-motion. Safe to embed inside any container.
 */
export function AIRobot({ size = 96, className = "" }: AIRobotProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: size, height: size * (72 / 56) }}
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    >
      {/* Ground shadow */}
      <motion.span
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-[50%] pointer-events-none"
        style={{
          width: size * 0.7,
          height: size * 0.12,
          background:
            "radial-gradient(ellipse, hsl(220 60% 15% / 0.45) 0%, transparent 70%)",
          filter: "blur(2px)",
        }}
        animate={{ scaleX: [1, 0.85, 1], opacity: [0.45, 0.3, 0.45] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />

      <svg
        width="100%"
        height="100%"
        viewBox="0 0 56 72"
        fill="none"
        className="relative z-10 drop-shadow-[0_4px_8px_hsl(220_70%_20%/0.45)]"
      >
        <defs>
          <linearGradient id="ai-robot-shell" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(0 0% 100%)" />
            <stop offset="40%" stopColor="hsl(210 30% 90%)" />
            <stop offset="100%" stopColor="hsl(215 25% 55%)" />
          </linearGradient>
          <linearGradient id="ai-robot-shell-side" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(215 30% 55%)" />
            <stop offset="50%" stopColor="hsl(210 30% 88%)" />
            <stop offset="100%" stopColor="hsl(215 30% 50%)" />
          </linearGradient>
          <linearGradient id="ai-robot-face" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(225 65% 14%)" />
            <stop offset="100%" stopColor="hsl(230 75% 6%)" />
          </linearGradient>
          <linearGradient id="ai-robot-accent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(215 80% 55%)" />
            <stop offset="100%" stopColor="hsl(225 75% 35%)" />
          </linearGradient>
          <radialGradient id="ai-robot-eye" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="hsl(180 100% 92%)" />
            <stop offset="55%" stopColor="hsl(195 100% 60%)" />
            <stop offset="100%" stopColor="hsl(210 100% 40%)" />
          </radialGradient>
        </defs>

        {/* Antenna */}
        <line x1="28" y1="2" x2="28" y2="7" stroke="hsl(215 25% 65%)" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="28" cy="2" r="1.6" fill="hsl(0 90% 60%)">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />
        </circle>

        {/* HEAD */}
        <rect x="14" y="7" width="28" height="20" rx="6" fill="url(#ai-robot-shell)" stroke="hsl(215 35% 45%)" strokeWidth="0.6" />
        <rect x="16" y="8.5" width="24" height="2.2" rx="1.1" fill="hsl(0 0% 100% / 0.6)" />
        <rect x="17" y="12" width="22" height="11" rx="3.5" fill="url(#ai-robot-face)" stroke="hsl(220 50% 20%)" strokeWidth="0.5" />
        {/* Eyes */}
        <circle cx="23" cy="17" r="2.2" fill="url(#ai-robot-eye)">
          <animate attributeName="r" values="2.2;0.5;2.2" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="33" cy="17" r="2.2" fill="url(#ai-robot-eye)">
          <animate attributeName="r" values="2.2;0.5;2.2" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="23.5" cy="16.3" r="0.6" fill="hsl(0 0% 100%)" />
        <circle cx="33.5" cy="16.3" r="0.6" fill="hsl(0 0% 100%)" />
        {/* Mouth bar */}
        <rect x="24" y="20" width="8" height="1" rx="0.5" fill="hsl(195 100% 65%)" opacity="0.8">
          <animate attributeName="width" values="8;3;8" dur="3s" repeatCount="indefinite" />
        </rect>
        {/* Side ear pods */}
        <rect x="11.5" y="14" width="2.5" height="6" rx="1.2" fill="hsl(215 25% 55%)" />
        <rect x="42" y="14" width="2.5" height="6" rx="1.2" fill="hsl(215 25% 55%)" />
        <circle cx="12.7" cy="17" r="0.7" fill="hsl(195 100% 60%)" />
        <circle cx="43.2" cy="17" r="0.7" fill="hsl(195 100% 60%)" />

        {/* Neck */}
        <rect x="24" y="27" width="8" height="3" rx="1" fill="hsl(215 25% 50%)" />
        <rect x="22" y="29.5" width="12" height="1.5" rx="0.8" fill="hsl(215 30% 40%)" />

        {/* TORSO */}
        <rect x="13" y="31" width="30" height="22" rx="5" fill="url(#ai-robot-shell)" stroke="hsl(215 35% 45%)" strokeWidth="0.6" />
        <rect x="13" y="31" width="3" height="22" rx="2" fill="hsl(215 35% 50% / 0.5)" />
        <rect x="40" y="31" width="3" height="22" rx="2" fill="hsl(215 35% 50% / 0.5)" />
        <rect x="20" y="35" width="16" height="13" rx="2.5" fill="url(#ai-robot-accent)" stroke="hsl(220 60% 28%)" strokeWidth="0.5" />
        {/* Core reactor */}
        <circle cx="28" cy="41.5" r="3.5" fill="hsl(225 70% 12%)" stroke="hsl(195 100% 55%)" strokeWidth="0.6" />
        <circle cx="28" cy="41.5" r="2.2" fill="hsl(195 100% 65%)">
          <animate attributeName="r" values="2.2;1.4;2.2" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.5;1" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="28" cy="41.5" r="0.8" fill="hsl(0 0% 100%)" />
        {/* Status LEDs */}
        <circle cx="22.5" cy="46" r="0.7" fill="hsl(140 90% 55%)">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="25" cy="46" r="0.7" fill="hsl(45 95% 60%)">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2.1s" repeatCount="indefinite" />
        </circle>
        <circle cx="33.5" cy="46" r="0.7" fill="hsl(0 90% 60%)" opacity="0.7" />

        {/* ARMS — animated subtle sway */}
        <motion.g
          style={{ transformOrigin: "13px 33px" }}
          animate={{ rotate: [-3, 3, -3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <rect x="7" y="32" width="5" height="14" rx="2.5" fill="url(#ai-robot-shell-side)" stroke="hsl(215 35% 45%)" strokeWidth="0.4" />
          <circle cx="9.5" cy="48" r="3" fill="url(#ai-robot-shell)" stroke="hsl(215 35% 45%)" strokeWidth="0.5" />
          <circle cx="9.5" cy="48" r="1" fill="hsl(195 100% 55%)" opacity="0.7" />
        </motion.g>
        <motion.g
          style={{ transformOrigin: "43px 33px" }}
          animate={{ rotate: [3, -3, 3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <rect x="44" y="32" width="5" height="14" rx="2.5" fill="url(#ai-robot-shell-side)" stroke="hsl(215 35% 45%)" strokeWidth="0.4" />
          <circle cx="46.5" cy="48" r="3" fill="url(#ai-robot-shell)" stroke="hsl(215 35% 45%)" strokeWidth="0.5" />
          <circle cx="46.5" cy="48" r="1" fill="hsl(195 100% 55%)" opacity="0.7" />
        </motion.g>

        {/* LEGS */}
        <rect x="18" y="53" width="7" height="13" rx="2.5" fill="url(#ai-robot-shell-side)" stroke="hsl(215 35% 45%)" strokeWidth="0.5" />
        <rect x="31" y="53" width="7" height="13" rx="2.5" fill="url(#ai-robot-shell-side)" stroke="hsl(215 35% 45%)" strokeWidth="0.5" />
        <circle cx="21.5" cy="60" r="1.2" fill="hsl(220 60% 35%)" />
        <circle cx="34.5" cy="60" r="1.2" fill="hsl(220 60% 35%)" />
        <ellipse cx="21.5" cy="67" rx="5" ry="2.2" fill="url(#ai-robot-shell)" stroke="hsl(215 35% 45%)" strokeWidth="0.5" />
        <ellipse cx="34.5" cy="67" rx="5" ry="2.2" fill="url(#ai-robot-shell)" stroke="hsl(215 35% 45%)" strokeWidth="0.5" />
      </svg>
    </motion.div>
  );
}
