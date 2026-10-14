import { previewDrafts } from "@/lib/content/load";

/** Shown whenever unreviewed drafts are visible, so a preview deploy is never mistaken for the real thing. */
export function PreviewBanner() {
  if (!previewDrafts()) return null;
  return (
    <div
      className="bg-red text-card px-4 py-2 text-center font-mono text-xs font-semibold"
      role="note"
    >
      CONTENT PREVIEW · unreviewed drafts are visible and counted · not for sale
    </div>
  );
}
