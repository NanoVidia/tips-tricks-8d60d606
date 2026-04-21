/**
 * Single source of truth for all UI motion in the Adaptive Hub.
 * Same easing & timing across hover states, focus rings, transitions,
 * sheets, command palette and accordion expansion — by design.
 */
import type { Transition } from "framer-motion";

export const springTransition: Transition = {
  type: "spring",
  stiffness: 350,
  damping: 30,
  mass: 0.8,
};

/** Matching CSS transition duration for non-motion elements (rings, hovers). */
export const TRANSITION_CLASS = "transition-all duration-200 ease-out";
