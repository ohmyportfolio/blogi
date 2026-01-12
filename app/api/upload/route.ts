import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { mkdir, open, stat } from "fs/promises";
import { lookup } from "dns/promises";
import { isIP } from "net";
import path from "path";
import { existsSync } from "fs";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const EXTERNAL_FETCH_TIMEOUT_MS = 8000;

const isPrivateIPv4 = (address: string) => {
    const parts = address.split(".").map((part) => Number(part));
    if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
        return true;
    }
    const [a, b] = parts;
    if (a === 0) return true;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 192 && b === 0) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a === 198 && b === 51) return true;
    if (a === 203 && b === 0) return true;
    if (a >= 224) return true; // multicast/reserved
    return false;
};

const expandIPv6 = (address: string) => {
    const normalized = address.toLowerCase();
    if (normalized === "::") return Array(8).fill("0000");

    const [head, tail] = normalized.split("::");
    const headParts = head ? head.split(":") : [];
    const tailParts = tail ? tail.split(":") : [];
    const missing = 8 - (headParts.length + tailParts.length);
    const zeros = Array(Math.max(missing, 0)).fill("0000");
    const parts = [...headParts, ...zeros, ...tailParts].map((part) => part || "0000");
    return parts.length === 8 ? parts : parts.slice(0, 8);
};

const isPrivateIPv6 = (address: string) => {
    const normalized = address.toLowerCase();
    if (normalized === "::1") return true;
    if (normalized === "::") return true;

    if (normalized.startsWith("::ffff:")) {
        const ipv4 = normalized.replace("::ffff:", "");
        return isPrivateIPv4(ipv4);
    }

    const parts = expandIPv6(normalized);
    const first = Number.parseInt(parts[0] || "0", 16);
    if (Number.isNaN(first)) return true;

    if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7
    if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10
    if ((first & 0xff00) === 0xff00) return true; // ff00::/8
    if ((first & 0xffc0) === 0xfec0) return true; // fec0::/10 (deprecated site-local)
    return false;
};

const isPrivateIp = (address: string) => {
    const ipVersion = isIP(address);
    if (ipVersion === 4) return isPrivateIPv4(address);
    if (ipVersion === 6) return isPrivateIPv6(address);
    return true;
};

const isBlockedHostname = (hostname: string) => {
    const lower = hostname.toLowerCase();
    if (lower === "localhost" || lower.endsWith(".localhost")) return true;
    if (lower.endsWith(".local") || lower.endsWith(".internal") || lower.endsWith(".lan")) return true;
    return false;
};

const validateExternalImageUrl = async (rawUrl: string) => {
    let parsed: URL;
    try {
        parsed = new URL(rawUrl);
    } catch {
        throw new Error("INVALID_URL");
    }

    if (!parsed.protocol || !["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("INVALID_PROTOCOL");
    }

    if (parsed.username || parsed.password) {
        throw new Error("INVALID_CREDENTIALS");
    }

    if (isBlockedHostname(parsed.hostname)) {
        throw new Error("BLOCKED_HOST");
    }

    if (isIP(parsed.hostname)) {
        if (isPrivateIp(parsed.hostname)) {
            throw new Error("PRIVATE_IP");
        }
        return parsed;
    }

    const records = await lookup(parsed.hostname, { all: true });
    if (!records.length) {
        throw new Error("DNS_NOT_FOUND");
    }
    if (records.some((record) => isPrivateIp(record.address))) {
        throw new Error("PRIVATE_IP");
    }

    return parsed;
};

const fetchWithValidation = async (
    rawUrl: string,
    visited = new Set<string>(),
    remaining = MAX_REDIRECTS
) => {
    const validatedUrl = await validateExternalImageUrl(rawUrl);
    if (visited.has(validatedUrl.toString())) {
        throw new Error("REDIRECT_LOOP");
    }
    visited.add(validatedUrl.toString());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_FETCH_TIMEOUT_MS);
    try {
        const response = await fetch(validatedUrl.toString(), {
            redirect: "manual",
            signal: controller.signal,
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; ImageDownloader/1.0)",
            },
        });

        if ([301, 302, 303, 307, 308].includes(response.status)) {
            if (remaining <= 0) {
                throw new Error("REDIRECT_LIMIT");
            }
            const location = response.headers.get("location");
            if (!location) {
                throw new Error("REDIRECT_MISSING");
            }
            const nextUrl = new URL(location, validatedUrl).toString();
            return fetchWithValidation(nextUrl, visited, remaining - 1);
        }

        return response;
    } finally {
        clearTimeout(timeoutId);
    }
};

// 외부 이미지 URL에서 다운로드
async function downloadImage(imageUrl: string): Promise<{ buffer: Buffer; contentType: string; ext: string } | null> {
    try {
        const response = await fetchWithValidation(imageUrl);

        if (!response.ok) return null;

        const contentType = response.headers.get("content-type") || "image/jpeg";
        if (!contentType.startsWith("image/")) return null;
        if (contentType.includes("svg")) return null;

        const contentLength = response.headers.get("content-length");
        if (contentLength && Number(contentLength) > MAX_UPLOAD_BYTES) return null;

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length > MAX_UPLOAD_BYTES) return null;

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

        if (contentType.includes("application/json")) {
            if (session.user.role !== "ADMIN") {
                return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
            }

            const body = await req.json();
            const { imageUrl, scope: rawScope = "misc", confirm } = body;

            if (!confirm) {
                return NextResponse.json({ error: "외부 이미지 다운로드는 보안 경고 확인이 필요합니다." }, { status: 400 });
            }

            if (!imageUrl || typeof imageUrl !== "string") {
                return NextResponse.json({ error: "이미지 URL이 필요합니다" }, { status: 400 });
            }

            const safeScope = rawScope.toLowerCase().replace(/[^a-z0-9_-]/g, "") || "misc";

            const downloaded = await downloadImage(imageUrl);
            if (!downloaded) {
                return NextResponse.json({ error: "외부 이미지 다운로드에 실패했습니다." }, { status: 400 });
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
        if (file.size > MAX_UPLOAD_BYTES) {
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
