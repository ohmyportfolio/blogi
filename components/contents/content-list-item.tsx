import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { buildContentHref } from "@/lib/contents";

interface ContentListItemProps {
  id: string;
  title: string;
  categorySlug: string;
  imageUrl: string | null;
  createdAt: Date;
  showDate?: boolean;
  isPinned?: boolean;
}

export const ContentListItem = ({
  id,
  title,
  categorySlug,
  imageUrl,
  createdAt,
  showDate = true,
  isPinned = false,
}: ContentListItemProps) => {
  return (
    <Link
      href={buildContentHref(categorySlug, id, title)}
      className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
    >
      {/* 썸네일 (모바일 컴팩트) */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            width={64}
            height={64}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">
            No Image
          </div>
        )}
      </div>

      {/* 제목 + 날짜 */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm line-clamp-2 text-gray-900">
          {isPinned && <span className="text-orange-500 font-bold mr-1">[공지]</span>}
          {title}
        </h3>
        {showDate && (
          <p className="text-xs text-gray-400 mt-1">
            {format(createdAt, "yyyy.MM.dd")}
          </p>
        )}
      </div>
    </Link>
  );
};
