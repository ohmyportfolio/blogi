import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
            <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="aspect-[4/3] relative bg-gray-200">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={title}
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No Image
                        </div>
                    )}
                </div>
                <CardContent className="p-4">
                    <Badge variant="secondary" className="mb-2 uppercase">
                        {category}
                    </Badge>
                    <h3 className="font-bold text-lg line-clamp-2 mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {format(createdAt, "yyyy.MM.dd")}
                    </p>
                </CardContent>
                {price && (
                    <CardFooter className="p-4 pt-0">
                        <p className="font-semibold text-sky-600">
                            {price}
                        </p>
                    </CardFooter>
                )}
            </Card>
        </Link>
    );
};
