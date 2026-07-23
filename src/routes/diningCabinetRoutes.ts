import { Router } from "express";
import {
    createCabinet,
    getAllCabinets,
    getCabinetById,
    updateCabinet,
    deleteCabinet,
} from "../controllers/DiningCabinetController";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = Router();

router.use(authenticate);

router.get("/", getAllCabinets);
router.get("/:id", getCabinetById);

router.post("/", authorize("admin"), createCabinet);
router.put("/:id", authorize("admin"), updateCabinet);
router.delete("/:id", authorize("admin"), deleteCabinet);

export default router;
