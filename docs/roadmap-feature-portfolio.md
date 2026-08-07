# Roadmap tuần tự (rút gọn)

Tài liệu này chỉ giữ **thứ tự làm việc** để bạn tối ưu project dần dần, chưa thêm feature mới.

---

## Giai đoạn 0 — Giữ nguyên phần đang tốt

- Multi-service + DB tách (`auth` / `payment` / `dining`)
- Checkout lock + `adjustStock`
- Order outbox + relay (`SKIP LOCKED`)
- JWT cookie + PayOS webhook + sync fallback
- FE Axios refresh cookie

---

## Giai đoạn 1 (P0) — Sửa correctness + security trước

Làm tuần tự từ 1 → 8:

1. **Fix `cancelByOrder` ownership**  
   - Non-admin chỉ hủy payment của chính mình.

2. **Harden webhook/markPaid**  
   - Lock row payment (`pessimistic_write`), reject amount mismatch, idempotent khi đã paid.

3. **Fix `createPending` race**  
   - Catch duplicate unique `orderId`, trả existing record thay vì 500.

4. **Secrets fail-fast ở production**  
   - Thiếu JWT/callback secret thì service không được boot.

5. **Fix race FE OrdersPage (`payos-sync` vs `load`)**  
   - Có `status=PAID&orderCode` thì sync trước, rồi mới load list.

6. **Cập nhật docs cho đúng code outbox hiện tại**  
   - `docs/kafka-practice.md`, phần baseline roadmap.

7. **Payment -> Dining notify reliable**  
   - Thay best-effort HTTP bằng retry bền (outbox/queue/reconcile).

8. **Auth events chuyển dần sang outbox**  
   - Đồng bộ strategy với Dining messaging.

---

## Giai đoạn 2 (P1) — Nâng kiến trúc và DX

1. Tách outbox relay khỏi API process (sang worker/process riêng).  
2. Consumer dedup theo `eventId` + DLQ tối thiểu.  
3. Thêm events: `OrderPaid`, `OrderCancelled`.  
4. Đồng bộ cancel order ↔ cancel payment.  
5. Thêm pagination cho Orders (`CursorPager`).  
6. FE: refresh fail thì clear session/redirect login.  
7. Xóa dead code (deprecated publisher, FE helpers không dùng).  
8. Thêm `.env.example`, script `dev/typecheck`, dọn dependency thừa.  
9. Thêm rate-limit nhẹ cho login/webhook.

---

## Giai đoạn 3 (P2) — Polish

1. Generic CRUD cho catalog (giảm copy-paste).  
2. Order state machine rõ ràng.  
3. Test trọng điểm: oversell, duplicate webhook, notify failure recover.  
4. Docker production multi-stage chuẩn.

---

## Không làm ngay

Chưa ưu tiên OpenSearch / flash sale / voucher / recommendation khi P0-P1 chưa xong.

---

## Checklist ngắn để làm dần

- [x] P0.1 cancel ownership
- [ ] P0.2 webhook lock + amount + idempotent
- [ ] P0.3 createPending idempotent
- [ ] P0.4 secrets fail-fast
- [ ] P0.5 OrdersPage sync race
- [ ] P0.6 docs outbox
- [ ] P0.7 Payment notify reliable
- [ ] P0.8 Auth outbox
- [ ] P1 items
- [ ] P2 items
