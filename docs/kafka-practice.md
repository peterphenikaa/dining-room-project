# Kafka practice — Auth domain events

## Flow

```
AuthService.register / Google create user
  → publish UserCreated → topic auth.user.events
UserService.adminUpdate (đổi role)
  → publish UserRoleChanged → cùng topic

kafka-consumer (group auth-events-logger)
  → log / giả lập notify
```

Auth **không** đợi Kafka: publish lỗi chỉ `console.warn` — login vẫn OK.

## Chạy

```bash
docker compose up -d kafka auth kafka-consumer
# đợi Kafka ready ~10s
docker compose logs -f kafka-consumer
```

Redpanda expose host `localhost:19092` (Kafka API). Trong compose, app dùng `kafka:9092`.

Đăng ký user mới (FE hoặc curl) → consumer in ra `[notify] Welcome ...`.

Admin đổi role trên `/users` → `[notify] email: user → admin`.

## Biến môi trường

| Key | Mặc định Docker |
|---|---|
| `KAFKA_BROKERS` | `kafka:9092` |
| `KAFKA_AUTH_USER_TOPIC` | `auth.user.events` |
| `KAFKA_CONSUMER_GROUP` | `auth-events-logger` |
| `KAFKA_ENABLED` | `true` |

Host machine (ngoài Docker): advertise listener hiện là `kafka:9092` (nội bộ compose). Test từ host qua `docker compose exec`.

## Học thêm (chưa làm)

- Transactional Outbox (ghi DB + outbox cùng TX, poller publish)
- Idempotent consumer (dedupe theo `userId` + `occurredAt`)
- Nhiều consumer group (email vs audit)
