# 프로젝트 설치 및 운영 셋업

이 문서는 현재 프로젝트의 개발/운영 셋업에 필요한 최소 정보를 정리합니다.

## 1) 공통 환경 변수

필수 환경 변수는 다음과 같습니다.

- `DATABASE_URL`: PostgreSQL 연결 문자열
- `AUTH_SECRET`: NextAuth 시크릿 키
- `UPLOADS_DIR`: 업로드 파일 저장 경로
- `UPLOADS_URL`: 업로드 파일 접근 URL 프리픽스
- `SITE_URL`: 사이트 기본 URL (sitemap/RSS/OG용)

## 2) 개발 환경 (로컬)

### PostgreSQL 준비

로컬 PostgreSQL에서 아래 계정/DB를 사용합니다.

- 사용자: `danang_vip_user`
- 데이터베이스: `danang_vip`
- 포트: `5432`

예시 SQL:

```sql
CREATE ROLE danang_vip_user LOGIN PASSWORD '<PASSWORD>';
CREATE DATABASE danang_vip OWNER danang_vip_user;
```

### 기본 동작

개발 환경에서는 기본적으로 `public/uploads`에 파일이 저장됩니다.
`UPLOADS_DIR`와 `UPLOADS_URL`을 설정하지 않으면 아래 값이 사용됩니다.

- `UPLOADS_DIR=./public/uploads`
- `UPLOADS_URL=/uploads`

### 개발 서버 실행

```bash
npm install
npm run db:migrate
npm run dev
```

## 3) 운영 환경 (NFS 마운트 사용)

운영에서는 NFS로 마운트된 경로에 이미지를 저장하고,
Nginx에서 정적 서빙하도록 구성합니다.

### 운영 환경 변수 예시 (.env.production)

```env
DATABASE_URL="postgresql://danang_vip_user:<PASSWORD>@localhost:5432/danang_vip?schema=public"
AUTH_SECRET="<운영용 시크릿 키>"
UPLOADS_DIR="/mnt/storage1/data/danang_vip"
UPLOADS_URL="/uploads"
SITE_URL="https://example.com"
```

### Nginx 정적 서빙 설정

아래는 `/uploads/*` 경로를 NFS 마운트 경로로 매핑하는 예시입니다.

```nginx
location /uploads/ {
  alias /mnt/storage1/data/danang_vip/;
  access_log off;
  add_header Cache-Control "public, max-age=31536000, immutable";
}
```

### 디렉토리 권한

앱 서버가 `/mnt/storage1/data/danang_vip` 경로에 쓰기 권한을 가져야 합니다.

## 4) 업로드 동작 확인

- 이미지 업로드 후 반환된 URL(`/uploads/...`)이 정상 접근되는지 확인
- 서버 재시작 후에도 파일이 유지되는지 확인

## 4-1) 업로드 파일 클라이언트 동기화

클라이언트에서 서버 업로드 파일을 내려받아 동기화할 때는 아래 스크립트를 사용합니다.

- 스크립트: `scripts/sync-uploads.sh`
- 기본 경로: `/projects/danang-vip/public/uploads`
- 운영에서 `UPLOADS_DIR`를 사용 중이면 `REMOTE_UPLOADS_DIR`를 해당 경로로 변경

사용 방법:

```bash
./scripts/sync-uploads.sh
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

## 5) 운영 체크리스트 (NFS 업로드)

- NFS 마운트 경로가 부팅 시 자동 마운트되는지 확인 (`/etc/fstab`)
- `/mnt/storage1/data/danang_vip` 디렉토리 생성 및 쓰기 권한 확인
- 앱 프로세스가 해당 경로에 쓰기 가능한지 확인
- Nginx에서 `/uploads/` 정적 서빙 설정 적용 및 재시작
- 캐시 헤더가 정상 적용되는지 확인
- 파일 업로드 후 실제 파일이 NFS에 저장되는지 확인
- 백업/스냅샷 정책 설정

## 6) 참고

- 개발/운영 모두 동일한 `UPLOADS_URL`(`/uploads`)을 사용하도록 설계되어 있습니다.
- 실제 도메인이 생기면 CDN이나 프록시에서 동일 경로를 유지하면 됩니다.
