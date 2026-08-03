import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import * as ordersApi from "../api/orders"
import type { Order } from "../types/api"
import { getApiErrorMessage } from "../utils/apiError"
import { formatVnd } from "../utils/formatMoney"

const statusLabel: Record<string, string> = {
    pending_payment: "Chờ thanh toán",
    paid: "Đã thanh toán",
    cancelled: "Đã hủy",
    fulfilled: "Hoàn tất",
}

const productLabel: Record<string, string> = {
    table: "Bàn",
    chair: "Ghế",
    cabinet: "Tủ",
    accessory: "Phụ kiện",
}

export function OrderDetailPage() {
    const { id } = useParams<{ id: string }>()
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return
        let cancelled = false
        void (async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await ordersApi.fetchOrderById(id)
                if (!cancelled) setOrder(data)
            } catch (e) {
                if (!cancelled) setError(getApiErrorMessage(e, "Không tải được đơn"))
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [id])

    return (
        <div className="page">
            <header className="page-header">
                <div>
                    <h1>Chi tiết đơn</h1>
                    <p className="muted mono">{order?.orderNumber ?? "…"}</p>
                </div>
                <Link to="/orders" className="secondary button-link">
                    ← Đơn hàng
                </Link>
            </header>

            {error && <p className="error">{error}</p>}
            {loading && <p className="muted">Đang tải...</p>}

            {order && (
                <>
                    <section className="panel">
                        <dl className="detail-grid">
                            <div>
                                <dt>Trạng thái</dt>
                                <dd>{statusLabel[order.status] ?? order.status}</dd>
                            </div>
                            <div>
                                <dt>Tổng tiền</dt>
                                <dd>{formatVnd(order.totalAmount)}</dd>
                            </div>
                            <div>
                                <dt>Tạo lúc</dt>
                                <dd>
                                    {order.createdAt
                                        ? new Date(order.createdAt).toLocaleString("vi-VN")
                                        : "—"}
                                </dd>
                            </div>
                            <div>
                                <dt>Thanh toán</dt>
                                <dd>
                                    {order.payment
                                        ? `${order.payment.provider} · ${order.payment.status}`
                                        : "—"}
                                </dd>
                            </div>
                            {order.payment?.paidAt && (
                                <div>
                                    <dt>Paid lúc</dt>
                                    <dd>
                                        {new Date(order.payment.paidAt).toLocaleString("vi-VN")}
                                    </dd>
                                </div>
                            )}
                            {order.payment?.orderCode && (
                                <div>
                                    <dt>PayOS orderCode</dt>
                                    <dd className="mono">{order.payment.orderCode}</dd>
                                </div>
                            )}
                        </dl>
                    </section>

                    <section className="panel">
                        <h2>Sản phẩm</h2>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Loại</th>
                                        <th>Tên</th>
                                        <th>Đơn giá</th>
                                        <th>SL</th>
                                        <th>Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(order.items ?? []).map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                {productLabel[item.productType] ??
                                                    item.productType}
                                            </td>
                                            <td>{item.productName}</td>
                                            <td>{formatVnd(item.unitPrice)}</td>
                                            <td>{item.quantity}</td>
                                            <td>{formatVnd(item.lineTotal)}</td>
                                        </tr>
                                    ))}
                                    {(order.items ?? []).length === 0 && (
                                        <tr>
                                            <td colSpan={5}>Không có dòng hàng</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}
        </div>
    )
}
