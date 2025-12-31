# Agents 가이드

AI 에이전트가 이 프로젝트에서 작업할 때 따라야 할 규칙과 절차입니다.

## UI/UX 개발 원칙

### 모바일 우선 (Mobile First)

> **필수**: 모든 UI/UX는 반드시 모바일 우선으로 개발합니다.

| 항목 | 규칙 |
|------|------|
| Tailwind CSS | 기본 스타일 = 모바일, `md:` `lg:` = 데스크탑 확장 |
| 터치 영역 | 버튼/링크 최소 44px × 44px |
| 테스트 | 모바일 뷰포트(375px)에서 먼저 확인 |
| 폰트 크기 | 최소 14px 이상 |
| 레이아웃 | 세로 스크롤 기본, 가로 스크롤 금지 |

```css
/* 올바른 예시 - 모바일 우선 */
.element {
  @apply w-full px-4 md:w-1/2 md:px-6 lg:w-1/3;
}

/* 잘못된 예시 - 데스크탑 우선 */
.element {
  @apply w-1/3 px-6 sm:w-full sm:px-4;
}
```

---

## 환경 인식

### 현재 환경: 운영 (Production)

| 항목 | 값 |
|------|-----|
| 환경 | **운영 (Production)** |
| 서버 | 103.167.151.104 |
| 경로 | /projects/danang-vip |
| 도메인 | https://gc.lumejs.com |
| 포트 | 3010 |
| PM2 앱 | danang-vip |

---

## 작업 규칙

### 운영 환경에서의 규칙

1. **코드 변경 시 반드시 빌드 테스트**
   ```bash
   npm run build
   ```

2. **빌드 성공 후에만 커밋/푸시**

3. **PM2 재시작 필수** (코드 변경 배포 시)
   ```bash
   pm2 delete danang-vip && pm2 start ecosystem.config.cjs && pm2 save
   ```

4. **환경변수(.env) 변경 시**
   - 재빌드 필수: `npm run build`
   - PM2 완전 재시작 필수

5. **DB 스키마 변경 시**
   ```bash
   npm run db:deploy
   ```

---

## 배포 체크리스트

### 일반 코드 변경

- [ ] `npm run build` 성공
- [ ] `git add -A && git commit && git push`
- [ ] `pm2 delete danang-vip && pm2 start ecosystem.config.cjs && pm2 save`
- [ ] `pm2 logs danang-vip` 에러 확인

### 환경변수 변경

- [ ] `.env` 수정
- [ ] `npm run build` (재빌드 필수!)
- [ ] `pm2 delete danang-vip && pm2 start ecosystem.config.cjs && pm2 save`
- [ ] 기능 테스트

### DB 스키마 변경

- [ ] `prisma/schema.prisma` 수정
- [ ] `npx prisma generate`
- [ ] `npm run db:deploy`
- [ ] `npm run build`
- [ ] PM2 재시작

---

## 공통 컴포넌트

### Toast (스낵바)
- **경로**: `components/ui/toast.tsx`
- **용도**: 하단에서 슬라이드 업되는 알림 메시지
- **사용법**:
```tsx
import { useToast } from "@/components/ui/toast";

const MyComponent = () => {
    const { showToast } = useToast();

    // 성공 메시지
    showToast("성공했습니다!", "success");

    // 에러 메시지
    showToast("실패했습니다.", "error");

    // 정보 메시지
    showToast("알림 메시지", "info");
};
```
- **타입**: `"success"` | `"error"` | `"info"`
- **자동 닫힘**: 3초 후 자동으로 사라짐
- **위치**: 화면 하단 중앙

---

## 인증 관련

### 회원가입 승인 시스템
- 일반 사용자 회원가입 시 `isApproved: false`로 생성됨
- 관리자가 승인해야 로그인 가능
- 승인 대기 중 로그인 시도 시 토스트 메시지로 안내

---

## Lexical 에디터

### 컴포넌트 경로
- `components/editor/rich-text-editor.tsx`
- 읽기 전용 렌더: `components/editor/rich-text-viewer.tsx`

### 저장 형식
- 게시글/콘텐츠 내용은 **Lexical JSON 문자열**로 저장합니다.
- 필요 시 `contentMarkdown`에 Markdown 문자열을 함께 저장합니다.

### 이미지 업로드
- `/api/upload`로 업로드 후 반환된 URL을 `ImageNode`로 삽입합니다.
- Base64 사용 금지, 외부 스토리지/정적 서빙 URL 사용

---

## 자주 발생하는 에러

### 1. AuthJS UntrustedHost

```
[auth][error] UntrustedHost: Host must be trusted
```

**원인**: `AUTH_TRUST_HOST`와 `AUTH_URL` 환경변수 누락

**해결**:
```bash
# .env에 추가
AUTH_TRUST_HOST=true
AUTH_URL="https://gc.lumejs.com"

# 재빌드 & 재시작
npm run build
pm2 delete danang-vip && pm2 start ecosystem.config.cjs && pm2 save
```

### 2. Suspense boundary 에러

```
useSearchParams() should be wrapped in a suspense boundary
```

**해결**: 컴포넌트를 `<Suspense>`로 감싸기

```tsx
import { Suspense } from "react";

function MyComponent() {
  const searchParams = useSearchParams();
  // ...
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MyComponent />
    </Suspense>
  );
}
```

### 3. 타입 에러

**빌드 전에 항상 타입 체크**:
```bash
npm run build
```

---

## 명령어 참조

### PM2

```bash
# 상태
pm2 list
pm2 show danang-vip

# 로그
pm2 logs danang-vip
pm2 logs danang-vip --lines 50 --nostream

# 재시작
pm2 restart danang-vip                    # 단순 재시작
pm2 delete danang-vip && pm2 start ecosystem.config.cjs  # 환경변수 새로 로드

# 저장
pm2 save
```

### Git

```bash
git status
git diff
git add -A
git commit -m "메시지"
git push
```

### Prisma

```bash
npx prisma generate      # 클라이언트 생성
npx prisma studio        # DB GUI (localhost:5555)
npm run db:migrate       # 개발 마이그레이션
npm run db:deploy        # 운영 마이그레이션
```

### 빌드 & 테스트

```bash
npm run build            # 프로덕션 빌드
npm run dev              # 개발 서버 (포트 3000)
```

---

## 환경별 차이

| 항목 | 개발 | 운영 |
|------|------|------|
| 서버 | localhost | 103.167.151.104 |
| 포트 | 3000 | 3010 |
| 명령어 | `npm run dev` | PM2 |
| DB 마이그레이션 | `npm run db:migrate` | `npm run db:deploy` |
| AUTH_TRUST_HOST | 불필요 | **필수** |
| AUTH_URL | 불필요 | **필수** |

---

## 중요 파일

| 파일 | 설명 |
|------|------|
| `.env` | 환경변수 (gitignore) |
| `ecosystem.config.cjs` | PM2 설정 |
| `prisma/schema.prisma` | DB 스키마 |
| `auth.ts` | NextAuth 설정 |
| `lib/prisma.ts` | Prisma 클라이언트 |

---

## 문서화 규칙

### 설치/운영 메모
- 설치 관련 메모 사항은 `docs/install.md`에 작성합니다.

### Prisma Studio
- http://localhost:5556/
