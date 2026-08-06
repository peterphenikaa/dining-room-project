import { Router } from "express"
import {
    cancelByOrder,
    createPayment,
    createPayosCheckout,
    createPayosCheckoutByOrder,
    getPaymentById,
    getPaymentByOrder,
    markPaid,
    markPaidByOrder,
    payosWebhook,
    syncPayosByOrder,
    syncPayosByOrderCode,
} from "../controllers/PaymentController"
import { authenticate, authorize } from "../../../security"

const router = Router()

router.post("/payos/webhook", payosWebhook)

router.use(authenticate)

router.post("/", createPayment)
router.get("/by-order/:orderId", getPaymentByOrder)
router.post("/by-order/:orderId/payos/checkout", createPayosCheckoutByOrder)
router.post("/by-order/:orderId/payos/sync", syncPayosByOrder)
router.post("/payos/sync", syncPayosByOrderCode)
router.post("/by-order/:orderId/mark-paid", authorize("admin"), markPaidByOrder)
router.post("/by-order/:orderId/cancel", cancelByOrder)
router.post("/:id/payos/checkout", createPayosCheckout)
router.post("/:id/mark-paid", authorize("admin"), markPaid)
router.get("/:id", getPaymentById)

export default router
