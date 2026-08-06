# Quản lý Phòng ăn / Bàn ăn

API Express + TypeORM + MySQL · SPA React · Socket.IO · Redis/BullMQ · MinIO (S3) · **Payment (PayOS)**.

## Chạy nhanh

### Backend (Docker)

```bash
docker compose up -d --build

docker compose exec auth npm run migration:run:auth
docker compose exec app npm run migration:run
docker compose exec payment npm run migration:run:payment
```

### Frontend (local)

```bash
cd frontend
npm install
npm run dev
```

FE: http://localhost:5173 — Vite proxy `/api` + `/socket.io` → Dining `:3002`.  
Dining proxy: `/api/auth` `/api/users` → Auth `:3003` · `/api/payments` → Payment `:3004`.

| Service | URL |
|---------|-----|
| FE | http://localhost:5173 |
| Dining (gateway) | http://localhost:3002 |
| Auth | http://localhost:3003 |
| **Payment** | http://localhost:3004 |
| MinIO / Console | :9000 / :9001 |
| phpMyAdmin | http://localhost:8081 |

Demo: `admin@demo.com` / `user@demo.com` — mk `demo`.

> Windows path tiếng Việt: `$env:DOCKER_BUILDKIT=0; $env:COMPOSE_DOCKER_CLI_BUILD=0; docker compose up -d --build`

---

## Đã làm được (ngắn)

### Catalog & CRUD
- Room → Table / Cabinet · Table → Chair / Accessory · ảnh MinIO + thumb (BullMQ/Sharp)
- Routes → Controllers → Services · Zod · cursor pagination · Socket.IO

### Auth
- JWT + refresh cookie · RBAC · Auth service tách process/DB ([ADR](docs/adr/0001-auth-dining-boundary.md))

### Shop / giỏ / đơn
- Giá + tồn kho · Cart · Checkout → Order `pending_payment` · hủy hoàn tồn
- 1 order ↔ **1 payment** (`orderId` unique)

### Payment + PayOS
- Service `payment` (DB `phongan_payment`)
- Checkout: `POST /api/orders/:id/payos-checkout` → `checkoutUrl`
- Webhook: PayOS → `POST /api/payments/payos/webhook` → payment `paid` → Dining `POST /api/orders/internal/mark-paid` → order `paid`
- Fallback nếu webhook miss: `POST /api/orders/payos-sync` (theo `orderCode`) hoặc `/:id/payos-sync`
- Admin: Mark paid thủ công (test không cần PayOS)

Chi tiết: [docs/payos-ready.md](docs/payos-ready.md)

### Env
| File | Dùng cho |
|------|----------|
| `.env` | shared (db, redis, minio, jwt, cors) |
| `.env.auth` | Auth |
| `.env.dining` | Dining (+ `PAYMENT_CALLBACK_SECRET`) |
| **`.env.payment`** | PayOS keys, `PAYOS_RETURN_URL` / `CANCEL_URL` (= `http://localhost:5173/orders`), `DINING_INTERNAL_URL` |

Đổi `.env.payment` xong cần: `docker compose up -d --force-recreate payment`

### Webhook local (ngrok)
PayOS không gọi `localhost`. Tunnel **Dining :3002** (đã proxy `/api/payments`):

```bash
# Windows thường: ngrok http 3002
# Nếu ngrok.exe bị AV xóa: dùng WSL
wsl -e bash /mnt/c/ngrok/wsl-run-ngrok.sh
```

PayOS dashboard → webhook URL: `https://<tunnel>/api/payments/payos/webhook`

### Ops / khác
- Compose: `app`, `auth`, `payment`, `worker`, `kafka` (+ consumer), `db`, `redis`, `minio`, `phpmyadmin`
- Kafka Auth events: [docs/kafka-practice.md](docs/kafka-practice.md)
- Backlog tối ưu trước feature mới: [docs/optimization-backlog.md](docs/optimization-backlog.md)

---

## Stack

| Tầng | Công nghệ |
|------|-----------|
| BE | Node, Express, TypeORM, MySQL 8, Zod, Socket.IO, BullMQ, KafkaJS, PayOS SDK |
| FE | React 19, TypeScript, Vite, Axios, socket.io-client |
| Infra | Docker Compose, MinIO, Redis, Kafka |
