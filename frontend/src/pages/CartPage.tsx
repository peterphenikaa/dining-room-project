import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import * as cartApi from "../api/cart"
import * as ordersApi from "../api/orders"
import type { CartView } from "../types/api"
import { getApiErrorMessage } from "../utils/apiError"
import { formatVnd } from "../utils/formatMoney"
import { ConfirmDialog } from "../components/ConfirmDialog"

const productLabel: Record<string, string> = {
    table: "Bàn",
    chair: "Ghế",
    cabinet: "Tủ",
    accessory: "Phụ kiện",
}

export function CartPage() {
    const navigate = useNavigate()
    const [cart, setCart] = useState<CartView | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [busyId, setBusyId] = useState<string | null>(null)
    const [checkingOut, setCheckingOut] = useState(false)
    const [confirmCheckout, setConfirmCheckout] = useState(false)

    async function load() {
        setLoading(true)
        setError(null)
        try {
            setCart(await cartApi.fetchCart())
        } catch (e) {
            setError(getApiErrorMessage(e, "Không tải được giỏ hàng"))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void load()
    }, [])

    async function changeQty(itemId: string, quantity: number) {
        if (quantity < 1) return
        setBusyId(itemId)
        setError(null)
        try {
            setCart(await cartApi.updateCartItem(itemId, quantity))
        } catch (e) {
            setError(getApiErrorMessage(e))
        } finally {
            setBusyId(null)
        }
    }

    async function removeItem(itemId: string) {
        setBusyId(itemId)
        setError(null)
        try {
            setCart(await cartApi.removeCartItem(itemId))
        } catch (e) {
            setError(getApiErrorMessage(e))
        } finally {
            setBusyId(null)
        }
    }

    async function handleCheckout() {
        setCheckingOut(true)
        setError(null)
        try {
            await ordersApi.checkout()
            setConfirmCheckout(false)
            navigate("/orders")
        } catch (e) {
            setError(getApiErrorMessage(e))
            setConfirmCheckout(false)
            await load()
        } finally {
            setCheckingOut(false)
        }
    }

    const items = cart?.items ?? []
    const canCheckout =
        items.length > 0 && items.every((i) => i.available && (i.unitPrice ?? 0) > 0)

    return (
        <div className="page">
            <header className="page-header">
                <div>
                    <h1>Giỏ hàng</h1>
                    <p className="muted">Nháp mua — chưa trừ kho đến khi đặt hàng.</p>
                </div>
                <Link to="/orders" className="secondary button-link">
                    Đơn của tôi
                </Link>
            </header>

            {error && <p className="error">{error}</p>}
            {loading && <p className="muted">Đang tải...</p>}

            {!loading && (
                <section className="panel-box">
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Loại</th>
                                    <th>Sản phẩm</th>
                                    <th>Đơn giá</th>
                                    <th>SL</th>
                                    <th>Tồn</th>
                                    <th>Thành tiền</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((row) => (
                                    <tr
                                        key={row.id}
                                        className={!row.available ? "row-warn" : undefined}
                                    >
                                        <td>{productLabel[row.productType] ?? row.productType}</td>
                                        <td>
                                            {row.productName ?? "(đã xóa)"}
                                            {!row.available && (
                                                <span className="hint"> — không khả dụng</span>
                                            )}
                                        </td>
                                        <td>
                                            {row.unitPrice != null
                                                ? formatVnd(row.unitPrice)
                                                : "—"}
                                        </td>
                                        <td>
                                            <input
                                                className="qty-input"
                                                type="number"
                                                min={1}
                                                value={row.quantity}
                                                disabled={busyId === row.id}
                                                onChange={(e) => {
                                                    const n = Number(e.target.value)
                                                    if (Number.isFinite(n)) {
                                                        void changeQty(row.id, n)
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td>{row.stock ?? "—"}</td>
                                        <td>
                                            {row.lineTotal != null
                                                ? formatVnd(row.lineTotal)
                                                : "—"}
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="danger"
                                                disabled={busyId === row.id}
                                                onClick={() => void removeItem(row.id)}
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={7}>
                                            Giỏ trống — thêm từ trang Bàn / Ghế / Tủ / Phụ kiện.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="cart-footer">
                        <strong>Tổng: {formatVnd(cart?.totalAmount ?? 0)}</strong>
                        <button
                            type="button"
                            disabled={!canCheckout || checkingOut}
                            onClick={() => setConfirmCheckout(true)}
                        >
                            Đặt hàng
                        </button>
                    </div>
                </section>
            )}

            <ConfirmDialog
                open={confirmCheckout}
                title="Xác nhận đặt hàng"
                message="Tồn kho sẽ bị trừ ngay. Đơn ở trạng thái chờ thanh toán."
                confirmLabel="Đặt hàng"
                confirmTone="primary"
                busy={checkingOut}
                onCancel={() => setConfirmCheckout(false)}
                onConfirm={() => void handleCheckout()}
            />
        </div>
    )
}
