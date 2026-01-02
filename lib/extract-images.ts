import { prisma } from "@/lib/prisma";

/**
 * Lexical JSON 콘텐츠에서 이미지 URL 추출
 */
export function extractImagesFromLexical(content: string): string[] {
    if (!content) return [];

    try {
        const parsed = JSON.parse(content);
        const images: string[] = [];

        const traverse = (node: unknown) => {
            if (!node || typeof node !== "object") return;

            const obj = node as Record<string, unknown>;

            // ImageNode 타입 확인
            if (obj.type === "image" && typeof obj.src === "string") {
                images.push(obj.src);
            }

            // 자식 노드 순회
            if (Array.isArray(obj.children)) {
                obj.children.forEach(traverse);
            }

            // root 노드의 경우
            if (obj.root && typeof obj.root === "object") {
                traverse(obj.root);
            }
        };

        traverse(parsed);
        return images;
    } catch {
        return [];
    }
}

/**
 * URL에서 상대 경로 추출 (정규화)
 * 예: "https://example.com/uploads/posts/2026/01/02/file.jpg" -> "/uploads/posts/2026/01/02/file.jpg"
 * 예: "/uploads/posts/2026/01/02/file.jpg" -> "/uploads/posts/2026/01/02/file.jpg"
 */
export function normalizeImageUrl(url: string): string {
    if (!url) return "";

    // 이미 상대 경로인 경우
    if (url.startsWith("/uploads/")) {
        return url;
    }

    // 절대 URL에서 /uploads/ 이후 부분 추출
    const uploadsIndex = url.indexOf("/uploads/");
    if (uploadsIndex !== -1) {
        return url.slice(uploadsIndex);
    }

    return url;
}

/**
 * DB에서 참조되는 모든 이미지 URL 수집
 */
export async function getAllReferencedImages(): Promise<Set<string>> {
    const referencedUrls = new Set<string>();

    // 1. Content 썸네일 + 본문 이미지
    const contents = await prisma.content.findMany({
        select: { imageUrl: true, content: true },
    });

    for (const content of contents) {
        if (content.imageUrl) {
            referencedUrls.add(normalizeImageUrl(content.imageUrl));
        }
        if (content.content) {
            const images = extractImagesFromLexical(content.content);
            images.forEach((img) => referencedUrls.add(normalizeImageUrl(img)));
        }
    }

    // 2. Post 본문 이미지
    const posts = await prisma.post.findMany({
        select: { content: true },
    });

    for (const post of posts) {
        if (post.content) {
            const images = extractImagesFromLexical(post.content);
            images.forEach((img) => referencedUrls.add(normalizeImageUrl(img)));
        }
    }

    // 3. PostAttachment
    const attachments = await prisma.postAttachment.findMany({
        select: { url: true },
    });

    for (const attachment of attachments) {
        if (attachment.url) {
            referencedUrls.add(normalizeImageUrl(attachment.url));
        }
    }

    // 4. Category 썸네일
    const categories = await prisma.category.findMany({
        select: { thumbnailUrl: true },
    });

    for (const category of categories) {
        if (category.thumbnailUrl) {
            referencedUrls.add(normalizeImageUrl(category.thumbnailUrl));
        }
    }

    // 5. MenuItem 썸네일
    const menuItems = await prisma.menuItem.findMany({
        select: { thumbnailUrl: true },
    });

    for (const menuItem of menuItems) {
        if (menuItem.thumbnailUrl) {
            referencedUrls.add(normalizeImageUrl(menuItem.thumbnailUrl));
        }
    }

    // 6. SiteSettings 이미지들
    const siteSettings = await prisma.siteSettings.findFirst({
        select: { siteLogoUrl: true, ogImageUrl: true, faviconUrl: true },
    });

    if (siteSettings) {
        if (siteSettings.siteLogoUrl) {
            referencedUrls.add(normalizeImageUrl(siteSettings.siteLogoUrl));
        }
        if (siteSettings.ogImageUrl) {
            referencedUrls.add(normalizeImageUrl(siteSettings.ogImageUrl));
        }
        if (siteSettings.faviconUrl) {
            referencedUrls.add(normalizeImageUrl(siteSettings.faviconUrl));
        }
    }

    return referencedUrls;
}
