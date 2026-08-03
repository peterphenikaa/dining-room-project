import { useState } from "react"
import * as cartApi from "../api/cart"
import type { ShopProductType } from "../types/api"
import { getApiErrorMessage } from "../utils/apiError"

type Props = {
    productType: ShopProductType
    productId: string
    disabled?: boolean
}

export function AddToCartButton({ productType, productId, disabled }: Props) {
    const [busy, setBusy] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)

    async function handleClick() {
        if (disabled || busy) return
        setBusy(true)
        setMsg(null)
        try {
            await cartApi.addCartItem({ productType, productId, quantity: 1 })
            setMsg("Đã thêm")
            window.setTimeout(() => setMsg(null), 1500)
        } catch (e) {
            setMsg(getApiErrorMessage(e, "Lỗi"))
        } finally {
            setBusy(false)
        }
    }

    return (
        <span className="add-cart-wrap">
            <button
                type="button"
                className="secondary"
                disabled={disabled || busy}
                onClick={() => void handleClick()}
            >
                {busy ? "..." : "Thêm giỏ"}
            </button>
            {msg && <span className="hint">{msg}</span>}
        </span>
    )
}
