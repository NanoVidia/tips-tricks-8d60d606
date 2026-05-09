import { useEffect, useState } from "react";
import { getAccessState, type AccessState } from "@/lib/billing/trial";

/**
 * React hook returning the current entitlement state.
 * Re-evaluates on focus, on storage events, and when grantEntitlement fires.
 */
export function useAccess(): AccessState {
  const [state, setState] = useState<AccessState>(() => getAccessState());

  useEffect(() => {
    const refresh = () => setState(getAccessState());
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("entitlement-changed", refresh);
    const id = window.setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("entitlement-changed", refresh);
      window.clearInterval(id);
    };
  }, []);

  return state;
}
