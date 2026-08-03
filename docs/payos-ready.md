# PayOS — checkout URL + webhook

## Flow

```
User: Đơn pending → Thanh toán PayOS
  → Dining POST /api/orders/:id/payos-checkout
  → Payment tạo PayOS payment link (orderCode số)
  → FE mở checkoutUrl (QR / chuyển khoản)

PayOS → POST /api/payments/payos/webhook (public, verify chữ ký)
  → Payment status=paid
  → Payment → Dining POST /api/orders/internal/mark-paid (X-Payment-Callback-Secret)
  → Order status=paid

User returnUrl → /orders (reload thấy paid nếu webhook đã tới)
```

Admin vẫn có **Mark paid** thủ công (test khi chưa có public webhook).

## Env (`.env.payment`)

| Key                       | Ý nghĩa                        |
| ------------------------- | ------------------------------ |
| `PAYOS_CLIENT_ID`         | Từ my.payos.vn                 |
| `PAYOS_API_KEY`           |                                |
| `PAYOS_CHECKSUM_KEY`      | Verify webhook                 |
| `PAYOS_RETURN_URL`        | `http://localhost:5173/orders` |
| `PAYOS_CANCEL_URL`        | `http://localhost:5173/orders` |
| `DINING_INTERNAL_URL`     | Docker: `http://app:3002`      |
| `PAYMENT_CALLBACK_SECRET` | Trùng với Dining `.env.dining` |

## Webhook local (bắt buộc public URL)

PayOS không gọi được `localhost`. Dùng tunnel:

```bash
# ví dụ ngrok
ngrok http 3002
# Đăng ký webhook trên PayOS dashboard:
# https://<ngrok>/api/payments/payos/webhook
```

Dining proxy `/api/payments/*` → payment service (webhook không cần JWT).

Có thể confirm webhook bằng SDK: `payOS.webhooks.confirm(url)`.

## WebSocket vs Webhook

| WebSocket               | Webhook PayOS                        |
| ----------------------- | ------------------------------------ |
| FE ↔ Dining realtime UI | PayOS → Payment một lần khi đã trả   |
| Đã có Socket.IO         | Đã gắn `/api/payments/payos/webhook` |

## Smoke

1. Điền `PAYOS_*` trong `.env.payment`, recreate `payment` + `app`
2. `docker compose exec payment npm run migration:run:payment` (cột `orderCode`)
3. Đặt hàng → **Thanh toán PayOS** → mở link
4. Thanh toán sandbox → webhook → order `paid`
5. Không có ngrok: dùng admin **Mark paid**
