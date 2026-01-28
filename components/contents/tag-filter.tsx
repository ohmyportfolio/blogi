import Link from "next/link";

interface TagFilterProps {
    tags: { id: string; name: string; slug: string; categoryId: string | null }[];
    categorySlug: string;
    activeTagId?: string;
}

export function TagFilter({ tags, categorySlug, activeTagId }: TagFilterProps) {
    if (tags.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mb-6">
            <Link
                href={`/contents/${categorySlug}`}
                className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors min-h-[36px] ${
                    !activeTagId
                        ? "bg-foreground text-background"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
                전체
            </Link>
            {tags.map((tag) => {
                const isActive = activeTagId === tag.id;
                const isGlobal = tag.categoryId === null;
                return (
                    <Link
                        key={tag.id}
                        href={`/contents/${categorySlug}?tagId=${tag.id}`}
                        className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors min-h-[36px] ${
                            isActive
                                ? isGlobal
                                    ? "bg-amber-600 text-white"
                                    : "bg-blue-600 text-white"
                                : isGlobal
                                    ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                        {tag.name}
                    </Link>
                );
            })}
        </div>
    );
}
