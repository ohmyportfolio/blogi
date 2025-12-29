# Danang VIP

Next.js 커뮤니티 플랫폼

## Production URL

https://gc.lumejs.com

## Tech Stack

- **Framework**: Next.js 16.1.0
- **Database**: PostgreSQL 17 + Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Editor**: Lexical Rich Text Editor

## Development Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Production Deployment

### 1. Prerequisites

- Node.js 22+
- PostgreSQL 17
- Nginx
- PM2
- Certbot

### 2. Database Setup

```bash
# Create PostgreSQL user and database
sudo -u postgres psql -c "CREATE USER danang_vip_user WITH PASSWORD 'danang_vip';"
sudo -u postgres psql -c "CREATE DATABASE danang_vip OWNER danang_vip_user;"
```

### 3. Environment Configuration

Create `.env` file:

```env
DATABASE_URL="postgresql://danang_vip_user:danang_vip@localhost:5432/danang_vip?schema=public"
AUTH_SECRET="your-secret-key"
```

### 4. Build & Deploy

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npm run db:deploy

# Build production bundle
npm run build

# Start with PM2
pm2 start npm --name "danang-vip" -- start -- -p 3010
pm2 save
```

### 5. Nginx Configuration

Create `/etc/nginx/sites-available/gc.lumejs.com`:

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

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/gc.lumejs.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL Certificate

```bash
sudo certbot --nginx -d gc.lumejs.com
```

## Useful Commands

```bash
# View PM2 logs
pm2 logs danang-vip

# Restart application
pm2 restart danang-vip

# Database migration (development)
npm run db:migrate

# Database migration (production)
npm run db:deploy
```

## Project Structure

```
/projects/danang-vip
├── app/                 # Next.js App Router pages
├── components/          # React components
├── lib/                 # Utility functions
├── prisma/              # Database schema & migrations
├── public/              # Static files
└── actions/             # Server actions
```
