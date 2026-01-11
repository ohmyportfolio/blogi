# Claude Code 가이드

이 문서는 Claude Code가 이 프로젝트에서 작업할 때 참고해야 할 컨텍스트입니다.

## 환경 정보

### 현재 환경: 로컬 개발 (기본)

- **프로젝트 경로**: 로컬 워크스페이스
- **기본 포트**: 3000
- **PM2 앱 이름**: `blogi`

> 운영 환경으로 배포할 경우, `PM2_APP_NAME`, `PORT`, `APP_CWD`를 환경변수로 지정하세요.

---

## UI/UX 개발 원칙

### 모바일 우선 (Mobile First)

> **필수**: 모든 UI/UX는 반드시 모바일 우선으로 개발합니다.

- **Tailwind CSS**: 기본 스타일은 모바일, `md:`, `lg:` 등으로 데스크탑 확장
- **터치 영역**: 버튼/링크는 최소 44px × 44px
- **테스트**: 개발 시 모바일 뷰포트(375px)에서 먼저 확인
- **폰트**: 모바일에서 읽기 편한 크기 (최소 14px)
- **레이아웃**: 세로 스크롤 기본, 가로 스크롤 금지

---

## 작업 시 주의사항

### 1. 코드 변경 후 반드시 해야 할 것

```bash
# 빌드 테스트
npm run build

# 빌드 성공 시 PM2 재시작
pm2 delete blogi && pm2 start ecosystem.config.cjs --update-env && pm2 save
```

### 2. 환경변수 변경 시

`.env` 파일 수정 후:
1. `npm run build` 재실행 (Next.js는 빌드 시점에 환경변수 로드)
2. `pm2 delete blogi && pm2 start ecosystem.config.cjs --update-env` (PM2 환경변수 새로 로드)

### 3. DB 스키마 변경 시

**⚠️ Shadow Database 권한 문제 해결**

권한 제한이 있는 운영 DB에서는 shadow database 생성이 실패할 수 있습니다.
필요 시 `SHADOW_DATABASE_URL`을 별도 DB로 지정하거나 수동 마이그레이션을 사용합니다.

```bash
# 1. schema.prisma 수정
# 2. 마이그레이션 디렉토리 생성
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_변경_설명

# 3. migration.sql 수동 작성
# ALTER TABLE "TableName" ADD COLUMN "newColumn" TYPE DEFAULT value;

# 4. 마이그레이션 적용됨으로 표시
npx prisma migrate resolve --applied [마이그레이션_폴더명]

# 5. Prisma Client 재생성
npx prisma generate
```

### 4. 커밋 전 체크리스트

- [ ] `npm run build` 성공 확인
- [ ] 타입 에러 없음
- [ ] PM2 재시작 후 정상 동작 확인
- [ ] `pm2 logs blogi`에서 에러 없음

---

## 자주 사용하는 명령어

### PM2
```bash
pm2 list                    # 상태 확인
pm2 logs blogi              # 로그 확인
pm2 logs blogi --lines 50   # 최근 50줄
pm2 restart blogi           # 재시작 (환경변수 유지)
pm2 delete blogi && pm2 start ecosystem.config.cjs --update-env  # 완전 재시작
```

### Git
```bash
git status
git add -A && git commit -m "메시지" && git push
```

### Prisma
```bash
npx prisma generate         # 클라이언트 생성
npx prisma studio           # DB GUI (localhost:5555)
npm run db:deploy           # 마이그레이션 적용
```

---

## 알려진 이슈 및 해결책

### AuthJS "UntrustedHost" 에러

**증상**:
```
[auth][error] UntrustedHost: Host must be trusted
```

**해결**:
`.env`에 다음 추가:
```env
AUTH_TRUST_HOST=true
AUTH_URL="https://your-domain.com"
SITE_URL="https://your-domain.com"
```
이후 재빌드 및 PM2 재시작

### PM2 환경변수 미적용

**해결**: `pm2 restart`가 아닌 아래 명령 사용:
```bash
pm2 delete blogi && pm2 start ecosystem.config.cjs --update-env && pm2 save
```

### useSearchParams Suspense 에러

**해결**: `useSearchParams()`를 사용하는 컴포넌트를 `<Suspense>`로 감싸기

---

## 기술 스택

- Next.js 16.1.0 (App Router)
- TypeScript
- PostgreSQL + Prisma ORM
- NextAuth.js v5 (Auth.js)
- Tailwind CSS
- Lexical Editor
- PM2

---

## 파일 구조 요약

```
app/
├── admin/          # 관리자 페이지
├── api/            # API 라우트
├── community/      # 커뮤니티
└── contents/       # 콘텐츠

components/
├── admin/          # 관리자 컴포넌트
├── layout/         # 헤더, 푸터 등
├── ui/             # 공통 UI
└── editor/         # Lexical 에디터

lib/
├── prisma.ts       # Prisma 클라이언트
├── menus.ts        # 메뉴 설정
└── utils.ts        # 유틸리티

prisma/
├── schema.prisma   # DB 스키마
└── migrations/     # 마이그레이션 파일
```

---

## 셋업 메모 (2026-01-11)

- `postgres:18`부터는 `/var/lib/postgresql` 마운트가 필요함. `/var/lib/postgresql/data`로 마운트하면 컨테이너가 부팅 실패.
- 5432 포트를 사용 중이던 기존 PostgreSQL 컨테이너를 먼저 중지해야 했음.
