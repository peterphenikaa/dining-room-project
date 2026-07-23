import { Router } from "express";
import {
    createChair,
    getAllChairs,
    getChairById,
    updateChair,
    deleteChair,
} from "../controllers/DiningChairController";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = Router();

router.use(authenticate);

router.get("/", getAllChairs);
router.get("/:id", getChairById);

router.post("/", authorize("admin"), createChair);
router.put("/:id", authorize("admin"), updateChair);
router.delete("/:id", authorize("admin"), deleteChair);

export default router;
