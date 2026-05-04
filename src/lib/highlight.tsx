import { Fragment, type ReactNode } from "react";
import { getSearchTokens, expandClinicalSearchQueries } from "@/lib/clinicalSearch";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Build a single case-insensitive regex matching any token from the query
 * (plus expanded clinical synonyms). Returns null when nothing meaningful.
 */
export function buildHighlightRegex(query: string): RegExp | null {
  const q = query.trim();
  if (!q) return null;

  const tokens = new Set<string>();
  for (const t of getSearchTokens(q)) tokens.add(t);
  // Add the raw query as a phrase (most specific) and short expansions.
  if (q.length >= 2) tokens.add(q.toLowerCase());
  for (const variant of expandClinicalSearchQueries(q).slice(0, 8)) {
    const v = variant.trim().toLowerCase();
    if (v.length >= 2 && v.length <= 32) tokens.add(v);
  }

  const parts = Array.from(tokens)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length) // longest first → phrase wins over token
    .map(escapeRegex);

  if (parts.length === 0) return null;
  try {
    return new RegExp(`(${parts.join("|")})`, "giu");
  } catch {
    return null;
  }
}

/**
 * Wrap each occurrence of the regex in a <mark> element. Safe for plain text.
 */
export function highlightText(text: string | null | undefined, regex: RegExp | null): ReactNode {
  if (!text) return text ?? null;
  if (!regex) return text;
  const parts = text.split(regex);
  if (parts.length <= 1) return text;
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <mark
          key={i}
          className="rounded-[3px] bg-primary/15 text-primary px-0.5 font-bold"
        >
          {part}
        </mark>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
