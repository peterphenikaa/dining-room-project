# Backlog tối ưu trước feature mới

Tài liệu này ghi **cần tối ưu gì** và **vì sao**, để làm dần theo ưu tiên.  
**Không cần rewrite** toàn project — giữ kiến trúc hiện tại, siết correctness / security / DX.

> Chọn batch khi code:
> - **A** — P0 nhanh (ownership, webhook lock, FE race, dead code, docs)
> - **B** — P0 nặng (Payment→Dining outbox, Auth outbox)
> - **C** — A rồi B

---

## Đã ổn — giữ nguyên

| Khả năng | Vì sao giữ |
|----------|------------|
| Multi-service Auth / Payment / Dining + DB tách | Boundary rõ, portfolio mid |
| BFF proxy `/api/auth`, `/api/users`, `/api/payments` | Browser một origin; cookie/JWT forward sạch |
| Checkout pessimistic lock + `adjustStock` | Chống oversell cơ bản |
| Outbox `OrderCreated` + relay `FOR UPDATE SKIP LOCKED` | Publish at-least-once đúng pattern |
| JWT cookie + PayOS webhook + FE sync fallback | Happy path + cứu khi ngrok miss |
| FE Axios `withCredentials` + refresh single-flight | Auth SPA chuẩn |

---

## P0 — Làm trước (đúng / an toàn)

### 1. Payment → Dining notify còn best-effort HTTP

- **Chỗ:** `src/modules/payment/payos/notifyDining.ts`, `PaymentService.handlePayosWebhookPaid`
- **Vấn đề:** `fetch` fail chỉ `console.warn`. Payment đã `paid`, Dining vẫn `pending_payment` (split-brain).
- **Vì sao tối ưu:** Money/order phải recover được khi Dining tạm down — không phụ thuộc user bấm sync.
- **Hướng:** Outbox/retry phía Payment (hoặc queue + reconcile job) gọi lại `internal/mark-paid`.

### 2. Webhook / markPaid: lock + amount + idempotent

- **Chỗ:** `src/modules/payment/services/PaymentService.ts`
- **Vấn đề:** Không `pessimistic_write`; amount mismatch chỉ warn rồi vẫn mark paid; webhook + sync song song có thể double-notify.
- **Vì sao:** Concurrent PayOS callback / FE sync là failure mode thật.
- **Hướng:** TX + lock row; amount lệch → reject; đã `paid` → return idempotent.

### 3. `cancelByOrder` thiếu ownership

- **Chỗ:** `PaymentController.cancelByOrder`, `paymentRoutes.ts`
- **Vấn đề:** GET/checkout check `userId`; cancel thì không → user A hủy payment của B.
- **Vì sao:** Lỗ hổng bảo mật rõ, sửa nhanh.
- **Hướng:** Giống các API khác: non-admin phải `payment.userId === req.user.id`.

### 4. Auth Kafka vẫn fire-and-forget

- **Chỗ:** `authEventPublisher.ts`, Auth/Google/UserService
- **Vấn đề:** Dining đã outbox + `eventId`; Auth publish fail chỉ warn, không `eventId`.
- **Vì sao:** Story messaging không nhất quán khi interview / đọc code.
- **Hướng:** Outbox Auth (bảng riêng DB auth) hoặc ít nhất `eventId` + retry tối thiểu.

### 5. Secrets default cứng

- **Chỗ:** `src/security/jwt.ts`, `config/env.ts` (`PAYMENT_CALLBACK_SECRET`…)
- **Vấn đề:** Thiếu env vẫn boot với `dev-secret-change-me` / secret callback đoán được.
- **Vì sao:** Production footgun.
- **Hướng:** `NODE_ENV=production` → thiếu secret thì throw (fail-fast).

### 6. `createPending` race

- **Chỗ:** `PaymentService.createPending`
- **Vấn đề:** Check-then-insert; unique `orderId` có nhưng không catch duplicate → parallel create 500.
- **Vì sao:** Retry checkout / double-click cần idempotent.
- **Hướng:** Catch unique violation → `findOne` trả existing (như `CartService.getOrCreate`).

### 7. OrdersPage: sync PayOS race với `load()`

- **Chỗ:** `frontend/src/pages/OrdersPage.tsx`
- **Vấn đề:** Mount `load()` song song sync `?status=PAID&orderCode=`; `load` chậm có thể ghi đè list sau khi đã paid.
- **Vì sao:** UX “đã trả tiền mà UI vẫn chờ”.
- **Hướng:** Có return URL thì sync **trước** load (hoặc abort load khi sync đang chạy).

