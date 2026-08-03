# Kafka practice — domain events

## Flow

```
AuthService.register / Google create user
  → publish UserCreated → topic auth.user.events
UserService.adminUpdate (đổi role)
  → publish UserRoleChanged → cùng topic

OrderController.checkout (sau TX)
  → publish OrderCreated → topic dining.order.events

kafka-consumer (group auth-events-logger)
  → log / giả lập notify (auth + order)
```

Publish lỗi chỉ `console.warn` — API vẫn OK.

## Chạy

```bash
docker compose up -d kafka auth payment kafka-consumer app
docker compose logs -f kafka-consumer
```

Checkout đơn → consumer: `[notify] Order ORD-...`.

## Biến môi trường

| Key | Mặc định |
|---|---|
| `KAFKA_BROKERS` | `kafka:9092` |
| `KAFKA_AUTH_USER_TOPIC` | `auth.user.events` |
| `KAFKA_ORDER_TOPIC` | `dining.order.events` |
| `KAFKA_CONSUMER_GROUP` | `auth-events-logger` |
| `KAFKA_ENABLED` | `true` |

## Học thêm (chưa làm)

- Transactional Outbox
- Idempotent consumer
- Nhiều consumer group
