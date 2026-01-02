import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { mkdir, open, stat } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// 외부 이미지 URL에서 다운로드
async function downloadImage(imageUrl: string): Promise<{ buffer: Buffer; contentType: string; ext: string } | null> {
    try {
        const response = await fetch(imageUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; ImageDownloader/1.0)",
            },
        });

        if (!response.ok) return null;

        const contentType = response.headers.get("content-type") || "image/jpeg";
        if (!contentType.startsWith("image/")) return null;

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 5MB 제한
        if (buffer.length > 5 * 1024 * 1024) return null;

        // 확장자 결정
        let ext = ".jpg";
        if (contentType.includes("png")) ext = ".png";
        else if (contentType.includes("gif")) ext = ".gif";
        else if (contentType.includes("webp")) ext = ".webp";

        return { buffer, contentType, ext };
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    try {
        const contentType = req.headers.get("content-type") || "";

        // JSON 요청 (외부 이미지 URL 다운로드)
        if (contentType.includes("application/json")) {
            const body = await req.json();
            const { imageUrl, scope: rawScope = "misc" } = body;

            if (!imageUrl || typeof imageUrl !== "string") {
                return NextResponse.json({ error: "이미지 URL이 필요합니다" }, { status: 400 });
            }

            const safeScope = rawScope.toLowerCase().replace(/[^a-z0-9_-]/g, "") || "misc";

            const downloaded = await downloadImage(imageUrl);
            if (!downloaded) {
                return NextResponse.json({ error: "이미지 다운로드 실패" }, { status: 400 });
            }

            // 디렉토리 생성
            const uploadsRoot = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
            const now = new Date();
            const yyyy = String(now.getFullYear());
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            const dd = String(now.getDate()).padStart(2, "0");
            const scopedDir = path.join(uploadsRoot, safeScope, yyyy, mm, dd);
            if (!existsSync(scopedDir)) {
                await mkdir(scopedDir, { recursive: true });
            }

            // 파일 저장
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 8);
            const filename = `${timestamp}-${randomString}${downloaded.ext}`;
            const filePath = path.join(scopedDir, filename);

            const fileHandle = await open(filePath, "w");
            try {
                await fileHandle.writeFile(downloaded.buffer);
                await fileHandle.sync();
            } finally {
                await fileHandle.close();
            }

            const baseUrl = (process.env.UPLOADS_URL || "/uploads").replace(/\/+$/, "");
            const url = `${baseUrl}/${safeScope}/${yyyy}/${mm}/${dd}/${filename}`;
            return NextResponse.json({ url }, { status: 201 });
        }

        // FormData 요청 (파일 업로드)
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const rawScope = (formData.get("scope") as string | null) || "misc";
        const safeScope = rawScope.toLowerCase().replace(/[^a-z0-9_-]/g, "") || "misc";

        if (!file) {
            return NextResponse.json({ error: "파일이 없습니다" }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "지원하지 않는 파일 형식입니다. (JPG, PNG, GIF, WebP만 가능)" },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "파일 크기는 5MB를 초과할 수 없습니다" },
                { status: 400 }
            );
        }

        // Create scoped date directory if it doesn't exist
        const uploadsRoot =
            process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
        const now = new Date();
        const yyyy = String(now.getFullYear());
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const scopedDir = path.join(uploadsRoot, safeScope, yyyy, mm, dd);
        if (!existsSync(scopedDir)) {
            await mkdir(scopedDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const ext = path.extname(file.name) || `.${file.type.split("/")[1]}`;
        const filename = `${timestamp}-${randomString}${ext}`;

        // Save file with fsync for NFS reliability
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = path.join(scopedDir, filename);
        const fileHandle = await open(filePath, "w");
        try {
            await fileHandle.writeFile(buffer);
            await fileHandle.sync(); // Ensure data is flushed to NFS storage
        } finally {
            await fileHandle.close();
        }

        // Verify file is readable (NFS sync check)
        const maxRetries = 3;
        for (let i = 0; i < maxRetries; i++) {
            try {
                const fileStat = await stat(filePath);
                if (fileStat.size === buffer.length) {
                    break;
                }
            } catch {
                if (i === maxRetries - 1) {
                    throw new Error("File verification failed after write");
                }
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }

        // Return URL
        const baseUrl = (process.env.UPLOADS_URL || "/uploads").replace(/\/+$/, "");
        const url = `${baseUrl}/${safeScope}/${yyyy}/${mm}/${dd}/${filename}`;
        return NextResponse.json({ url }, { status: 201 });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "업로드에 실패했습니다" }, { status: 500 });
    }
}
