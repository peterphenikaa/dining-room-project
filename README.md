# Phòng ăn / Bàn ăn — Portfolio BE + Shop + PayOS

SPA React + multi-service Node (Dining / Auth / Payment) · MySQL · Redis · MinIO · Kafka · PayOS.

> Dự án dừng ở mức học + tối ưu correctness cơ bản. Không phải template clone để chạy production.

---

## Chạy nhanh (local)

```bash
docker compose up -d --build
docker compose exec auth npm run migration:run:auth
docker compose exec app npm run migration:run
docker compose exec payment npm run migration:run:payment

cd frontend && npm install && npm run dev
```

| | URL |
|--|-----|
| FE | http://localhost:5173 |
| Dining gateway | :3002 |
| Auth / Payment | :3003 / :3004 |
| Demo | `admin@demo.com` / `user@demo.com` · mk `demo` |

Env: `.env` + `.env.auth` / `.env.dining` / `.env.payment`.  
PayOS webhook local cần tunnel ngrok → Dining `:3002` path `/api/payments/payos/webhook`.

---

## Đã làm được & đã học

### 1. Multi-service + DB tách
- Process riêng: Dining (`app`), Auth, Payment, worker (BullMQ), kafka-consumer
- DB: `phongan_db` / `phongan_auth` / `phongan_payment`
- Dining BFF proxy: `/api/auth` `/api/users` → Auth · `/api/payments` → Payment
- Build tách `tsconfig` + `nodemon` theo service

**Học:** service boundary, JWT bridge không FK sang Auth DB, env theo container

### 2. Catalog + realtime
- Room / Table / Chair / Cabinet / Accessory · Zod · cursor pagination
- Ảnh MinIO + thumb (BullMQ + Sharp)
- Socket.IO auth cookie → room `dining` → `dining:changed`

**Học:** CRUD layered (route → controller → service), realtime UX ≠ source of truth

### 3. Auth
- Register / login · JWT access + refresh cookie · RBAC
- Google OAuth (PKCE + Redis state)
- Auth Kafka events (UserCreated / UserRoleChanged) — best-effort publish

**Học:** cookie auth SPA, RBAC, OAuth PKCE

### 4. Shop / inventory / order
- Giá + tồn · Cart · Checkout 1 TX: trừ kho + order `pending_payment` + xóa cart
- Hủy đơn: hoàn tồn + hủy payment pending
- Pessimistic lock + `adjustStock` atomic (`quantity >= need`)
- Ownership check hủy payment (non-admin chỉ hủy của mình)

**Học:** inventory reserve/restore, concurrency lock, authorization vs authentication

### 5. Payment + PayOS
- 1 order ↔ 1 payment (`orderId` unique)
- Tạo link: PayOS SDK `paymentRequests.create` → `checkoutUrl`
- Webhook verify chữ ký → payment `paid` → HTTP notify Dining `internal/mark-paid` → order `paid`
- Fallback: FE return URL `?status=PAID&orderCode=` → sync hỏi lại PayOS (không tin query URL)

**Học:** webhook vs sync fallback, secret nội bộ callback, SoT thanh toán ở Payment/PayOS không ở FE

### 6. Kafka + Transactional Outbox (Order)
- Checkout TX: insert `outbox_events` (`pending`) cùng order
- Relay poll 2s + `FOR UPDATE SKIP LOCKED` → producer → topic `dining.order.events`
- Consumer process riêng log notify (practice)

**Học:** best-effort vs outbox, broker ≠ nối thẳng producer→consumer, claim lock khi scale nhiều instance

### 7. Frontend
- Vite proxy `/api` + `/socket.io` → Dining
- Axios cookie + refresh single-flight
- Cart / Orders / PayOS checkout + return sync

---

## Stack

| | |
|--|--|
| BE | Express, TypeORM, MySQL 8, Zod, Socket.IO, BullMQ, KafkaJS, PayOS SDK |
| FE | React 19, TypeScript, Vite, Axios |
| Infra | Docker Compose, Redis, MinIO, Redpanda (Kafka API) |

---

## Còn nợ (nếu mở lại)

Xem `docs/roadmap-feature-portfolio.md` — P0 còn lại: harden webhook lock/amount, Payment→Dining notify durable, Auth outbox, secrets fail-fast, FE sync race…
