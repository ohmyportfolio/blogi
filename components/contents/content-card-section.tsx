"use client";

import { ContentCard } from "./content-card";
import { Pagination } from "@/components/ui/pagination";

interface Content {
  id: string;
  title: string;
  imageUrl: string | null;
  price: string | null;
  createdAt: Date;
  isPinned?: boolean;
  categoryRef?: { slug: string; name: string } | null;
}

interface ContentCardSectionProps {
  contents: Content[];
  categorySlug: string;
  categoryName: string;
  currentPage?: number;
  totalPages?: number;
  showPagination?: boolean;
  label?: string | null;
  showDate?: boolean;
}

export const ContentCardSection = ({
  contents,
  categorySlug,
  categoryName,
  currentPage = 1,
  totalPages = 1,
  showPagination = false,
  label,
  showDate = true,
}: ContentCardSectionProps) => {
  if (contents.length === 0) return null;

  return (
    <div>
      {label && (
        <h2 className="font-display text-xl md:text-2xl mb-4">{label}</h2>
      )}
      <div className="grid grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
        {contents.map((content) => (
          <ContentCard
            key={content.id}
            id={content.id}
            title={content.title}
            categorySlug={content.categoryRef?.slug ?? categorySlug}
            categoryLabel={content.categoryRef?.name ?? categoryName}
            imageUrl={content.imageUrl}
            price={content.price}
            createdAt={content.createdAt}
            showDate={showDate}
            isPinned={content.isPinned}
          />
        ))}
      </div>
      {showPagination && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          baseHref={`/contents/${categorySlug}`}
          queryKey="cardPage"
        />
      )}
    </div>
  );
};
