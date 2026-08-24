import { createFileRoute, redirect } from "@tanstack/react-router";

// Recovery links are handled by the pre-bootstrap script in __root.tsx, which
// runs before any router code and preserves the URL hash across this redirect.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/login", replace: true });
  },
});
