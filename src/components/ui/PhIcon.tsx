// Unified Phosphor Icon wrapper with brand-tinted duotone styling.
// Usage: <PhIcon name="Stethoscope" size={18} tone="primary" />
// All Phosphor icons are exposed by name; we apply duotone weight + a
// secondary color tint that follows the design system tokens.
import * as Ph from "@phosphor-icons/react";
import type { IconProps } from "@phosphor-icons/react";

type PhName = keyof typeof Ph;

export type PhIconProps = Omit<IconProps, "weight" | "color"> & {
  name: PhName;
  /** Tone for the duotone secondary fill — maps to design tokens. */
  tone?: "primary" | "gold" | "danger" | "success" | "muted" | "white";
  /** Override the primary stroke color (defaults to currentColor). */
  color?: string;
};

const TONE_FILL: Record<NonNullable<PhIconProps["tone"]>, string> = {
  primary: "hsl(var(--primary))",
  gold: "hsl(var(--gold, 38 70% 52%))",
  danger: "hsl(var(--destructive))",
  success: "hsl(142 70% 45%)",
  muted: "hsl(var(--muted-foreground))",
  white: "hsl(0 0% 100%)",
};

export function PhIcon({
  name,
  tone = "primary",
  color,
  size = 20,
  style,
  ...rest
}: PhIconProps) {
  const Comp = Ph[name] as React.ComponentType<IconProps>;
  if (!Comp) return null;
  return (
    <Comp
      weight="duotone"
      size={size}
      color={color ?? "currentColor"}
      style={{
        // Duotone secondary layer color via CSS variable Phosphor reads
        ["--ph-duotone-secondary-color" as never]: TONE_FILL[tone],
        ["--ph-duotone-secondary-opacity" as never]: 0.28,
        ...style,
      }}
      {...rest}
    />
  );
}
