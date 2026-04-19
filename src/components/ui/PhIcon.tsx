// Unified Phosphor Icon wrapper with brand-tinted duotone styling.
// Phosphor's duotone weight renders two layers using the same `color` value;
// the secondary layer is automatically rendered at ~20% opacity.
// We expose tone presets that map to design tokens via inline color values.
import * as Ph from "@phosphor-icons/react";
import type { IconProps } from "@phosphor-icons/react";

type PhName = keyof typeof Ph;

export type PhIconProps = Omit<IconProps, "weight" | "color"> & {
  name: PhName;
  /** Tone preset — sets stroke color. Defaults to currentColor. */
  tone?: "primary" | "gold" | "danger" | "success" | "muted" | "foreground" | "white" | "current";
  /** Direct color override (wins over tone). */
  color?: string;
  /** Phosphor weight; defaults to duotone for the editorial brand look. */
  weight?: IconProps["weight"];
};

const TONE_COLOR: Record<Exclude<NonNullable<PhIconProps["tone"]>, "current">, string> = {
  primary: "hsl(var(--primary))",
  gold: "hsl(var(--gold, 38 70% 52%))",
  danger: "hsl(var(--destructive))",
  success: "hsl(142 70% 45%)",
  muted: "hsl(var(--muted-foreground))",
  foreground: "hsl(var(--foreground))",
  white: "hsl(0 0% 100%)",
};

export function PhIcon({
  name,
  tone = "current",
  color,
  size = 20,
  weight = "duotone",
  ...rest
}: PhIconProps) {
  const Comp = Ph[name] as React.ComponentType<IconProps> | undefined;
  if (!Comp) return null;
  const resolved = color ?? (tone === "current" ? "currentColor" : TONE_COLOR[tone]);
  return <Comp weight={weight} size={size} color={resolved} {...rest} />;
}
