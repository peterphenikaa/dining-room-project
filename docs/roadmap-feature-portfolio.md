# Roadmap phát triển — Phòng ăn / Bàn ăn (Mid → Senior)

Tài liệu nâng cấp project theo hướng **portfolio backend mid–senior**: không đếm feature, mà chứng minh design trade-off, consistency boundaries, failure modes và production habits.

> Mục tiêu: ~8–10 capability sâu. Mỗi cái phải trả lời được: *source of truth ở đâu, failure mode là gì, retry/idempotency thế nào, quan sát được ra sao, rebuild/reindex được không?*

Senior signal không phải “có OpenSearch + Kafka”, mà là **biết khi nào dùng, khi nào không, và hệ thống vẫn đúng khi message trùng / service chết / clock lệch**.

---

## 1. Hiện trạng (baseline) & khoảng cách mid–senior

| Lớp | Đã có | Khoảng trống mid–senior |
|-----|--------|-------------------------|
| Catalog | Multi-type (`table`/`chair`/`cabinet`/`accessory`) · cursor pagination | Search projection tách biệt · identity ổn định · reindex zero-downtime |
| Shop | Cart · checkout · inventory lock cơ bản | Pricing pipeline · voucher reserve/commit · flash concurrency |
| Order | `pending_payment` → `paid`/`cancelled`/`fulfilled` | Explicit state machine · audit · saga refund với Payment |
| Auth | JWT · RBAC · service tách DB | Token revoke / session model · rate limit · audit admin |
| Payment | PayOS webhook · sync fallback | Idempotent webhook · outbox notify Dining · saga refund |
| Messaging | Kafka publish best-effort (`warn` nếu fail) | Transactional outbox · consumer idempotency · DLQ · schema/versioning |
| Realtime | Socket.IO auth | Room model · fan-out scale · reconnect/replay unread |
| Jobs | BullMQ ảnh | Delayed/cron · poison message · observability job |

**Catalog identity (bắt buộc thống nhất sớm):**

```
ProductRef = { productType, productId }
DocumentId / EventKey = `${productType}:${productId}`
```

Mọi search / wishlist / review / recommendation / price-drop đều dùng chung contract này. Đây là quyết định architecture, không phải tiện ích.

**Order status hiện tại → chưa đủ cho fulfillment / money movement:**

```
pending_payment ──► paid ──► fulfilled
       │
       └──► cancelled
```

---

## 2. Bar mid–senior: nhà tuyển dụng nhìn gì?

| Signal | Thể hiện qua |
|--------|----------------|
| Consistency boundaries | MySQL SoT · OpenSearch/Redis projection · rebuild path |
| Exactly-once *effect* | Idempotency keys · consumer dedup table · webhook dedup |
| Cross-service correctness | Outbox · Saga (Dining ↔ Payment) · compensation |
| Concurrency under load | Flash stock Lua · voucher reserve · pessimistic/optimistic lock có lý do |
| Domain modeling | Order SM · Pricing engine (promo stack) · không if-else rải controller |
| Operability | Structured log + trace id · metrics · DLQ · runbook ngắn |
| Evolution | Event versioning · index alias · ADR cho quyết định lớn |
| Evidence | Load test flash/checkout · chaos “kill consumer” · demo failure path |

Feature list chỉ là **vehicle**. Pattern + failure handling mới là bar.

---

## 3. Roadmap theo phase (pattern-first)

Mid–senior: **đưa correctness patterns vào sớm**, không để “Phase 4 trang trí”.

```
HIỆN TẠI
│  Multi-service shop + PayOS + Kafka best-effort + Socket + BullMQ
│
▼
PHASE 2 — Correctness foundation + commerce core
│  Transactional Outbox (+ relay)
│  Idempotency (HTTP + webhook + consumers)
│  Order State Machine + audit trail
│  OpenSearch (CDC/outbox sync, alias reindex)
│  Pricing: Promotion Engine + Voucher (reserve/commit)
│  Notification (at-least-once, dedup, DLQ)
│
▼
PHASE 3 — High-contention + engagement projections
│  Flash Sale (Redis atomic + reconcile MySQL)
│  Wishlist + price-drop pipeline
│  Recently Viewed (ZSET) + PRODUCT_VIEWED events
│  Review/Rating (moderation + aggregate projection)
│  Recommendation (co-view / co-purchase graphs)
│  Analytics read-model (CQRS nhẹ) + cache
│
▼
PHASE 4 — Hardening & senior polish
│  Saga refund/cancel end-to-end
│  Distributed lock / leader election cho cron
│  Rate limiting · circuit breaker (search/payment)
│  Observability (OTel) · SLO dashboards
│  Load + chaos tests · Audit log hoàn chỉnh
│  Schema registry / event versioning discipline
```

