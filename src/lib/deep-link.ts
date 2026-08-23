import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";

/**
 * Search-param schema shared by all list pages that support opening a single
 * entity via URL, e.g. `/rechnungen?id=<uuid>`.
 */
export function detailSearchSchema(search: Record<string, unknown>): { id?: string } {
  const id = search["id"];
  return typeof id === "string" && id.trim().length > 0 ? { id: id.trim() } : {};
}

/**
 * Applies an `?id=` deep link once and returns a callback that removes the
 * param again (so closing a detail sheet keeps browser history sane).
 */
export function useDetailDeepLink(
  routePath: string,
  id: string | undefined,
  apply: (id: string) => void,
) {
  const navigate = useNavigate();

  useEffect(() => {
    if (id) apply(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return useCallback(() => {
    if (!id) return;
    void navigate({ to: routePath, search: {}, replace: true } as never);
  }, [id, navigate, routePath]);
}
