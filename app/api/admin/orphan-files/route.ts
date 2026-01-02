import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { readdir, stat, unlink } from "fs/promises";
import path from "path";
import { getAllReferencedImages, normalizeImageUrl } from "@/lib/extract-images";

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
const UPLOADS_URL_PREFIX = "/uploads";

// 제외할 폴더 목록
const EXCLUDED_FOLDERS = ["branding"];

// 24시간 (밀리초)
const ORPHAN_THRESHOLD_MS = 24 * 60 * 60 * 1000;

interface FileInfo {
    path: string; // 상대 경로 (/uploads/...)
    absolutePath: string;
    name: string;
    size: number;
    createdAt: Date;
    ageInHours: number;
}

/**
 * uploads 폴더의 모든 이미지 파일 스캔
 */
async function scanUploadedFiles(dir: string, basePath: string = ""): Promise<FileInfo[]> {
    const files: FileInfo[] = [];
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    try {
        const entries = await readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.join(basePath, entry.name);

            if (entry.isDirectory()) {
                // 제외 폴더 스킵
                if (EXCLUDED_FOLDERS.includes(entry.name)) {
                    continue;
                }
                // 재귀적으로 하위 폴더 스캔
                const subFiles = await scanUploadedFiles(fullPath, relativePath);
                files.push(...subFiles);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (imageExtensions.includes(ext)) {
                    const fileStat = await stat(fullPath);
                    const now = Date.now();
                    const ageMs = now - fileStat.birthtime.getTime();

                    files.push({
                        path: `${UPLOADS_URL_PREFIX}/${relativePath}`.replace(/\\/g, "/"),
                        absolutePath: fullPath,
                        name: entry.name,
                        size: fileStat.size,
                        createdAt: fileStat.birthtime,
                        ageInHours: Math.floor(ageMs / (1000 * 60 * 60)),
                    });
                }
            }
        }
    } catch (error) {
        console.error(`Error scanning directory ${dir}:`, error);
    }

    return files;
}

/**
 * GET: 고아 파일 목록 조회
 */
export async function GET() {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
    }

    try {
        // 1. 모든 업로드된 파일 스캔
        const allFiles = await scanUploadedFiles(UPLOADS_DIR);

        // 2. DB에서 참조되는 모든 이미지 URL 수집
        const referencedUrls = await getAllReferencedImages();

        // 3. 고아 파일 필터링
        const now = Date.now();
        const orphanFiles: FileInfo[] = [];
        const referencedFiles: FileInfo[] = [];

        for (const file of allFiles) {
            const normalizedPath = normalizeImageUrl(file.path);

            if (referencedUrls.has(normalizedPath)) {
                referencedFiles.push(file);
            } else {
                // 24시간 이상 지난 파일만 고아 파일로 판정
                const ageMs = now - file.createdAt.getTime();
                if (ageMs >= ORPHAN_THRESHOLD_MS) {
                    orphanFiles.push(file);
                }
            }
        }

        // 통계 계산
        const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0);
        const referencedSize = referencedFiles.reduce((sum, f) => sum + f.size, 0);
        const orphanSize = orphanFiles.reduce((sum, f) => sum + f.size, 0);

        return NextResponse.json({
            stats: {
                totalFiles: allFiles.length,
                totalSize,
                referencedFiles: referencedFiles.length,
                referencedSize,
                orphanFiles: orphanFiles.length,
                orphanSize,
            },
            orphanFiles: orphanFiles.map((f) => ({
                path: f.path,
                name: f.name,
                size: f.size,
                createdAt: f.createdAt.toISOString(),
                ageInHours: f.ageInHours,
            })),
        });
    } catch (error) {
        console.error("Error fetching orphan files:", error);
        return NextResponse.json({ error: "고아 파일 조회 실패" }, { status: 500 });
    }
}

/**
 * DELETE: 고아 파일 삭제
 */
export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { files } = body as { files?: string[] };

        if (!files || !Array.isArray(files) || files.length === 0) {
            return NextResponse.json({ error: "삭제할 파일 목록이 필요합니다" }, { status: 400 });
        }

        // 참조되는 파일 목록 가져오기 (안전 체크)
        const referencedUrls = await getAllReferencedImages();

        let deletedCount = 0;
        let skippedCount = 0;
        const errors: string[] = [];

        for (const filePath of files) {
            const normalizedPath = normalizeImageUrl(filePath);

            // 안전 체크: DB에서 참조되는 파일은 삭제하지 않음
            if (referencedUrls.has(normalizedPath)) {
                skippedCount++;
                errors.push(`${filePath}: DB에서 참조 중인 파일입니다`);
                continue;
            }

            // /uploads/... 형태의 경로를 절대 경로로 변환
            const relativePath = normalizedPath.replace(/^\/uploads\//, "");
            const absolutePath = path.join(UPLOADS_DIR, relativePath);

            // 경로 검증 (path traversal 방지)
            if (!absolutePath.startsWith(UPLOADS_DIR)) {
                skippedCount++;
                errors.push(`${filePath}: 잘못된 경로입니다`);
                continue;
            }

            try {
                await unlink(absolutePath);
                deletedCount++;
            } catch (err) {
                skippedCount++;
                errors.push(`${filePath}: 삭제 실패`);
                console.error(`Failed to delete ${absolutePath}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            deletedCount,
            skippedCount,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error("Error deleting orphan files:", error);
        return NextResponse.json({ error: "파일 삭제 실패" }, { status: 500 });
    }
}
