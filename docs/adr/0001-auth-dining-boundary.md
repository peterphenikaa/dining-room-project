# ADR 0001 — Auth / Dining service boundary (Phase 0)

- **Status:** Accepted
- **Date:** 2026-07-30
- **Phase:** 0 (documentation only — no runtime change)

## Context

Repo hiện là modular monolith (Express + TypeORM + MySQL). Auth (email/password, Google OAuth, profile, admin users) và Dining (rooms/tables/chairs/cabinets/accessories, MinIO, worker, socket) chạy chung process và chung DB.

Trước khi tách process (Phase 2+), team thống nhất **ai sở hữu data/API nào** và **contract identity** Dining được phép dùng.

## Decision

### 1. Auth sở hữu

**Data**

| Bảng / resource | Ghi chú |
|---|---|
| `users` | email, passwordHash (nullable), role |
| `auth_identities` | Google (và provider sau này): sub, profile fields |

**HTTP API** (prefix hiện tại)

| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký email/password |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/refresh` | Làm mới session |
| POST | `/api/auth/logout` | Xóa cookie |
| GET | `/api/auth/me` | User tối thiểu từ session |
| GET/PUT | `/api/auth/profile` | Hồ sơ + identities + đặt mật khẩu |
| DELETE | `/api/auth/profile/google` | Hủy liên kết Google |
| GET | `/api/auth/google` | Bắt đầu OAuth login |
| GET | `/api/auth/google/link` | Bắt đầu OAuth link (đã login) |
| GET | `/api/auth/google/callback` | OAuth callback |
| GET/PUT/DELETE | `/api/users`… | Admin CRUD users |

**Infra gắn Auth**

- Redis key `oauth:google:{state}` (PKCE verifier + optional `linkUserId`)
- JWT access/refresh secrets + cookie `access_token` / `refresh_token`
- Google OAuth client config (`GOOGLE_*`)

**Code map (Phase 1 — `src/modules/auth/`)**

- Routes: [`src/modules/auth/routes/authRoutes.ts`](../../src/modules/auth/routes/authRoutes.ts), [`userRoutes.ts`](../../src/modules/auth/routes/userRoutes.ts)
- Services: [`AuthService`](../../src/modules/auth/services/AuthService.ts), [`GoogleAuthService`](../../src/modules/auth/services/GoogleAuthService.ts), [`UserService`](../../src/modules/auth/services/UserService.ts)
- Entity: [`User`](../../src/modules/auth/entity/User.ts), [`AuthIdentity`](../../src/modules/auth/entity/AuthIdentity.ts)
- OAuth: [`oauth/googleOAuthPending.ts`](../../src/modules/auth/oauth/googleOAuthPending.ts), [`utils/pkce.ts`](../../src/modules/auth/utils/pkce.ts), [`utils/jwt.ts`](../../src/modules/auth/utils/jwt.ts), [`utils/authCookie.ts`](../../src/modules/auth/utils/authCookie.ts)
- Types (không phụ thuộc entity): [`types.ts`](../../src/modules/auth/types.ts) — `UserRole`, `AuthUser`, `AuthRequest`
- Dining chỉ import từ barrel [`src/modules/auth/index.ts`](../../src/modules/auth/index.ts): `authenticate`, `authorize`, `AuthRequest`, `AuthUser`, `ACCESS_COOKIE`, `verifyAccessToken`

### 2. Dining sở hữu

**Data**

- `dining_rooms`, `dining_tables`, `dining_chairs`, `dining_cabinets`, `dining_accessories` (và bảng/migration liên quan ảnh nếu có)

**HTTP API**

| Prefix | Quyền |
|---|---|
| `/api/rooms` | authenticate; write = admin |
| `/api/tables` | authenticate; write = admin |
| `/api/chairs` | authenticate; write = admin |
| `/api/cabinets` | authenticate; write = admin |
| `/api/accessories` | authenticate; write = admin |

**Infra gắn Dining**

- MinIO / S3 upload + public URL
- Image worker / queue (Redis job nếu có)
- Socket.IO realtime dining events

**Identity Dining được dùng**

Chỉ từ JWT đã verify → `req.user` / `socket.data.user`. **Không** `JOIN users`, **không** `getRepository(User)`, **không** gọi `UserService` / `AuthService` / `GoogleAuthService`.

Dining controllers hiện chỉ lấy `req.user!.id` và `req.user!.email` cho audit actor — đúng contract dưới đây.

### 3. JWT contract (ổn định — không đổi Phase 0)

Nguồn: [`src/modules/auth/types.ts`](../../src/modules/auth/types.ts), [`src/modules/auth/utils/jwt.ts`](../../src/modules/auth/utils/jwt.ts).

**Access token payload (claims Dining được tin)**

```ts
{
  id: string;      // user UUID
  email: string;
  role: "admin" | "user";
  type: "access";  // nội bộ verify; Dining chỉ cần id/email/role sau verify
}
```

Sau `verifyAccessToken`, object đưa vào request:

```ts
type AuthUser = {
  id: string;
  email: string;
  role: "admin" | "user";
};
```

**Refresh token**

```ts
{ id: string; type: "refresh" }
```

Chỉ Auth dùng để cấp access mới. Dining **không** verify refresh.

**Transport (giữ nguyên)**

- Cookie httpOnly: `access_token`, `refresh_token` (SameSite=Lax)
- Hoặc `Authorization: Bearer <access>` (middleware đã hỗ trợ)

**Role**

- `admin` — CRUD dining + `/api/users`
- `user` — đọc dining (và profile của mình qua Auth)

### 4. Giao tiếp Phase 2–3 (đã triển khai)

- Browser → Dining `:3002` → proxy `/api/auth`, `/api/users` → Auth `:3003` (timeout + health)
- Dining verify JWT qua [`src/security/`](../../src/security/); **không** import `modules/auth`
- Image Dining (`Dockerfile.dining`) xóa `src/modules/auth` — không còn Google OAuth
- Env: `.env` shared · `.env.auth` · `.env.dining`
- DB: `phongan_db` · `phongan_auth`

### 5. Phase 0 lịch sử

Phase 0 chỉ chốt ADR; Phase 1–2 đã tách module + process.

## Consequences

- Phase 1 (modular folder) move đúng danh sách Auth ở trên; Dining chỉ còn phụ thuộc middleware + `AuthUser`
- Phase 2 tách process: proxy `/api/auth` và `/api/users` sang auth-service; dining DB không còn bảng `users` / `auth_identities`
- Mọi thay đổi JWT claims (thêm field) phải cập nhật ADR này và cả Auth + Dining verify

## Done criteria (Phase 0)

- [x] Auth sở hữu data + API liệt kê rõ
- [x] Dining sở hữu data + API liệt kê rõ; identity chỉ từ JWT
- [x] Contract `AuthUser = { id, email, role }` khớp code hiện tại
- [x] ADR này được accept trong repo tại `docs/adr/0001-auth-dining-boundary.md`
