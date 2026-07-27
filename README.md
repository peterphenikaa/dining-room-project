# Quản lý Phòng ăn / Bàn ăn

API Express + TypeORM + MySQL (Docker) · SPA React (Vite) · Socket.IO realtime.

## Chạy nhanh

```bash
# Backend (API :3002, MySQL, phpMyAdmin :8081)
docker compose up -d

# Frontend (:5173)
cd frontend
npm install
npm run dev
```

Demo: `admin@demo.com` / `user@demo.com` — mật khẩu `demo`.

---

## Đã làm được

### Domain & CRUD
- 5 entity: **Room → Table / Cabinet**, **Table → Chair / Accessory** (FK + CASCADE)
- CRUD đầy đủ; cột `quantity` (≥ 1) trên Table / Cabinet / Chair / Accessory
- Tầng **Routes → Controllers → Services**; envelope `{ status, message, data }`
- Error tập trung: `AppError` + `errorHandler`

### Auth & phân quyền
- JWT **access + refresh** trong cookie httpOnly
- Register / Login / Me / Logout / Refresh
- **RBAC**: `admin` ghi (POST/PUT/DELETE); user đã login chỉ đọc (GET)
- FE ẩn nút ghi theo role (`useCanWrite`); BE vẫn chặn thật

### Validation
- **Zod** cho Auth (login / register + `.refine` confirmPassword)
- **Zod** cho body/params dining (create/update 5 entity + UUID `id`)
- ZodError → HTTP 400 trong `errorHandler`

### Phân trang
- GET list **cursor-based** (`cursor`, `limit`) → `{ items, nextCursor, hasMore }`
- FE: 5 rows/trang, nút **Trước / Sau**

### Realtime
- **Socket.IO** (cùng port API): auth cookie JWT, room `dining`
- Sau create / update / delete → broadcast `dining:changed` → banner FE

### Frontend
- Login / Register, layout AppShell, CRUD 5 màn
- Axios `withCredentials` + refresh khi 401

---

## Stack

| Tầng | Công nghệ |
|------|-----------|
| BE | Node, Express 5, TypeORM, MySQL 8, Zod, Socket.IO, JWT, bcrypt |
| FE | React 19, TypeScript, Vite, React Router, Axios, socket.io-client |
| Ops | Docker Compose (app + MySQL + phpMyAdmin) |