**Capability ưu tiên (làm sâu, không làm nông):**

1. Outbox + Idempotency (nền — không optional)  
2. Order State Machine + Saga với Payment  
3. OpenSearch (sync đúng + reindex)  
4. Promotion + Voucher + Flash (pricing + contention)  
5. Notification (reliable delivery)  
6. Review aggregate + Wishlist event wiring  
7. Recommendation projection  
8. Analytics CQRS  
9. Observability + load evidence  

Recently Viewed: làm sớm như **event source** cho recommendation, không chỉ UI.

---

## 4. Chi tiết capability (bar mid–senior)

### 4.1 Transactional Outbox + Idempotency (làm trước / song song feature)

Kafka hiện publish fire-and-forget → mid-senior **không chấp nhận** làm nền cho money/order.

**Outbox**

```
TX {
  update Order
  insert outbox_events (payload, type, aggregate_id, created_at)
}
→ Relay (poll / CDC) → Kafka
→ mark published / retry / DLQ
```

**Idempotency layers**

| Layer | Mechanism |
|-------|-----------|
| HTTP write | `Idempotency-Key` + stored response (checkout, apply voucher, pay) |
| PayOS webhook | dedup theo `paymentLinkId` / `orderCode` + unique constraint |
| Kafka consumer | `(topic, partition, offset)` hoặc `eventId` unique |
| BullMQ | jobId ổn định · removeOnFail có kiểm soát |

**Definition of done:** kill app giữa TX và publish → event vẫn ra; replay consumer → không double-charge / double-notify.

ADR ngắn: tại sao outbox thay vì “publish sau commit + chấp nhận mất event”.

---

### 4.2 Advanced Search (OpenSearch)

**Vấn đề:** MySQL + cursor pagination đủ list; không đủ discovery (fuzzy, facets, ranking).

```
          ┌── MySQL (write SoT)
Product ──┤
          └── OpenSearch (read model)
                 ↑ sync qua Outbox/Kafka ProductChanged
```

**Product requirements (không chỉ “có search”)**

| Capability | Mid–senior expectation |
|------------|------------------------|
| Full text / fuzzy / prefix / highlight | Analyzer phù hợp VI (custom hoặc plugin); document rõ limitation |
| Filter + sort + facets | Aggregation đúng với multi-type catalog |
| Sync lag | Metric `search_lag_ms`; UI/API có thể stale-read consciously |
| Reindex | Index alias + blue/green reindex zero-downtime |
| Backfill | Job có checkpoint, resume được |
| Failure | OpenSearch down → degrade (list MySQL / 503 có circuit breaker), không làm chết write path |
| Relevance | Boost `inStock`, `soldCount`, exact name; A/B hoặc ít nhất config trọng số |

**API**

```http
GET /api/products/search?q=bàn+ăn&type=table&minPrice=...&sort=relevance
```

Document id: `table:{uuid}` … Mapping versioned (`v1`, `v2`).

**Không làm kiểu junior:** sync đồng bộ trong request HTTP create product.  
**Làm:** write MySQL → outbox → indexer consumer · write path độc lập search.

---

### 4.3 Pricing: Promotion Engine

Pricing là **domain service thuần**, không if trong controller.

```
Promotion rules
├── percentage / fixed
├── buy X get Y / bundle
├── category / product / user-segment
├── schedule window
├── priority + stacking policy (exclusive vs stackable)
└── flash sale (inventory bucket riêng)
```

**Mid–senior extras**

- **Evaluation order** documented (priority, exclusive group).  
- **Deterministic quote:** cùng cart input → cùng `PricingResult` (testable).  
- **Snapshot:** `OrderItem` lưu `listPrice`, `finalPrice`, `appliedPromotionIds[]`, `voucherCode`.  
- **Clock:** dùng server time / injected clock; không tin FE.  
- Conflict: hai flash cùng SKU → rule thắng rõ ràng hoặc reject config lúc admin save.

Flash Sale:

```
Redis DECR atomic (promo stock)
  + order line reserve
  → reconcile / commit khi paid
  → BullMQ đóng cửa sổ promo
  → Socket.IO stock tick (best-effort UX, không phải SoT)
```

Stock Socket chỉ là UX; **SoT vẫn MySQL/Redis policy bạn chọn** — ghi rõ trong ADR (Redis inventory vs MySQL + Redis cache).

---

### 4.4 Voucher System (reserve → commit → release)

Rules: type, min order, max discount, window, global/per-user limits, scope product/category/user.

**Concurrency model (bắt buộc có)**

```
checkout: RESERVE voucher usage (TTL)
paid:     COMMIT usage
cancel/expire: RELEASE
```

Không “INCR lúc apply preview” rồi quên rollback.

**Techniques**

