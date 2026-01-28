import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { buildContentHref } from "@/lib/contents";
import { formatPrice } from "@/lib/utils";

interface ContentCardProps {
    id: string;
    title: string;
    categorySlug: string;
    categoryLabel: string;
    imageUrl: string | null;
    price: string | null;
    createdAt: Date;
    showDate?: boolean;
}

export const ContentCard = ({
    id,
    title,
    categorySlug,
    categoryLabel,
    imageUrl,
    price,
    createdAt,
    showDate = true
}: ContentCardProps) => {
    return (
        <Link href={buildContentHref(categorySlug, id, title)}>
            <Card className="h-full overflow-hidden transition-transform duration-300 hover:-translate-y-1">
                <div className="aspect-[4/3] relative bg-gradient-to-br from-slate-100 via-white to-amber-50">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={title}
                            fill
                            className="object-cover"
                            unoptimized
                            sizes="(max-width: 768px) 100vw, 33vw"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm uppercase tracking-[0.2em]">
                            No Image
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent" />
                </div>
                <CardContent className="p-2.5 md:p-4">
                    <Badge variant="outline" className="mb-2 md:mb-3 uppercase text-[10px] md:text-xs">
                        {categoryLabel}
                    </Badge>
                    <h3 className="font-display text-sm md:text-lg leading-tight mb-1.5 md:mb-2">
                        {title}
                    </h3>
                    {showDate && (
                        <p className="text-xs md:text-sm text-gray-500">
                            {format(createdAt, "yyyy.MM.dd")}
                        </p>
                    )}
                </CardContent>
                {price && (
                    <CardFooter className="p-2.5 md:p-4 pt-0">
                        <p className="font-semibold text-sky-700 text-sm md:text-base">
                            {formatPrice(price)}
                        </p>
                    </CardFooter>
                )}
            </Card>
        </Link>
    );
};
