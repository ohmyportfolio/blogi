# Danang VIP

Next.js 커뮤니티 플랫폼

## Production URL

https://gc.lumejs.com

## Tech Stack

- **Framework**: Next.js 16.1.0
- **Database**: PostgreSQL 17 + Prisma ORM
- **Authentication**: NextAuth.js (Auth.js v5)
- **Styling**: Tailwind CSS
- **Editor**: Lexical Rich Text Editor
- **Process Manager**: PM2

---

## 환경 구분

| 환경 | 서버 | 포트 | URL |
|------|------|------|-----|
| **운영(Production)** | 103.167.151.104 | 3010 | https://gc.lumejs.com |
| **개발(Development)** | localhost | 3000 | http://localhost:3000 |

---

## 운영 환경 (Production)

### 현재 서버 정보

- **서버 IP**: 103.167.151.104
- **프로젝트 경로**: `/projects/danang-vip`
- **Node.js**: v22.17.0
- **PM2 앱 이름**: `danang-vip`
- **포트**: 3010

### 필수 환경변수 (.env)

```env
# Database
DATABASE_URL="postgresql://danang_vip_user:danang_vip@localhost:5432/danang_vip?schema=public"

# NextAuth (중요!)
AUTH_SECRET="your-secret-key"
AUTH_TRUST_HOST=true
AUTH_URL="https://gc.lumejs.com"

# Pexels API
PEXELS_API_KEY="your-pexels-api-key"
```

> **주의**: `AUTH_TRUST_HOST=true`와 `AUTH_URL`이 없으면 "UntrustedHost" 에러 발생!

### PM2 관리 명령어

```bash
# 상태 확인
pm2 list
pm2 show danang-vip

# 로그 확인
pm2 logs danang-vip
pm2 logs danang-vip --lines 50

# 재시작 (환경변수 변경 없을 때)
pm2 restart danang-vip

# 완전 재시작 (환경변수 변경 시 - 권장)
pm2 delete danang-vip && pm2 start ecosystem.config.cjs && pm2 save

# 저장 (서버 재부팅 시 자동 시작)
pm2 save
pm2 startup
```

### 배포 절차

```bash
# 1. 코드 풀
git pull

# 2. 의존성 설치 (package.json 변경 시)
npm install

# 3. Prisma 클라이언트 생성 (스키마 변경 시)
npx prisma generate

# 4. DB 마이그레이션 (스키마 변경 시)
npm run db:deploy

# 5. 빌드
npm run build

# 6. PM2 재시작
pm2 delete danang-vip && pm2 start ecosystem.config.cjs && pm2 save
```

### 자주 발생하는 문제

#### 1. AuthJS "UntrustedHost" 에러
```
[auth][error] UntrustedHost: Host must be trusted
```
**해결**: `.env`에 `AUTH_TRUST_HOST=true` 추가 후 재빌드 & PM2 재시작

#### 2. PM2 환경변수 미적용
**해결**: `pm2 restart`가 아닌 `pm2 delete && pm2 start ecosystem.config.cjs` 사용

#### 3. 빌드 후에도 변경 미적용
**원인**: Next.js는 빌드 시점에 환경변수를 읽음
**해결**: `.env` 변경 후 반드시 `npm run build` 재실행

---

## 개발 환경 (Development)

### 로컬 설정

```bash
# 의존성 설치
npm install

# Prisma 클라이언트 생성
npx prisma generate

# 개발 서버 실행
npm run dev
```

http://localhost:3000 에서 확인

### 개발용 환경변수 (.env)

```env
DATABASE_URL="postgresql://danang_vip_user:danang_vip@localhost:5432/danang_vip?schema=public"
AUTH_SECRET="dev-secret-key"
```

### DB 관련 명령어

```bash
# 마이그레이션 생성 (개발)
npm run db:migrate

# 마이그레이션 적용 (운영)
npm run db:deploy

# Prisma Studio (DB GUI)
npx prisma studio
```

---

## 프로젝트 구조

```
/projects/danang-vip
├── app/                    # Next.js App Router 페이지
│   ├── admin/              # 관리자 페이지
│   ├── api/                # API 라우트
│   ├── community/          # 커뮤니티 페이지
│   └── contents/           # 콘텐츠 페이지
├── components/             # React 컴포넌트
│   ├── admin/              # 관리자 컴포넌트
│   ├── layout/             # 레이아웃 컴포넌트
│   └── ui/                 # UI 컴포넌트
├── lib/                    # 유틸리티 함수
├── prisma/                 # DB 스키마 & 마이그레이션
├── public/                 # 정적 파일
├── actions/                # Server Actions
├── ecosystem.config.cjs    # PM2 설정 파일
└── .env                    # 환경변수 (gitignore)
```

---

## Nginx 설정

파일: `/etc/nginx/sites-available/gc.lumejs.com`

```nginx
server {
    listen 80;
    server_name gc.lumejs.com;

    location / {
        proxy_pass http://localhost:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

SSL 인증서:
```bash
sudo certbot --nginx -d gc.lumejs.com
```
