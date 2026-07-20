import { Router } from "express";
import {
    createCabinet,
    getAllCabinets,
    getCabinetById,
    updateCabinet,
    deleteCabinet,
} from "../controllers/DiningCabinetController";

const router = Router();

router.post("/", createCabinet);
router.get("/", getAllCabinets);
router.get("/:id", getCabinetById);
router.put("/:id", updateCabinet);
router.delete("/:id", deleteCabinet);

export default router;
