import { Router } from "express";
import {
    createChair,
    getAllChairs,
    getChairById,
    updateChair,
    deleteChair,
} from "../controllers/DiningChairController";

const router = Router();

router.post("/", createChair);
router.get("/", getAllChairs);
router.get("/:id", getChairById);
router.put("/:id", updateChair);
router.delete("/:id", deleteChair);

export default router;
