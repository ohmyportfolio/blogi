import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import "dotenv/config";

const DEFAULT_CONTENT_THUMBNAIL_URL = "/thumbnails/default-content.svg";
const DEFAULT_COMMUNITY_THUMBNAIL_URL = "/thumbnails/default-community.svg";
const SEED_USER_EMAIL = "seed@blogi.local";
const SEED_USER_NAME = "운영팀";
const DEFAULT_LOGO_WHITE_URL = "/logo_white.svg";
const DEFAULT_CONTENT_BANNER_URL = "/branding/seed-banner.svg";

const textNode = (text: string, format = 0) => ({
  detail: 0,
  format,
  mode: "normal",
  style: "",
  text,
  type: "text",
  version: 1,
});

const paragraphNode = (text: string) => ({
  children: [textNode(text)],
  direction: "ltr",
  format: "",
  indent: 0,
  type: "paragraph",
  version: 1,
});

const headingNode = (tag: "h1" | "h2" | "h3", text: string) => ({
  children: [textNode(text)],
  direction: "ltr",
  format: "",
  indent: 0,
  type: "heading",
  version: 1,
  tag,
});

const listItemNode = (text: string, value: number) => ({
  children: [paragraphNode(text)],
  direction: "ltr",
  format: "",
  indent: 0,
  type: "listitem",
  version: 1,
  value,
});

const listNode = (items: string[], listType: "bullet" | "number" = "bullet") => ({
  children: items.map((text, index) => listItemNode(text, index + 1)),
  direction: "ltr",
  format: "",
  indent: 0,
  type: "list",
  version: 1,
  listType,
  start: 1,
  tag: listType === "number" ? "ol" : "ul",
});

const calloutNode = (calloutType: "info" | "warning" | "success" | "tip", content: string) => ({
  type: "callout",
  version: 1,
  calloutType,
  content,
});

const imageNode = (src: string, altText: string, width?: number, height?: number) => ({
  type: "image",
  version: 1,
  src,
  altText,
  width,
  height,
});

