"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/actions/auth";

/**
 * Shows toast for action results exactly once per state value.
 * Avoids infinite loops when onSuccess triggers a re-render while
 * useActionState still holds the previous success payload.
 */
export function useActionToast(
  state: ActionResult,
  onSuccess?: () => void,
) {
  const handledRef = useRef<ActionResult | null>(null);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (!state.success && !state.error) return;
    if (handledRef.current === state) return;
    handledRef.current = state;

    if (state.error) {
      toast.error(state.error);
      return;
    }

    if (state.success) {
      toast.success(state.success);
      onSuccessRef.current?.();
    }
  }, [state]);
}
