import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { markdownToHtml } from "@/lib/markdown";

const BATCH_SIZE = 100;

const shouldBackfill = (markdown: string | null, html: string | null) => {
  if (!markdown || !markdown.trim()) return false;
  if (!html) return true;
  return html.trim().length === 0;
};

const run = async () => {
  let cursor: string | null = null;
  let processed = 0;
  let updated = 0;

  while (true) {
    const contents: Array<{
      id: string;
      contentMarkdown: string | null;
      htmlContent: string | null;
    }> = await prisma.content.findMany({
      where: {
        contentMarkdown: { not: null },
        OR: [{ htmlContent: null }, { htmlContent: "" }],
      },
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: { id: true, contentMarkdown: true, htmlContent: true },
    });

    if (contents.length === 0) break;

    for (const content of contents) {
      processed += 1;
      if (!shouldBackfill(content.contentMarkdown, content.htmlContent)) continue;

      const html = await markdownToHtml(content.contentMarkdown ?? "");
      await prisma.content.update({
        where: { id: content.id },
        data: { htmlContent: html || null },
      });
      updated += 1;
    }

    cursor = contents[contents.length - 1]?.id ?? null;
  }

  console.log(`Backfill complete. processed=${processed} updated=${updated}`);
};

run()
  .catch((error) => {
    console.error("Backfill failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
