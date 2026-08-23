import { captureRecoveryHash } from "./lib/recovery-hash";

// Must run before the Supabase client module is evaluated: its URL session
// detection consumes and strips the recovery hash from the address bar.
captureRecoveryHash();

import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
