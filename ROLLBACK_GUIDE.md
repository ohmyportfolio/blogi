# 데이터베이스 마이그레이션 롤백 가이드

## 개요
이 문서는 메인 페이지 대시보드 기능 (마이그레이션 20260101162443) 롤백 절차를 설명합니다.

## 마이그레이션 정보

**마이그레이션 이름**: `20260101162443_add_home_dashboard_settings`

**변경 내용**:
- Category 테이블에 `showOnHome` (BOOLEAN), `homeItemCount` (INTEGER) 컬럼 추가
- Board 테이블에 `showOnHome` (BOOLEAN), `homeItemCount` (INTEGER) 컬럼 추가

**영향받는 기능**:
- 메인 페이지 대시보드 (카테고리별 최신 콘텐츠, 게시판별 최신 글)
- 관리자 > 메뉴 카테고리 설정 (카테고리 메인 노출 토글)
- 관리자 > 게시판 메인 노출 (게시판 메인 노출 토글)

---

## 롤백이 필요한 경우

다음과 같은 상황에서 롤백을 고려하세요:

1. 메인 페이지 대시보드 기능에 심각한 버그가 발견된 경우
2. 성능 문제가 발생한 경우
3. 데이터베이스 마이그레이션 실패로 인한 복구가 필요한 경우
4. 기능을 완전히 제거하고 이전 버전으로 돌아가야 하는 경우

---

## 롤백 전 체크리스트

- [ ] 데이터베이스 전체 백업 완료
- [ ] 현재 운영 중인 서비스 중단 가능 여부 확인
- [ ] 롤백 후 영향받는 기능 목록 확인
- [ ] 개발 환경에서 롤백 테스트 완료

---

## 롤백 절차

### 1단계: 데이터베이스 백업

```bash
# PostgreSQL 백업
pg_dump -U your_username -d your_database -F c -f backup_before_rollback_$(date +%Y%m%d_%H%M%S).dump

# 또는 SQL 형식으로 백업
pg_dump -U your_username -d your_database > backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql
```

### 2단계: 애플리케이션 중지

```bash
# PM2로 관리하는 경우
pm2 stop danang-vip

# 또는 직접 실행 중인 경우
# Ctrl+C로 프로세스 종료
```

### 3단계: 데이터베이스 롤백 실행

#### 방법 A: SQL 스크립트로 롤백 (권장)

```bash
# 데이터베이스에 직접 연결하여 실행
psql -U your_username -d your_database -f prisma/migrations/ROLLBACK_20260101162443_add_home_dashboard_settings.sql
```

#### 방법 B: psql 대화형 모드에서 실행

```bash
# psql 접속
psql -U your_username -d your_database

# SQL 명령어 실행
ALTER TABLE "Board" DROP COLUMN IF EXISTS "showOnHome";
ALTER TABLE "Board" DROP COLUMN IF EXISTS "homeItemCount";
ALTER TABLE "Category" DROP COLUMN IF EXISTS "showOnHome";
ALTER TABLE "Category" DROP COLUMN IF EXISTS "homeItemCount";

# 종료
\q
```

### 4단계: Prisma 스키마 수정

**파일**: `prisma/schema.prisma`

Category 모델에서 다음 줄 제거:
```prisma
// 제거할 줄:
showOnHome      Boolean    @default(false)
homeItemCount   Int        @default(3)
```

Board 모델에서 다음 줄 제거:
```prisma
// 제거할 줄:
showOnHome     Boolean  @default(false)
homeItemCount  Int      @default(5)
```

### 5단계: 마이그레이션 디렉토리 제거

```bash
rm -rf prisma/migrations/20260101162443_add_home_dashboard_settings
```

### 6단계: Prisma Client 재생성

```bash
npx prisma generate
```

### 7단계: 코드 변경사항 되돌리기

다음 파일들을 이전 버전으로 되돌리거나 수정:

1. **app/page.tsx**
   - `homeCategories`, `homeBoards` 쿼리 제거
   - `categoryContentsMap`, `boardPostsMap` 로직 제거
   - Desktop dashboard 섹션 제거 (lines 318-438)
   - 기존 "Latest Posts" 섹션 복원

