"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";

const ProductSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    category: z.string().min(1),
    price: z.string().optional(),
    imageUrl: z.string().optional(),
});

export async function createProduct(formData: FormData) {
    const rawData = {
        title: formData.get("title"),
        content: formData.get("content"),
        category: formData.get("category"),
        price: formData.get("price"),
        imageUrl: formData.get("imageUrl"),
    };

    const validatedData = ProductSchema.safeParse(rawData);

    if (!validatedData.success) {
        return { error: "Invalid data" };
    }

    await prisma.product.create({
        data: {
            title: validatedData.data.title,
            content: validatedData.data.content,
            category: validatedData.data.category,
            price: validatedData.data.price || null,
            imageUrl: validatedData.data.imageUrl || null,
        },
    });

    revalidatePath("/admin/products");
    revalidatePath("/");
    redirect("/admin/products");
}
