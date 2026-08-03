import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import * as ordersApi from "../api/orders"
import type { Order } from "../types/api"
import { useCanWrite } from "../hooks/useCanWrite"
import { getApiErrorMessage } from "../utils/apiError"
import { formatVnd } from "../utils/formatMoney"
import { ConfirmDialog } from "../components/ConfirmDialog"
import { PAGE_LIMIT } from "../api/listParams"

const statusLabel: Record<string, string> = {
    pending_payment: "Chờ thanh toán",
    paid: "Đã thanh toán",
    cancelled: "Đã hủy",
    fulfilled: "Hoàn tất",
}

export function OrdersPage() {
    const isAdmin = useCanWrite()
    const [searchParams, setSearchParams] = useSearchParams()
    const [items, setItems] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [cancelId, setCancelId] = useState<string | null>(null)
    const [cancelling, setCancelling] = useState(false)
    const [markPaidId, setMarkPaidId] = useState<string | null>(null)
    const [markingPaid, setMarkingPaid] = useState(false)
    const [payingId, setPayingId] = useState<string | null>(null)

    async function load() {
        setLoading(true)
        setError(null)
        try {
            const page = isAdmin
                ? await ordersApi.fetchAllOrders({ limit: PAGE_LIMIT })
                : await ordersApi.fetchMyOrders({ limit: PAGE_LIMIT })
            setItems(page.items)
        } catch (e) {
            setError(getApiErrorMessage(e, "Không tải được đơn hàng"))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void load()
    }, [isAdmin])

    /** PayOS returnUrl ?status=PAID&orderCode=... — hỏi lại PayOS nếu webhook miss */
    useEffect(() => {
        const status = searchParams.get("status")
        const rawCode = searchParams.get("orderCode")
        if (status !== "PAID" || !rawCode) return
        const orderCode = Number(rawCode)
        if (!Number.isFinite(orderCode) || orderCode <= 0) return

        let cancelled = false
        void (async () => {
            try {
                await ordersApi.syncPayosByCode(orderCode)
                if (cancelled) return
                setSearchParams({}, { replace: true })
                await load()
            } catch (e) {
                if (!cancelled) {
                    setError(getApiErrorMessage(e, "Đồng bộ PayOS thất bại"))
                    setSearchParams({}, { replace: true })
                }
            }
        })()
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams])

    async function handleCancel() {
        if (!cancelId) return
        setCancelling(true)
        setError(null)
        try {
            await ordersApi.cancelOrder(cancelId)
            setCancelId(null)
            await load()
        } catch (e) {
            setError(getApiErrorMessage(e))
        } finally {
            setCancelling(false)
        }
    }

    async function handleMarkPaid() {
        if (!markPaidId) return
        setMarkingPaid(true)
        setError(null)
        try {
            await ordersApi.markOrderPaid(markPaidId)
            setMarkPaidId(null)
            await load()
        } catch (e) {
            setError(getApiErrorMessage(e))
        } finally {
            setMarkingPaid(false)
        }
    }

    async function handlePayos(orderId: string) {
        setPayingId(orderId)
        setError(null)
        try {
            const result = await ordersApi.createPayosCheckout(orderId)
            if (!result.checkoutUrl) {
                throw new Error("PayOS không trả checkoutUrl — kiểm tra PAYOS_* env")
            }
            window.open(result.checkoutUrl, "_blank", "noopener,noreferrer")
        } catch (e) {
            setError(getApiErrorMessage(e, "Không tạo được link PayOS"))
        } finally {
            setPayingId(null)
        }
    }

    return (
        <div className="page">
            <header className="page-header">
                <div>
                    <h1>{isAdmin ? "Đơn hàng" : "Đơn của tôi"}</h1>
                    <p className="muted">
                        Thanh toán qua PayOS (QR/link). Admin vẫn có thể mark-paid thủ công.
                    </p>
                </div>
                <Link to="/cart" className="secondary button-link">
                    Giỏ hàng
                </Link>
            </header>

            {error && <p className="error">{error}</p>}
            {loading && <p className="muted">Đang tải...</p>}

            <section className="panel">
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Mã</th>
                                {isAdmin && <th>User</th>}
                                <th>Trạng thái</th>
                                <th>Tổng</th>
                                <th>Tạo lúc</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((row) => (
                                <tr key={row.id}>
                                    <td className="mono">
                                        <Link to={`/orders/${row.id}`}>{row.orderNumber}</Link>
                                    </td>
                                    {isAdmin && (
                                        <td className="mono">{row.userId.slice(0, 8)}…</td>
                                    )}
                                    <td>{statusLabel[row.status] ?? row.status}</td>
                                    <td>{formatVnd(row.totalAmount)}</td>
                                    <td>
                                        {row.createdAt
                                            ? new Date(row.createdAt).toLocaleString("vi-VN")
                                            : "—"}
                                    </td>
                                    <td>
                                        <div className="row-actions-inline">
                                            <Link
                                                to={`/orders/${row.id}`}
                                                className="secondary button-link"
                                            >
                                                Chi tiết
                                            </Link>
                                            {row.status === "pending_payment" && (
                                                <button
                                                    type="button"
                                                    disabled={payingId === row.id}
                                                    onClick={() => void handlePayos(row.id)}
                                                >
                                                    {payingId === row.id
                                                        ? "..."
                                                        : "Thanh toán PayOS"}
                                                </button>
                                            )}
                                            {isAdmin && row.status === "pending_payment" && (
                                                <button
                                                    type="button"
                                                    className="secondary"
                                                    onClick={() => setMarkPaidId(row.id)}
                                                >
                                                    Mark paid
                                                </button>
                                            )}
                                            {row.status === "pending_payment" && (
                                                <button
                                                    type="button"
                                                    className="danger"
                                                    onClick={() => setCancelId(row.id)}
                                                >
                                                    Hủy
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && items.length === 0 && (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5}>Chưa có đơn hàng</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <ConfirmDialog
                open={!!cancelId}
                title="Hủy đơn hàng"
                message="Hoàn tồn kho, hủy payment pending. Tiếp tục?"
                confirmLabel="Hủy đơn"
                busy={cancelling}
                onCancel={() => setCancelId(null)}
                onConfirm={() => void handleCancel()}
            />

            <ConfirmDialog
                open={!!markPaidId}
                title="Xác nhận đã thanh toán (manual)"
                message="Bypass PayOS — đánh dấu payment + đơn paid. Dùng khi test không có webhook."
                confirmLabel="Mark paid"
                confirmTone="primary"
                busy={markingPaid}
                onCancel={() => setMarkPaidId(null)}
                onConfirm={() => void handleMarkPaid()}
            />
        </div>
    )
}