const buildLexicalDocument = (nodes: Record<string, unknown>[]) =>
  JSON.stringify({
    root: {
      children: nodes,
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  });

const PLATFORM_INTRO_MARKDOWN = `# 플랫폼에 오신 것을 환영합니다

이 플랫폼은 콘텐츠 관리와 커뮤니티 기능을 제공하는 올인원 솔루션입니다.

## 주요 기능

### 콘텐츠 관리
- **리치 텍스트 에디터**: 강력한 에디터로 다양한 형식의 콘텐츠 작성
- **카테고리 분류**: 체계적인 콘텐츠 구성과 관리
- **이미지 업로드**: 간편한 이미지 첨부 및 크롭 기능

### 커뮤니티
- **게시판 시스템**: 사용자들과 소통할 수 있는 게시판
- **댓글 기능**: 활발한 토론과 피드백 지원
- **좋아요/스크랩**: 유용한 콘텐츠 북마크

### 반응형 디자인
- 모바일 우선 설계로 모든 기기에서 최적화된 경험
- 터치 친화적인 인터페이스

## 시작하기

관리자로 로그인하여 사이트 설정을 커스터마이징하고, 카테고리를 추가하여 나만의 콘텐츠 플랫폼을 구축해보세요.`;

const PLATFORM_INTRO_LEXICAL = buildLexicalDocument([
  headingNode("h1", "플랫폼에 오신 것을 환영합니다"),
  imageNode(DEFAULT_CONTENT_BANNER_URL, "플랫폼 소개 배너", 1200, 630),
  paragraphNode("이 플랫폼은 콘텐츠 관리와 커뮤니티 기능을 제공하는 올인원 솔루션입니다."),
  calloutNode("info", "관리자 설정에서 사이트 이름, 로고, 테마를 먼저 설정해보세요."),
  headingNode("h2", "주요 기능"),
  headingNode("h3", "콘텐츠 관리"),
  listNode([
    "리치 텍스트 에디터로 다양한 형식의 콘텐츠를 작성할 수 있습니다.",
    "카테고리 분류로 체계적인 콘텐츠 관리가 가능합니다.",
    "이미지 업로드와 크롭을 간편하게 처리합니다.",
  ]),
  headingNode("h3", "커뮤니티"),
  listNode([
    "게시판 시스템으로 사용자들과 소통할 수 있습니다.",
    "댓글 기능으로 활발한 토론과 피드백을 지원합니다.",
    "좋아요/스크랩으로 유용한 콘텐츠를 저장할 수 있습니다.",
  ]),
  headingNode("h3", "반응형 디자인"),
  listNode([
    "모바일 우선 설계로 모든 기기에서 최적화된 경험을 제공합니다.",
    "터치 친화적인 인터페이스를 제공합니다.",
  ]),
  headingNode("h2", "시작하기"),
  paragraphNode("관리자로 로그인하여 사이트 설정을 커스터마이징하고, 카테고리를 추가하여 나만의 콘텐츠 플랫폼을 구축해보세요."),
]);

const USAGE_GUIDE_MARKDOWN = `# 시작하기 가이드

이 가이드에서는 플랫폼의 기본적인 사용 방법을 안내합니다.

## 관리자 기능

### 1. 관리자 패널 접속
\`/admin\` 경로로 접속하여 관리자 대시보드에 접근할 수 있습니다.

### 2. 사이트 설정
- **기본 설정**: 사이트 이름, 설명, 로고 등 기본 정보 설정
- **테마 설정**: 색상, 폰트 등 외관 커스터마이징
- **SEO 설정**: 메타 태그, OG 이미지 등 검색 최적화

### 3. 메뉴 관리
- 새로운 카테고리 또는 커뮤니티 메뉴 추가
- 드래그 앤 드롭으로 메뉴 순서 변경
- 메뉴별 썸네일 및 설명 설정

## 콘텐츠 작성

### 새 콘텐츠 생성
1. 관리자 패널 > 콘텐츠 > 새 콘텐츠 작성
2. 제목과 본문 입력
3. 카테고리 선택
4. 썸네일 이미지 설정 (선택사항)
5. 발행

### 에디터 기능
- **텍스트 서식**: 제목, 굵게, 기울임, 밑줄
- **목록**: 순서 있는/없는 목록
- **링크**: 외부 링크 삽입
- **이미지**: 드래그 앤 드롭 또는 버튼으로 이미지 삽입

## 커뮤니티 관리

### 게시판 설정
- 메뉴 관리에서 커뮤니티 타입 메뉴 추가
- 게시판별 이름과 슬러그 설정
- 공개/비공개 설정

### 게시글 관리
- 고정 게시글 설정
- 비밀글 기능
- 댓글 관리

## 도움이 필요하신가요?

추가적인 도움이 필요하시면 관리자에게 문의해주세요.`;

const USAGE_GUIDE_LEXICAL = buildLexicalDocument([
  headingNode("h1", "시작하기 가이드"),
  imageNode(DEFAULT_CONTENT_THUMBNAIL_URL, "관리자 가이드 썸네일", 640, 640),
  paragraphNode("이 가이드에서는 플랫폼의 기본적인 사용 방법을 안내합니다."),
  calloutNode("tip", "초기 설정 후 메뉴와 카테고리를 먼저 정리하면 운영이 훨씬 쉬워집니다."),
  headingNode("h2", "관리자 기능"),
  headingNode("h3", "1. 관리자 패널 접속"),
  paragraphNode("/admin 경로로 접속하여 관리자 대시보드에 접근할 수 있습니다."),
  headingNode("h3", "2. 사이트 설정"),
  listNode([
    "기본 설정: 사이트 이름, 설명, 로고 등 기본 정보 설정",
    "테마 설정: 색상, 폰트 등 외관 커스터마이징",
    "SEO 설정: 메타 태그, OG 이미지 등 검색 최적화",
  ]),
  headingNode("h3", "3. 메뉴 관리"),
  listNode([
    "새로운 카테고리 또는 커뮤니티 메뉴 추가",
    "드래그 앤 드롭으로 메뉴 순서 변경",
    "메뉴별 썸네일 및 설명 설정",
  ]),
  headingNode("h2", "콘텐츠 작성"),
  headingNode("h3", "새 콘텐츠 생성"),
  listNode(
    [
      "관리자 패널 > 콘텐츠 > 새 콘텐츠 작성",
      "제목과 본문 입력",
      "카테고리 선택",
      "썸네일 이미지 설정 (선택사항)",
      "발행",
    ],
    "number"
  ),
  headingNode("h3", "에디터 기능"),
  listNode([
    "텍스트 서식: 제목, 굵게, 기울임, 밑줄",
    "목록: 순서 있는/없는 목록",
    "링크: 외부 링크 삽입",
    "이미지: 드래그 앤 드롭 또는 버튼으로 이미지 삽입",
  ]),
  headingNode("h2", "커뮤니티 관리"),
  headingNode("h3", "게시판 설정"),
  listNode([
    "메뉴 관리에서 커뮤니티 타입 메뉴 추가",
    "게시판별 이름과 슬러그 설정",
    "공개/비공개 설정",
  ]),
  headingNode("h3", "게시글 관리"),
  listNode([
    "고정 게시글 설정",
    "비밀글 기능",
    "댓글 관리",
  ]),
  headingNode("h2", "도움이 필요하신가요?"),
  paragraphNode("추가적인 도움이 필요하시면 관리자에게 문의해주세요."),
]);

const COMMUNITY_WELCOME_MARKDOWN = `# 환영합니다! 👋

이 게시판은 자유롭게 소통하고 정보를 나눌 수 있는 공간입니다.

## 게시판 이용 안내

- **예의 바른 소통**: 서로를 존중하며 대화해주세요
- **유익한 정보 공유**: 도움이 되는 정보를 나눠주세요
- **질문 환영**: 궁금한 점이 있으면 언제든 물어보세요

많은 참여 부탁드립니다!`;

const COMMUNITY_WELCOME_LEXICAL = buildLexicalDocument([
  paragraphNode("환영합니다! 👋"),
  imageNode(DEFAULT_COMMUNITY_THUMBNAIL_URL, "커뮤니티 환영 이미지", 640, 640),
  paragraphNode("이 게시판은 자유롭게 소통하고 정보를 나눌 수 있는 공간입니다."),
  headingNode("h2", "게시판 이용 안내"),
  listNode([
    "예의 바른 소통: 서로를 존중하며 대화해주세요.",
    "유익한 정보 공유: 도움이 되는 정보를 나눠주세요.",
    "질문 환영: 궁금한 점이 있으면 언제든 물어보세요.",
  ]),
  paragraphNode("많은 참여 부탁드립니다!"),
]);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_MAIN_MENU = [
  {
    label: "콘텐츠",
    href: "/contents/content",
    order: 1,
    linkType: "category" as const,
    thumbnailUrl: DEFAULT_CONTENT_THUMBNAIL_URL,
  },
  {
    label: "커뮤니티",
    href: "/community/community",
    order: 2,
    linkType: "community" as const,
    thumbnailUrl: DEFAULT_COMMUNITY_THUMBNAIL_URL,
  },
];

const DEFAULT_BOARDS = [
  { name: "자유게시판", slug: "board-1", order: 1 },
];

const extractCategorySlug = (href: string) => {
  if (!href.startsWith("/contents/")) return null;
  const slug = href.replace("/contents/", "").replace(/^\/+/, "").trim();
  return slug.length ? slug : null;
};

async function main() {
  const existingSettings = await prisma.siteSettings.findUnique({ where: { key: "default" } });
  const siteSettings =
    existingSettings ??
    (await prisma.siteSettings.create({
      data: {
        key: "default",
        siteLogoUrl: DEFAULT_LOGO_WHITE_URL,
        siteLogoUrlDark: DEFAULT_LOGO_WHITE_URL,
        siteLogoMode: "dark",
      },
    }));

  if (
    existingSettings &&
    !existingSettings.siteLogoUrl &&
    !existingSettings.siteLogoUrlLight &&
    !existingSettings.siteLogoUrlDark
  ) {
    await prisma.siteSettings.update({
      where: { id: existingSettings.id },
      data: {
        siteLogoUrl: DEFAULT_LOGO_WHITE_URL,
        siteLogoUrlDark: DEFAULT_LOGO_WHITE_URL,
        siteLogoMode: "dark",
      },
    });
  }

  const mainMenu =
    (await prisma.menu.findUnique({ where: { key: "main" } })) ??
    (await prisma.menu.create({ data: { key: "main", name: "Main" } }));
  const footerMenu =
    (await prisma.menu.findUnique({ where: { key: "footer" } })) ??
    (await prisma.menu.create({ data: { key: "footer", name: "Footer" } }));

  const categoryDefaults = DEFAULT_MAIN_MENU
    .map((item) => ({
      slug: extractCategorySlug(item.href),
      name: item.label,
      order: item.order,
    }))
    .filter((item): item is { slug: string; name: string; order: number } => Boolean(item.slug));

  const existingCategories = await prisma.category.findMany({
    where: { slug: { in: categoryDefaults.map((item) => item.slug) } },
    select: { id: true, slug: true },
  });
  const existingCategorySlugs = new Set(existingCategories.map((item) => item.slug));
  const categoriesToCreate = categoryDefaults.filter((item) => !existingCategorySlugs.has(item.slug));
  if (categoriesToCreate.length) {
    await prisma.category.createMany({
      data: categoriesToCreate.map((item) => ({
        name: item.name,
        slug: item.slug,
        order: item.order,
        isVisible: true,
        thumbnailUrl: DEFAULT_CONTENT_THUMBNAIL_URL,
      })),
    });
  }

  const categories = await prisma.category.findMany({
    where: { slug: { in: categoryDefaults.map((item) => item.slug) } },
    select: { id: true, slug: true },
  });
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category.id]));

  const existingMainItems = await prisma.menuItem.findMany({
    where: { menuId: mainMenu.id },
    select: { id: true, href: true, label: true, order: true, linkType: true, thumbnailUrl: true },
  });
  const existingMainHrefs = new Set(existingMainItems.map((item) => item.href));
  const itemsToCreate = DEFAULT_MAIN_MENU.filter((item) => !existingMainHrefs.has(item.href));
  if (itemsToCreate.length) {
    await prisma.menuItem.createMany({
      data: itemsToCreate.map((item) => {
        const slug = extractCategorySlug(item.href);
        return {
          menuId: mainMenu.id,
          label: item.label,
          href: item.href,
          order: item.order,
          linkType: item.linkType,
          linkedCategoryId: slug ? categoryBySlug.get(slug) ?? null : null,
          isVisible: true,
          thumbnailUrl: item.thumbnailUrl ?? null,
        };
      }),
    });
  }
  const desiredItemByHref = new Map(DEFAULT_MAIN_MENU.map((item) => [item.href, item]));
  for (const item of existingMainItems) {
    if (!item.href) continue;
    const desired = desiredItemByHref.get(item.href);
    if (!desired) continue;
    const needsThumbnail = !item.thumbnailUrl && Boolean(desired.thumbnailUrl);
    if (item.label !== desired.label || item.order !== desired.order || item.linkType !== desired.linkType || needsThumbnail) {
      await prisma.menuItem.update({
        where: { id: item.id },
        data: {
          label: desired.label,
          order: desired.order,
          linkType: desired.linkType,
          ...(needsThumbnail ? { thumbnailUrl: desired.thumbnailUrl ?? null } : {}),
        },
      });
    }
  }

  const communityItems = await prisma.menuItem.findMany({
    where: { menuId: mainMenu.id, linkType: "community" },
  });
  for (const item of communityItems) {
    const boardCount = await prisma.board.count({ where: { menuItemId: item.id } });
    if (boardCount > 0) continue;
    const groupSlug = item.href.split("/").filter(Boolean).pop() ?? "community-1";
    await prisma.board.createMany({
      data: DEFAULT_BOARDS.map((board) => ({
        menuItemId: item.id,
        name: board.name,
        slug: board.slug,
        key: `${groupSlug}__${board.slug}`,
        order: board.order,
        isVisible: true,
      })),
    });
  }

  // Seed content for Content category
  const contentCategory = categories.find((c) => c.slug === "content");
  if (contentCategory) {
    const seedContents = [
      {
        title: "플랫폼 소개",
        content: PLATFORM_INTRO_LEXICAL,
        contentMarkdown: PLATFORM_INTRO_MARKDOWN,
        imageUrl: DEFAULT_CONTENT_THUMBNAIL_URL,
      },
      {
        title: "사용 가이드",
        content: USAGE_GUIDE_LEXICAL,
        contentMarkdown: USAGE_GUIDE_MARKDOWN,
        imageUrl: DEFAULT_CONTENT_THUMBNAIL_URL,
      },
    ];

    for (const seed of seedContents) {
      const existingContent = await prisma.content.findFirst({
        where: { categoryId: contentCategory.id, title: seed.title },
        select: { id: true },
      });

      if (existingContent) {
        await prisma.content.update({
          where: { id: existingContent.id },
          data: {
            content: seed.content,
            contentMarkdown: seed.contentMarkdown,
            imageUrl: seed.imageUrl,
            isVisible: true,
          },
        });
      } else {
        await prisma.content.create({
          data: {
            title: seed.title,
            content: seed.content,
            imageUrl: seed.imageUrl,
            contentMarkdown: seed.contentMarkdown,
            categoryId: contentCategory.id,
            isVisible: true,
          },
        });
      }
    }

    console.log("Seed content articles ready");
  }

  // Seed posts for Community boards (admin or seed user)
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  let postAuthor = adminUser;
  if (!postAuthor) {
    const seedPassword = await bcrypt.hash(randomUUID(), 10);
    postAuthor = await prisma.user.upsert({
      where: { email: SEED_USER_EMAIL },
      update: { name: SEED_USER_NAME, isApproved: true },
      create: {
        name: SEED_USER_NAME,
        email: SEED_USER_EMAIL,
        password: seedPassword,
        role: "USER",
        isApproved: true,
      },
      select: { id: true },
    });
  }

  if (postAuthor) {
    const allBoards = await prisma.board.findMany({
      where: { isVisible: true, isDeleted: false },
      select: { id: true, key: true, name: true },
    });

    for (const board of allBoards) {
      const existingPostCount = await prisma.post.count({
        where: { boardId: board.id },
      });

      const welcomeTitle = `${board.name}에 오신 것을 환영합니다!`;
      const existingWelcome = await prisma.post.findFirst({
        where: { boardId: board.id, title: welcomeTitle },
        select: { id: true },
      });

      if (existingWelcome) {
        await prisma.post.update({
          where: { id: existingWelcome.id },
          data: {
            authorId: postAuthor.id,
            content: COMMUNITY_WELCOME_LEXICAL,
            contentMarkdown: COMMUNITY_WELCOME_MARKDOWN,
            isPinned: true,
          },
        });
      } else if (existingPostCount === 0) {
        await prisma.post.create({
          data: {
            boardId: board.id,
            authorId: postAuthor.id,
            title: welcomeTitle,
            content: COMMUNITY_WELCOME_LEXICAL,
            contentMarkdown: COMMUNITY_WELCOME_MARKDOWN,
            isPinned: true,
          },
        });

        console.log(`Created seed post for board: ${board.name}`);
      }
    }
  }

  console.log({
    siteSettings: siteSettings.key,
    mainMenu: mainMenu.key,
    footerMenu: footerMenu.key,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