### 8. Docs lệch code (outbox)

- **Chỗ:** `docs/kafka-practice.md`, `docs/roadmap-feature-portfolio.md` baseline Messaging
- **Vấn đề:** Docs còn nói publish best-effort; code Order đã transactional outbox + relay.
- **Vì sao:** Onboarding / portfolio narrative sai.
- **Hướng:** Cập nhật: Order outbox **đã có**; Auth Kafka + Payment notify **vẫn** best-effort.

---

## P1 — ROI cao (sau P0)

| # | Việc | Vì sao |
|---|------|--------|
| 1 | Tách outbox relay khỏi Dining API → worker/process riêng | Scale API không nhân đôi poller; tách trách nhiệm |
| 2 | Consumer dedup theo `eventId` (+ DLQ tối thiểu) | Kafka at-least-once → tránh double notify |
| 3 | Event `OrderPaid` / `OrderCancelled` | Trail money/order, không chỉ `OrderCreated` |
| 4 | Cancel order ↔ cancel payment đồng bộ | Dining cancelled mà payment/PayOS link còn sống |
| 5 | Orders pagination (`CursorPager`) | Hiện limit nhỏ, trang 1 “mất” đơn cũ |
| 6 | FE: 401 sau refresh fail → clear session / redirect login | Tránh UI “còn login” giả |
| 7 | Xóa dead code (`publishOrderEvent` deprecated, FE helpers không dùng) | Giảm nhiễu |
| 8 | `.env.example` + script `dev` / `typecheck`; bỏ `pg` unused | DX / onboarding |
| 9 | Rate-limit login / webhook (nhẹ) + secret fail-fast | Bảo vệ bề mặt tấn |

---

## P2 — Polish (sau P0/P1)

| # | Việc | Vì sao |
|---|------|--------|
| 1 | Generic CRUD catalog (BE service / FE pages) | Giảm copy-paste trước search/wishlist |
| 2 | Order state machine rõ (`pending_payment` → `paid` / `cancelled`…) | Tránh if-else rải controller |
| 3 | Tests: oversell checkout, webhook duplicate, notify Dining down | Evidence correctness |
| 4 | Docker multi-stage production (bind-mount hiện che strip Dockerfile) | Image boundary thật khi deploy |

---

## Không tối ưu ngay (đúng roadmap, sai thời điểm)

- OpenSearch / flash sale / voucher / recommendation  

Làm trước khi **correctness foundation** (P0–P1) ổn sẽ khó demo failure mode và dễ technical debt.

---

## Gợi ý thứ tự làm dần

```
Tuần 1 (Batch A — nhanh)
  ├─ 3 cancel ownership
  ├─ 2 webhook lock + amount reject
  ├─ 6 createPending race
  ├─ 5 secrets fail-fast (prod)
  ├─ 7 OrdersPage sync race
  ├─ 8 docs outbox
  └─ dead code nhỏ

Tuần 2–3 (Batch B — nặng)
  ├─ 1 Payment→Dining outbox/retry
  └─ 4 Auth outbox (+ eventId)

Sau đó (P1)
  ├─ relay → worker
  ├─ consumer dedup
  ├─ OrderPaid/Cancelled
  ├─ cancel đồng bộ + Orders pager + FE 401
  └─ .env.example / scripts

P2 + tests khi ổn định
```

---

## Checklist tự theo dõi

- [ ] P0.3 Cancel payment ownership  
- [ ] P0.2 Webhook lock + amount + idempotent  
- [ ] P0.6 createPending idempotent  
- [ ] P0.5 Secrets fail-fast production  
- [ ] P0.7 OrdersPage sync trước load  
- [ ] P0.8 Docs kafka/outbox/roadmap  
- [ ] P0.1 Payment→Dining reliable notify  
- [ ] P0.4 Auth outbox  
- [ ] P1 items…  
- [ ] P2 items…  

---

## Liên quan

- Roadmap pattern lớn: `docs/roadmap-feature-portfolio.md`
- Kafka / outbox hiện tại: `docs/kafka-practice.md`
- PayOS: `docs/payos-ready.md`
- Boundary Auth–Dining: `docs/adr/0001-auth-dining-boundary.md`
