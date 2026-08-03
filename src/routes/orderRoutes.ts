import { Router } from "express"
import {
    cancelOrder,
    checkout,
    createPayosCheckout,
    getAllOrders,
    getMyOrders,
    getOrderById,
    markOrderPaid,
    syncPayosByCode,
    syncPayosPayment,
} from "../controllers/OrderController"
import { authenticate, authorize } from "../security"

const router = Router()
router.use(authenticate)

router.post("/checkout", checkout)
router.get("/mine", getMyOrders)
router.get("/", authorize("admin"), getAllOrders)
router.post("/payos-sync", syncPayosByCode)
router.post("/:id/payos-checkout", createPayosCheckout)
router.post("/:id/payos-sync", syncPayosPayment)
router.put("/:id/mark-paid", authorize("admin"), markOrderPaid)
router.get("/:id", getOrderById)
router.put("/:id/cancel", cancelOrder)

export default router
