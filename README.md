# Blogi

노코드 블로그형 웹사이트 제작도구 플랫폼.

## Quick Start (Local)

### 1) PostgreSQL (Docker)

```bash
# 기존 5432 포트를 사용하는 컨테이너가 있으면 먼저 중지
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

### 2) 환경 변수

```bash
cp .env.example .env
```

### 3) 설치 및 마이그레이션

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

http://localhost:3000

---

## Tech Stack

- **Framework**: Next.js 16.1.0 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js (Auth.js v5)
- **Styling**: Tailwind CSS
- **Editor**: Lexical Rich Text Editor

---

## 환경 변수 요약

```env
DATABASE_URL="postgresql://blogi:blogi1234!@localhost:5432/blogi?schema=public"
AUTH_SECRET="change-me"
AUTH_TRUST_HOST=true
AUTH_URL="http://localhost:3000"
SITE_URL="http://localhost:3000"
UPLOADS_DIR="./uploads"
UPLOADS_URL="/uploads"
IMAGE_REMOTE_HOST="localhost"
```

---

## 배포 (PM2)

```bash
npm run build
pm2 delete blogi && pm2 start ecosystem.config.cjs --update-env
pm2 save
```

- `ecosystem.config.cjs`는 `PM2_APP_NAME`, `PORT`, `APP_CWD` 환경변수를 지원합니다.
- 배포 업데이트 스크립트: `./update.sh`
- 관리 스크립트: `./manage.sh start|stop|restart|log|status`

---

## 업로드

- 기본 저장 경로: `./uploads`
- URL 프리픽스: `/uploads`

Next.js가 `/uploads/...` 요청을 직접 처리합니다.

---

## 문서

- [설치/운영 가이드](docs/install.md)
