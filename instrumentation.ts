import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertProductionSafe } = await import("@/lib/env");
    // Fail fast at boot if production is misconfigured (mock auth/payments/DB or a default secret).
    assertProductionSafe();
  }
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { reportError } = await import("@/lib/observability");
  await reportError(err, { path: request.path, method: request.method, routeType: context.routeType, routePath: context.routePath });
};
