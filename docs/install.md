# 프로젝트 설치 및 운영 셋업

이 문서는 Blogi의 개발/운영 셋업에 필요한 최소 정보를 정리합니다.

## 1) 공통 환경 변수

필수 환경 변수는 다음과 같습니다.

- `DATABASE_URL`: PostgreSQL 연결 문자열
- `AUTH_SECRET`: NextAuth 시크릿 키
- `UPLOADS_DIR`: 업로드 파일 저장 경로
- `UPLOADS_URL`: 업로드 파일 접근 URL 프리픽스
- `SITE_URL`: 사이트 기본 URL (sitemap/RSS/OG용)

## 2) 개발 환경 (로컬)

### PostgreSQL (Docker)

```bash
# 5432 포트가 이미 사용 중이면 기존 컨테이너를 중지하세요.
# 예: docker stop <container_name>

docker run -d \
  --name postgres-18 \
  -e POSTGRES_USER=blogi \
  -e POSTGRES_PASSWORD='blogi1234!' \
  -e POSTGRES_DB=blogi \
  -p 5432:5432 \
  -v postgres-18-data:/var/lib/postgresql \
  postgres:18
```

### 기본 동작

개발 환경에서는 기본적으로 `./uploads`에 파일이 저장됩니다.
`UPLOADS_DIR`와 `UPLOADS_URL`을 설정하지 않으면 아래 값이 사용됩니다.

- `UPLOADS_DIR=./uploads`
- `UPLOADS_URL=/uploads`

### 개발 서버 실행

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

## 3) 운영 환경 (일반)

### 배포 방식

- **실행 방식**: `next start` (PM2로 관리)
- **파일 서빙**: Next.js가 직접 처리 (`app/uploads/[[...path]]/route.ts`)
- **리버스 프록시**: Nginx/Traefik 등 자유롭게 선택

### 운영 환경 변수 (.env)

```env
DATABASE_URL="postgresql://blogi:<PASSWORD>@localhost:5432/blogi?schema=public"
AUTH_SECRET="<production-secret>"
AUTH_TRUST_HOST=true
AUTH_URL="https://your-domain.com"
SITE_URL="https://your-domain.com"

# Uploads
UPLOADS_DIR=/data/blogi/uploads
UPLOADS_URL=/uploads

# Pexels (optional)
PEXELS_API_KEY="<API KEY>"
IMAGE_REMOTE_HOST="your-domain.com"
```

### PM2 실행

```bash
export PM2_APP_NAME=blogi
export PORT=3000
export APP_CWD=/path/to/blogi

pm2 delete blogi && pm2 start ecosystem.config.cjs --update-env
pm2 save
```

### 디렉토리 권한

앱 서버(PM2)가 `/data/blogi/uploads` 경로에 쓰기 권한을 가져야 합니다.

```bash
chmod -R 755 /data/blogi/uploads
```

## 4) 업로드 동작 확인

- 이미지 업로드 후 반환된 URL(`/uploads/...`)이 정상 접근되는지 확인
- 서버 재시작 후에도 파일이 유지되는지 확인

## 4-1) 업로드 파일 클라이언트 동기화

클라이언트에서 서버 업로드 파일을 내려받아 동기화할 때는 아래 스크립트를 사용합니다.

- 스크립트: `scripts/sync-uploads.sh`
- 운영 서버 경로: `/data/blogi/uploads`
- 로컬 경로: `./uploads`

사용 방법:

```bash
./scripts/sync-uploads.sh --pull   # 서버에서 로컬로 다운로드
./scripts/sync-uploads.sh --push   # 로컬에서 서버로 업로드
```

`sshpass`가 설치되어 있으면 스크립트에 비밀번호를 입력한 뒤 비대화식으로 동기화할 수 있습니다.

### 업로드 경로 규칙

업로드 파일은 스코프와 날짜로 분류됩니다.

```
/uploads/{scope}/YYYY/MM/DD/{filename}
```

예:
```
/uploads/contents/2025/12/22/1700000000-abc123.jpg
/uploads/posts/2025/12/22/1700000000-xyz789.webp
```

## 5) 운영 체크리스트

- [ ] `/data/blogi/uploads` 디렉토리 생성 및 권한 확인 (`chmod 755`)
- [ ] `.env`에 `UPLOADS_DIR=/data/blogi/uploads` 설정
- [ ] `npm run build`
- [ ] `pm2 delete blogi && pm2 start ecosystem.config.cjs --update-env && pm2 save`
- [ ] 파일 업로드 테스트
- [ ] 업로드 후 `/data/blogi/uploads/`에 파일 저장 확인

## 6) Next.js 이미지 최적화 설정

운영 환경에서 `/_next/image` 엔드포인트가 `/uploads/` 이미지를 최적화할 수 있도록
`next.config.ts`에 `remotePatterns`를 설정해야 합니다.

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "your-domain.com",  // 실제 도메인으로 변경
        pathname: "/uploads/**",
      },
    ],
  },
};
```

설정 변경 후 반드시 `npm run build`로 재빌드해야 적용됩니다.

## 7) 파일 서빙 구조

Next.js가 모든 `/uploads/...` 요청을 직접 처리합니다.

- `app/uploads/[[...path]]/route.ts` - 파일 서빙 담당
- `UPLOADS_DIR` 환경변수 경로에서 파일을 읽어서 응답

---

## 8) 참고

- 개발/운영 모두 동일한 `UPLOADS_URL`(`/uploads`) 사용 가능
- 배포 방식: `next start`
