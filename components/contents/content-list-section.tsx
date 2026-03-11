"use client";

import { ContentListItem } from "./content-list-item";
import { Pagination } from "@/components/ui/pagination";

interface Content {
  id: string;
  title: string;
  imageUrl: string | null;
  createdAt: Date;
  isPinned?: boolean;
}

interface ContentListSectionProps {
  contents: Content[];
  categorySlug: string;
  currentPage?: number;
  totalPages?: number;
  showPagination?: boolean;
  label?: string | null;
  showDate?: boolean;
  newBadgeDays?: number;
}

function isNewContent(createdAt: Date, days: number): boolean {
  if (days <= 0) return false;
  const now = new Date();
  const diff = now.getTime() - new Date(createdAt).getTime();
  return diff < days * 24 * 60 * 60 * 1000;
}

export const ContentListSection = ({
  contents,
  categorySlug,
  currentPage = 1,
  totalPages = 1,
  showPagination = false,
  label,
  showDate = true,
  newBadgeDays = 0,
}: ContentListSectionProps) => {
  if (contents.length === 0) return null;

  return (
    <div>
      {label && (
        <h2 className="font-display text-xl md:text-2xl mb-4">{label}</h2>
      )}
      <div className="rounded-xl border border-black/5 bg-white overflow-hidden">
        {contents.map((content) => (
          <ContentListItem
            key={content.id}
            id={content.id}
            title={content.title}
            categorySlug={categorySlug}
            imageUrl={content.imageUrl}
            createdAt={content.createdAt}
            showDate={showDate}
            isPinned={content.isPinned}
            isNew={isNewContent(content.createdAt, newBadgeDays)}
          />
        ))}
      </div>
      {showPagination && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          baseHref={`/contents/${categorySlug}`}
          queryKey="listPage"
        />
      )}
    </div>
  );
};
