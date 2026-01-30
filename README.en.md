# Blogi

[Korean](README.md) | [English](README.en.md)

A no-code platform for building blog-style websites.

## Quick Start (Local)

### 1) PostgreSQL (Docker)

```bash
# If another container is already using port 5432, stop it first.
# Example: docker stop <container_name>

docker run -d \
  --name postgres-18 \
  -e POSTGRES_USER=blogi \
  -e POSTGRES_PASSWORD='blogi1234!' \
  -e POSTGRES_DB=blogi \
  -p 5432:5432 \
  -v postgres-18-data:/var/lib/postgresql \
  postgres:18
```

### 2) Environment variables

```bash
cp .env.example .env
```

### 3) Install and migrate

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

http://localhost:3010

---

## Tech Stack

- **Framework**: Next.js 16.1.0 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js (Auth.js v5)
- **Styling**: Tailwind CSS
- **Editor**: Lexical Rich Text Editor

---

## Environment Variables (Summary)

```env
DATABASE_URL="postgresql://blogi:blogi1234!@localhost:5432/blogi?schema=public"
AUTH_SECRET="change-me"
AUTH_TRUST_HOST=true
AUTH_URL="http://localhost:3010"
SITE_URL="http://localhost:3010"
UPLOADS_DIR="./uploads"
UPLOADS_URL="/uploads"
IMAGE_REMOTE_HOST="localhost"
```

---

## Deployment (PM2)

```bash
npm run build
pm2 delete blogi && pm2 start ecosystem.config.cjs --update-env
pm2 save
```

- `ecosystem.config.cjs` supports the `PM2_APP_NAME`, `PORT`, and `APP_CWD` environment variables.
- Deployment update script: `./update.sh`
- Management script: `./manage.sh start|stop|restart|log|status`

---

## Uploads

- Default storage path: `./uploads`
- URL prefix: `/uploads`

Next.js serves `/uploads/...` directly.

---

## Docs

- [Install/Operations Guide](docs/install.md)

---

## License

MIT
