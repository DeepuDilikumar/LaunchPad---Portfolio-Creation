import { NextResponse } from "next/server";
import { getStore } from "@/lib/db";
import { deliverableGuides, parseFileId } from "@/lib/delivery";
import { sha256 } from "@/lib/ids";
import { getStorage, stampedKey } from "@/lib/storage";
import { site } from "@/config/site";

export const dynamic = "force-dynamic";

/** Counts one download and redirects to a 5-minute signed URL for the stamped file. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");
  const file = parseFileId(url.searchParams.get("file") ?? "");
  if (!token || !file) return NextResponse.redirect(new URL("/download?error=invalid", req.url));

  const store = getStore();
  const hash = sha256(token);
  const link = await store.getDownloadLink(hash);
  if (!link) return NextResponse.redirect(new URL("/download?error=invalid", req.url));
  const order = await store.getOrder(link.order_id);
  if (
    !order ||
    order.status !== "fulfilled" ||
    !deliverableGuides(order.product_slug).includes(file.guide)
  ) {
    return NextResponse.redirect(new URL("/download?error=invalid", req.url));
  }
  const used = await store.consumeDownload(hash, new Date().toISOString());
  if (!used) {
    return NextResponse.redirect(new URL(`/thank-you?order=${order.id}&link=expired`, req.url));
  }

  const key = stampedKey(order.id, file.guide, file.edition);
  const filename = `${site.name}-${file.guide}-${file.edition}.pdf`;
  const signed = await getStorage().signedUrl(key, 300, filename);
  if (signed.startsWith("local:")) {
    const bytes = await getStorage().get(key);
    if (!bytes) return new NextResponse("File missing", { status: 404 });
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }
  return NextResponse.redirect(signed, { headers: { "Cache-Control": "no-store" } });
}