- Redis Lua: check limit + reserve atomic.  
- MySQL: unique `(voucherId, userId, orderId)` / usage row + TX.  
- Dual-check: Redis tốc độ · DB authoritative lúc commit.  
- Load test: N user / 1 remaining redemption → exactly one winner.

Idempotency: cùng key checkout không double-reserve.

---

### 4.5 Notification Center (reliable, không chỉ Socket push)

```
Domain event (outbox)
  → Kafka
  → Notification consumer (idempotent by eventId)
  → Persist notification row
  → Update Redis unread
  → Socket emit (optional)
  → (optional) email/push adapter
```

**Senior touches**

- At-least-once + **dedup** → user không thấy 5 “Order paid”.  
- Preference / category mute.  
- Offline: reconnect → `GET /notifications?after=cursor` (replay), không chỉ dựa Socket.  
- DLQ + admin replay.  
- Fan-out sau này (segment promo) qua BullMQ chunks, không block consumer.

API: list cursor · mark read · read-all (atomic unread reset).

---

### 4.6 Order State Machine + cross-service Saga

**Target graph (ví dụ):**

```
PENDING_PAYMENT → PAID → CONFIRMED → PROCESSING → SHIPPING → DELIVERED → COMPLETED
       │              └→ REFUNDING → REFUNDED
       └→ CANCELLED
SHIPPING/DELIVERED → RETURN_REQUESTED → …
```

```ts
orderStateMachine.transition(order, OrderEvent.SHIP_ORDER, ctx)
// validate · persist status + outbox · audit row
```

**Mỗi transition**

1. Guard (ai được phép: user/admin/system)  
2. Persist state + version (optimistic locking)  
3. Outbox domain event  
4. Audit (`from`, `to`, `actor`, `reason`, `correlationId`)

**Saga: Refund / Cancel sau paid**

```
Dining: mark REFUNDING
  → command/event Payment.refund
  → Payment: PayOS refund / record
  → Dining: REFUNDED + restock + voucher release
Compensation nếu Payment fail: quay trạng thái + alert
```

Không “controller set status = refunded” khi chưa có xác nhận Payment.

Realtime: emit sau commit; client subscribe `user:{id}` / `order:{id}`.

---

### 4.7 Wishlist (projection + reaction)

CRUD là baseline. Mid–senior nhấn **reaction pipeline**:

```
PriceChanged / PromotionStarted (event)
  → match wishlist owners (batch)
  → Notification (rate-limited per user/product)
```

- SoT: MySQL  
- Cache: Redis optional, invalidate bằng event  
- Unique `(userId, productType, productId)`

---

### 4.8 Recently Viewed

Redis ZSET `user:{id}:recently-viewed` · score = timestamp · cap N.

Đồng thời emit `PRODUCT_VIEWED` (outbox hoặc async fire với chấp nhận loss nếu chỉ analytics — **nói rõ trade-off**).

Privacy/TTL: expire key; không lưu vĩnh viễn nếu không cần.

---

### 4.9 Review + Rating

Model: rating, content, media (MinIO), `verifiedPurchase`, `helpfulCount`, moderation status.

**Aggregate**

- Write review → outbox → update product rating projection (table hoặc Redis) → OpenSearch partial update.  
- Helpful: anti-abuse (1 user 1 vote) + atomic counter.  
- Moderation queue admin; public chỉ `approved`.

Tránh `AVG()` full scan mỗi request listing.

---

### 4.10 Recommendation

Không cần ML để đạt mid signal; cần **pipeline + storage + freshness**.

```
PRODUCT_VIEWED / ORDER_PAID items
  → consumer cập nhật co-view / co-purchase counts (Redis + periodic flush hoặc OLAP nhẹ)
  → API top-N related / for-you
```

- Cold start: popular / same `productType`.  
- Explainability nhẹ: “thường xem cùng”.  
- Job rebuild từ events nếu Redis flush.

Senior+: feature store / ranking model sau — ghi là phase sau, không scope creep.

---

### 4.11 Admin Analytics (CQRS nhẹ)

Không chỉ “SQL + Redis TTL”.

```
OrderPaid / Refunded events
  → analytics consumer
  → daily_revenue, product_sales counters (MySQL/ClickHouse-lite table)
  → API đọc read-model
  → Redis cache short TTL
```

API: revenue · orders · products · customers (admin RBAC).

Chứng minh: **rebuild read-model từ event/outbox history** (ít nhất script).

---

## 5. Phase 4 — Hardening (senior polish)

