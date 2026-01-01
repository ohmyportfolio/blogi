# Claude Code 가이드

이 문서는 Claude Code가 이 프로젝트에서 작업할 때 참고해야 할 컨텍스트입니다.

## 환경 정보

### 현재 환경: 운영 (Production)

- **서버**: 103.167.151.104
- **프로젝트 경로**: `/projects/danang-vip`
- **도메인**: https://gc.lumejs.com
- **포트**: 3010
- **프로세스 매니저**: PM2

> **중요**: 이 서버는 **운영 환경**입니다. 코드 변경 시 주의가 필요합니다.

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
pm2 delete danang-vip && pm2 start ecosystem.config.cjs && pm2 save
```

### 2. 환경변수 변경 시

`.env` 파일 수정 후:
1. `npm run build` 재실행 (Next.js는 빌드 시점에 환경변수 로드)
2. `pm2 delete danang-vip && pm2 start ecosystem.config.cjs` (PM2 환경변수 새로 로드)

### 3. DB 스키마 변경 시

**⚠️ Shadow Database 권한 문제 해결**

이 프로젝트는 운영 DB를 사용하며 shadow database 생성 권한이 없습니다.

**해결 방법**:
1. `.env`에 `SHADOW_DATABASE_URL` 추가 (별도 DB 사용 시)
2. 또는 수동 마이그레이션:

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

**정상 작동 시**:
```bash
npx prisma migrate dev --name "변경_설명"
# 또는 운영 환경에서
npm run db:deploy
```

### 4. 커밋 전 체크리스트

- [ ] `npm run build` 성공 확인
- [ ] 타입 에러 없음
- [ ] PM2 재시작 후 정상 동작 확인
- [ ] `pm2 logs danang-vip`에서 에러 없음

---

## 자주 사용하는 명령어

### PM2
```bash
pm2 list                    # 상태 확인
pm2 logs danang-vip         # 로그 확인
pm2 logs danang-vip --lines 50  # 최근 50줄
pm2 restart danang-vip      # 재시작 (환경변수 유지)
pm2 delete danang-vip && pm2 start ecosystem.config.cjs  # 완전 재시작
```

### Git
```bash
git status
git add -A && git commit -m "메시지" && git push
```

### Prisma
```bash
npx prisma generate         # 클라이언트 생성
npx prisma studio           # DB GUI
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
AUTH_URL="https://gc.lumejs.com"
```
이후 재빌드 및 PM2 재시작

### PM2 환경변수 미적용

**증상**: `.env` 변경했는데 적용 안됨

**해결**: `pm2 restart`가 아닌 아래 명령 사용:
```bash
pm2 delete danang-vip && pm2 start ecosystem.config.cjs && pm2 save
```

### useSearchParams Suspense 에러

**증상**: 빌드 시 Suspense boundary 에러

**해결**: `useSearchParams()`를 사용하는 컴포넌트를 `<Suspense>`로 감싸기

---

## 기술 스택

- Next.js 16.1.0 (App Router)
- TypeScript
- PostgreSQL 17 + Prisma ORM
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
