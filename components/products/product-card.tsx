import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ProductCardProps {
    id: string;
    title: string;
    category: string;
    imageUrl: string | null;
    price: string | null;
    createdAt: Date;
}

export const ProductCard = ({
    id,
    title,
    category,
    imageUrl,
    price,
    createdAt
}: ProductCardProps) => {
    return (
        <Link href={`/products/${category}/${id}`}>
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
                <CardContent className="p-4">
                    <Badge variant="outline" className="mb-3 uppercase">
                        {category.replace("_", " ")}
                    </Badge>
                    <h3 className="font-display text-lg leading-tight line-clamp-2 mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {format(createdAt, "yyyy.MM.dd")}
                    </p>
                </CardContent>
                {price && (
                    <CardFooter className="p-4 pt-0">
                        <p className="font-semibold text-sky-700">
                            {price}
                        </p>
                    </CardFooter>
                )}
            </Card>
        </Link>
    );
};