| Concern | Việc cụ thể |
|---------|-------------|
| Saga | Refund/cancel Dining↔Payment có timeout + compensation |
| Lock | Redis lock / BullMQ singleton cho close-flash, reindex, reconcile |
| Resilience | Circuit breaker OpenSearch & Payment; timeout budget |
| Rate limit | Auth, search, voucher apply, webhook (per IP / per user) |
| Observability | `correlationId` end-to-end · metrics (lag, redeem fail, search p99) · traces |
| Security | Webhook signature verify · internal secret rotation · least privilege admin |
| Evidence | k6/artillery: checkout + flash; kill kafka-consumer; chứng minh DLQ/replay |
| Docs | ADR cho outbox, inventory SoT, promo stacking, saga refund |

---

## 6. Mapping codebase hiện tại

| Capability | Gắn gần nhất |
|------------|--------------|
| Outbox | `OrderService` / payment mark-paid · thay best-effort trong `orderEventPublisher` |
| Idempotency | PayOS webhook · `mark-paid` internal · checkout |
| OpenSearch | Index multi-entity qua `shopProductCatalog` · search route mới |
| Pricing / Voucher | `CartService` + checkout trong `OrderService` · snapshot `OrderItem` |
| Flash | Redis + reconcile job · Socket stock (UX) |
| Notification | Thay logger trong `kafkaConsumerMain` → durable consumer group |
| Order SM | `shopTypes.OrderStatus` + `OrderService` — cấm gán status rời |
| Saga refund | `PaymentService` + Dining internal APIs (mở rộng contract) |
| Wishlist/Review | Module mới · `ProductRef` |
| Recently Viewed | ioredis (đã có pattern OAuth pending) |
| Analytics | Consumer riêng + admin routes |
| Media review | MinIO + BullMQ/Sharp |

---

## 7. Nguyên tắc thiết kế (giữ discipline)

1. **MySQL (hoặc service DB) = write SoT**; Redis/OpenSearch = projection — luôn có rebuild.  
2. **Một `ProductRef` contract** xuyên suốt.  
3. **Money & inventory paths** có idempotency + audit; UX realtime không thay SoT.  
4. **Outbox cho event nghiệp vụ**; best-effort chỉ cho telemetry.  
5. **Consumers idempotent**; DLQ + replay documented.  
6. **Pricing deterministic + snapshot** trên order.  
7. **State machine** là API duy nhất đổi order status.  
8. **Degrade gracefully**: search/payment phụ down không corrupt order write.  
9. **Mỗi capability có failure demo** (không chỉ happy path README).  
10. **ADR** cho quyết định khó (inventory SoT, saga vs 2PC, sync search).

---

## 8. Thứ tự triển khai đề xuất

| # | Việc | Vì sao mid–senior |
|---|------|-------------------|
| 1 | Outbox + relay + consumer idempotency | Sửa “Kafka practice” thành production spine |
| 2 | Order SM + audit + version column | Nền saga / notify / analytics |
| 3 | Pay webhook / mark-paid idempotent | Money path sạch |
| 4 | OpenSearch sync + alias reindex + degrade | Search đúng nghĩa read-model |
| 5 | Pricing engine + voucher reserve/commit | Domain + concurrency |
| 6 | Notification durable + replay API | Event-driven có răng |
| 7 | Flash sale + load test evidence | Contention story |
| 8 | Wishlist price-drop · Reviews aggregate | Projection chains |
| 9 | Recommendation + Analytics rebuild | CQRS story |
| 10 | Saga refund · OTel · chaos/runbook | Senior close |

---

## 9. Definition of Done (mid–senior)

Một capability **chưa xong** nếu chỉ có happy-path API. Cần:

- [ ] ADR / đoạn design: SoT, consistency, trade-off  
- [ ] Schema + migration + (nếu có) event payload version  
- [ ] Idempotent writes / consumers  
- [ ] Failure modes: timeout, duplicate, partial outage — hành vi đã chọn  
- [ ] Observability: log có `correlationId`, ít nhất 1 metric hữu ích  
- [ ] Rebuild/reindex hoặc replay path  
- [ ] Test: unit domain (pricing/SM) + ít nhất 1 concurrency/integration test  
- [ ] Demo script: happy + duplicate webhook/event + (nếu relevant) load note  

---

## 10. Anti-patterns (tránh để khỏi tụt bar)

- Publish Kafka trong request rồi coi như reliable.  
- `order.status = "shipping"` rải nhiều chỗ.  
- Flash stock chỉ Socket, không atomic backend.  
- Voucher `INCR` không release khi cancel.  
- Search sync blocking HTTP write.  
- Analytics = `SUM` nặng mỗi request không có read-model.  
- Notification chỉ Socket, mất tin khi user offline.  
- Thêm 15 feature CRUD nông thay vì 8 capability có failure story.

---

*Tham chiếu nội bộ: `README.md` · `docs/kafka-practice.md` · `docs/payos-ready.md` · `docs/adr/0001-auth-dining-boundary.md`.*
