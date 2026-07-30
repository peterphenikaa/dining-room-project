# Quản lý Phòng ăn / Bàn ăn

API Express + TypeORM + MySQL · SPA React · Socket.IO · Redis/BullMQ · MinIO (S3).

## Chạy nhanh

### Backend (Docker)

```bash
docker compose up -d --build

docker compose exec auth npm run migration:run:auth
docker compose exec app npm run migration:run

# Kiểm tra image Dining không có Google OAuth
docker compose build app
npm run verify:dining-image
```

### Frontend (local)

```bash
cd frontend
npm install
npm run dev
```

FE: http://localhost:5173 (Vite proxy `/api` + `/socket.io` → Dining API :3002)  
Dining proxy `/api/auth` + `/api/users` → Auth service :3003. **FE không đổi URL.**

| Service | URL |
|---------|-----|
| FE (local Vite) | http://localhost:5173 |
| Dining API (gateway) | http://localhost:3002 |
| Auth service | http://localhost:3003 |
| MinIO API / Console | http://localhost:9000 / http://localhost:9001 |
| phpMyAdmin | http://localhost:8081 |
| Redis | localhost:6379 |

Demo: `admin@demo.com` / `user@demo.com` — mật khẩu `demo`.  
MinIO: `minioadmin` / `minioadmin`.

> Nếu `docker compose build` lỗi ASCII trên Windows (path tiếng Việt):  
> `$env:DOCKER_BUILDKIT=0; $env:COMPOSE_DOCKER_CLI_BUILD=0; docker compose up -d --build`

---

## Ảnh + MinIO + BullMQ

- Mỗi row (room/table/cabinet/chair/accessory): `imageUrl` / `imageKey` + `imageThumbUrl` / `imageThumbKey`
- Upload: `POST /api/{rooms|tables|...}/:id/image` (multipart field `image`) → lưu gốc lên MinIO (AWS S3 SDK) → enqueue job `process-image`
- Worker (`dining_worker`): Sharp resize → WebP thumb → cập nhật DB
- Xóa ảnh: `DELETE /api/.../:id/image`
---

## Đã làm được

### Domain & CRUD
- 5 entity: **Room → Table / Cabinet**, **Table → Chair / Accessory** (FK + CASCADE)
- CRUD + ảnh; cột `quantity` (≥ 1) trên Table / Cabinet / Chair / Accessory
- Tầng **Routes → Controllers → Services**; envelope `{ status, message, data }`

### Auth & phân quyền
- JWT access + refresh httpOnly cookie; RBAC admin ghi / user đọc

### Validation / Pagination / Realtime
- Zod · cursor pagination · Socket.IO `dining:changed`

### Ops
- Docker Compose: `app`, `worker`, `db`, `redis`, `minio`, `phpmyadmin` · FE chạy local (`npm run dev`)

---

## Stack

| Tầng | Công nghệ |
|------|-----------|
| BE | Node, Express 5, TypeORM, MySQL 8, Zod, Socket.IO, BullMQ, ioredis, Multer, Sharp, AWS S3 SDK |
| FE | React 19, TypeScript, Vite, Axios, socket.io-client |
| Storage / Queue | MinIO (S3), Redis |

---

## Architecture notes

- **Phase 0:** [docs/adr/0001-auth-dining-boundary.md](docs/adr/0001-auth-dining-boundary.md)
- **Phase 1–2:** Auth module + process `auth:3003` / DB `phongan_auth`; Dining proxy `/api/auth` + `/api/users`
- **Phase 3:** Dining chỉ dùng [`src/security/`](src/security/) (JWT verify). Image Dining (`Dockerfile.dining`) **không** chứa `src/modules/auth` / Google OAuth.
- Env: [`.env`](.env) shared · [`.env.auth`](.env.auth) · [`.env.dining`](.env.dining)
