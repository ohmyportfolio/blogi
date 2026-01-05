import { slugify } from "@/lib/slug";
import { lexicalJsonToPlainText } from "@/lib/lexical";

export const buildContentSlug = (title: string) => slugify(title || "");

export const buildContentIdParam = (id: string, title?: string | null) => {
  const slug = title ? buildContentSlug(title) : "";
  return slug ? `${id}-${slug}` : id;
};

export const buildContentHref = (
  categorySlug: string,
  id: string,
  title?: string | null
) => `/contents/${categorySlug}/${buildContentIdParam(id, title)}`;

export const extractContentId = (idParam: string) => idParam.split("-")[0];

export const getContentPlainText = (
  content: string,
  contentMarkdown?: string | null
) => {
  const plainText = lexicalJsonToPlainText(content);
  if (plainText) return plainText;
  if (typeof contentMarkdown === "string") {
    return contentMarkdown.replace(/\s+/g, " ").trim();
  }
  return "";
};

export const truncateText = (text: string, maxLength = 160) => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
};
