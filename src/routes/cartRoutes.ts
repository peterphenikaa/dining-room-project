import { Router } from "express"
import {
    addCartItem,
    clearCart,
    getCart,
    removeCartItem,
    updateCartItem,
} from "../controllers/CartController"
import { authenticate } from "../security"

const router = Router()
router.use(authenticate)

router.get("/", getCart)
router.post("/items", addCartItem)
router.put("/items/:id", updateCartItem)
router.delete("/items/:id", removeCartItem)
router.delete("/", clearCart)

export default router
