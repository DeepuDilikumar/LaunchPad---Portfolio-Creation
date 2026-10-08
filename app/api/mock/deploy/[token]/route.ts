import { mock } from "@/lib/env";
import { site } from "@/config/site";

/** Local mock mode only: a stand-in "deployment" page that carries a verification tag. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!mock.auth) return new Response("Not found", { status: 404 });
  const { token } = await params;
  const safe = token.replace(/[^\w-]/g, "");
  return new Response(`<!doctype html><html><head><meta name="${site.verifyMetaName}" content="${safe}"><title>Mock deploy</title></head><body>Mock deployment</body></html>`, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