2. **components/admin/category-settings-client.tsx**
   - "메인 페이지 노출" 섹션 제거
   - `showOnHome`, `homeItemCount` 필드 제거

3. **app/admin/board-settings/page.tsx** (삭제)
   ```bash
   rm -rf app/admin/board-settings
   ```

4. **components/admin/board-home-settings-client.tsx** (삭제)
   ```bash
   rm components/admin/board-home-settings-client.tsx
   ```

5. **app/api/admin/board-settings/route.ts** (삭제)
   ```bash
   rm -rf app/api/admin/board-settings
   ```

6. **app/api/admin/category-settings/route.ts**
   - POST 핸들러에서 `showOnHome`, `homeItemCount` 처리 제거

7. **app/admin/layout.tsx**
   - "게시판 메인 노출" 메뉴 링크 제거 (line 36-38)

### 8단계: 빌드 및 테스트

```bash
# 빌드 실행
npm run build

# 빌드 성공 확인 후 애플리케이션 시작
pm2 start ecosystem.config.js
# 또는
npm run start
```

### 9단계: 동작 확인

1. 메인 페이지 접속 확인
2. 관리자 페이지 접속 확인
3. 카테고리 설정 페이지 정상 작동 확인
4. 기존 기능 정상 작동 확인

---

## 롤백 후 데이터 복구

만약 롤백이 잘못되었거나 데이터를 복구해야 하는 경우:

```bash
# 백업 파일로 복구 (커스텀 포맷)
pg_restore -U your_username -d your_database -c backup_before_rollback_YYYYMMDD_HHMMSS.dump

# 또는 SQL 포맷 백업 파일로 복구
psql -U your_username -d your_database < backup_before_rollback_YYYYMMDD_HHMMSS.sql
```

---

## 참고사항

### Git을 사용하는 경우

```bash
# 특정 커밋으로 되돌리기 (코드 변경사항만)
git log --oneline  # 롤백할 커밋 찾기
git revert <commit-hash>

# 또는 특정 파일만 되돌리기
git checkout <previous-commit-hash> -- app/page.tsx
```

### 데이터베이스 상태 확인

```bash
# 테이블 구조 확인
psql -U your_username -d your_database -c "\d+ Category"
psql -U your_username -d your_database -c "\d+ Board"

# 컬럼 존재 여부 확인
psql -U your_username -d your_database -c "SELECT column_name FROM information_schema.columns WHERE table_name='Category';"
```

---

## 문제 해결

### 문제 1: DROP COLUMN 실패 (의존성 오류)

**증상**: `cannot drop column ... because other objects depend on it`

**해결**:
```sql
-- CASCADE 옵션으로 강제 삭제
ALTER TABLE "Board" DROP COLUMN IF EXISTS "showOnHome" CASCADE;
ALTER TABLE "Board" DROP COLUMN IF EXISTS "homeItemCount" CASCADE;
ALTER TABLE "Category" DROP COLUMN IF EXISTS "showOnHome" CASCADE;
ALTER TABLE "Category" DROP COLUMN IF EXISTS "homeItemCount" CASCADE;
```

### 문제 2: Prisma Client 타입 오류

**증상**: 빌드 시 타입 에러 발생

**해결**:
```bash
# Prisma Client 완전 재생성
rm -rf node_modules/.prisma
npx prisma generate
npm run build
```

### 문제 3: 롤백 후에도 컬럼이 남아있음

**증상**: 데이터베이스에 컬럼이 여전히 존재

**해결**:
```bash
# 수동으로 확인 및 삭제
psql -U your_username -d your_database

-- 컬럼 확인
\d+ Category
\d+ Board

-- 수동 삭제
ALTER TABLE "Category" DROP COLUMN "showOnHome";
ALTER TABLE "Category" DROP COLUMN "homeItemCount";
ALTER TABLE "Board" DROP COLUMN "showOnHome";
ALTER TABLE "Board" DROP COLUMN "homeItemCount";
```

---

## 연락처

롤백 과정에서 문제가 발생하면 개발팀에 문의하세요.

**작성일**: 2026-01-01
**마이그레이션 버전**: 20260101162443
