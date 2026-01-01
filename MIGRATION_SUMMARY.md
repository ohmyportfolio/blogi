# 마이그레이션 요약: 메인 페이지 대시보드

## 마이그레이션 정보

- **일자**: 2026-01-01
- **마이그레이션 ID**: 20260101162443_add_home_dashboard_settings
- **상태**: ✅ 완료

---

## 변경 사항

### 데이터베이스 (Prisma Schema)

#### Category 모델
```prisma
model Category {
  // ... 기존 필드 ...
  showOnHome      Boolean    @default(false)    // 메인 페이지 노출 여부
  homeItemCount   Int        @default(3)        // 메인 페이지 표시 개수
}
```

#### Board 모델
```prisma
model Board {
  // ... 기존 필드 ...
  showOnHome     Boolean  @default(false)    // 메인 페이지 노출 여부
  homeItemCount  Int      @default(5)        // 메인 페이지 표시 개수
}
```

---

### 신규 파일

1. **관리자 UI**:
   - [app/admin/board-settings/page.tsx](app/admin/board-settings/page.tsx)
   - [components/admin/board-home-settings-client.tsx](components/admin/board-home-settings-client.tsx)

2. **API 엔드포인트**:
   - [app/api/admin/board-settings/route.ts](app/api/admin/board-settings/route.ts)

3. **롤백 파일**:
   - [prisma/migrations/ROLLBACK_20260101162443_add_home_dashboard_settings.sql](prisma/migrations/ROLLBACK_20260101162443_add_home_dashboard_settings.sql)
   - [ROLLBACK_GUIDE.md](ROLLBACK_GUIDE.md)

---

### 수정된 파일

1. **[app/page.tsx](app/page.tsx)**
   - 메인 페이지 대시보드 섹션 추가
   - 카테고리별 최신 콘텐츠 표시
   - 게시판별 최신 글 표시
   - 데스크탑 전용 (`hidden md:block`)

2. **[components/admin/category-settings-client.tsx](components/admin/category-settings-client.tsx)**
   - "메인 페이지 노출" 토글 추가
   - 표시 개수 설정 입력 추가

3. **[app/api/admin/category-settings/route.ts](app/api/admin/category-settings/route.ts)**
   - `showOnHome`, `homeItemCount` 필드 처리 추가

4. **[app/admin/layout.tsx](app/admin/layout.tsx)**
   - "게시판 메인 노출" 메뉴 링크 추가

---

## 기능 설명

### 사용자 기능

#### 메인 페이지 대시보드 (데스크탑 전용)
- 메인 노출 설정된 카테고리의 최신 콘텐츠를 3열 그리드로 표시
- 메인 노출 설정된 게시판의 최신 글을 리스트 형태로 표시
- 각 섹션마다 "더 보기" 버튼으로 전체 목록 이동

### 관리자 기능

#### 1. 메뉴 카테고리 설정 (`/admin/category-settings`)
- 각 카테고리별 "메인 페이지 노출" 토글
- 표시 개수 설정 (1-10개, 기본값 3개)

#### 2. 게시판 메인 노출 (`/admin/board-settings`)
- 커뮤니티 그룹별로 게시판 목록 표시
- 각 게시판별 "메인 페이지 노출" 토글
- 표시 개수 설정 (1-10개, 기본값 5개)

---

## 데이터 흐름

### 카테고리 콘텐츠 표시

1. 관리자가 `/admin/category-settings`에서 카테고리 설정
2. `showOnHome: true` + `homeItemCount: n` 저장
3. 메인 페이지에서 해당 카테고리의 최신 콘텐츠 n개 쿼리
4. 3열 그리드 카드로 표시 (이미지 + 제목 + 날짜)

### 게시판 글 표시

1. 관리자가 `/admin/board-settings`에서 게시판 설정
2. `showOnHome: true` + `homeItemCount: n` 저장
3. 메인 페이지에서 해당 게시판의 최신 글 n개 쿼리 (고정글 우선)
4. 리스트 형태로 표시 (제목 + 작성자 + 날짜 + 조회수)

---

## 성능 고려사항

### 쿼리 최적화
- 필요한 필드만 SELECT (Prisma select 사용)
- `showOnHome: true` 필터로 쿼리 범위 최소화
- 카테고리/게시판별 개별 쿼리 (for...of 루프)

### 캐싱 전략
- 설정 변경 시 `revalidatePath("/", "layout")` 호출
- Next.js 빌드 타임 정적 생성 (force-dynamic으로 동적 렌더링)

### 인덱스 권장사항
```sql
-- 성능 향상을 위한 인덱스 (선택사항)
CREATE INDEX idx_category_showonhome ON "Category"("showOnHome") WHERE "showOnHome" = true;
CREATE INDEX idx_board_showonhome ON "Board"("showOnHome") WHERE "showOnHome" = true;
```

---

## 롤백 방법

### 빠른 롤백
```bash
# 1. 데이터베이스 롤백
psql -U your_username -d your_database -f prisma/migrations/ROLLBACK_20260101162443_add_home_dashboard_settings.sql

# 2. Prisma 스키마에서 필드 제거 후
npx prisma generate

# 3. 코드 변경사항 되돌리기
# (ROLLBACK_GUIDE.md 참고)

# 4. 빌드 및 재시작
npm run build
pm2 restart danang-vip
```

### 상세 롤백 절차
자세한 내용은 [ROLLBACK_GUIDE.md](ROLLBACK_GUIDE.md) 참조

---

## 테스트 체크리스트

### 빌드 테스트
- [x] `npm run build` 성공
- [x] TypeScript 컴파일 에러 없음
- [x] 모든 라우트 빌드 성공

### 기능 테스트 (권장)
- [ ] 메인 페이지 접속 시 대시보드 표시 확인
- [ ] 카테고리 설정에서 메인 노출 토글 동작 확인
- [ ] 게시판 설정에서 메인 노출 토글 동작 확인
- [ ] 표시 개수 변경 시 즉시 반영 확인
- [ ] 모바일에서 대시보드 숨김 확인
- [ ] 데스크탑에서 대시보드 표시 확인

### 성능 테스트 (권장)
- [ ] 메인 페이지 로딩 속도 측정
- [ ] 데이터베이스 쿼리 수 확인
- [ ] 쿼리 실행 시간 모니터링

---

## 관련 문서

- [Plan Mode File](~/.claude/plans/proud-squishing-toucan.md)
- [Rollback Guide](ROLLBACK_GUIDE.md)
- [Prisma Schema](prisma/schema.prisma)

---

## 커밋 정보

**권장 커밋 메시지**:
```
feat: add main page dashboard with category and board sections

- Add showOnHome and homeItemCount fields to Category and Board models
- Implement admin UI for controlling home page visibility
- Add dynamic dashboard on main landing page (desktop only)
- Display latest content by category and latest posts by board
- Add rollback script and documentation

Migration: 20260101162443_add_home_dashboard_settings
```

---

**작성일**: 2026-01-01
**작성자**: Claude Sonnet 4.5
**마이그레이션 버전**: 20260101162443
