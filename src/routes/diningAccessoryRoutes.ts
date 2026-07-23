import { Router } from "express";
import {
    createAccessory,
    getAllAccessories,
    getAccessoryById,
    updateAccessory,
    deleteAccessory,
} from "../controllers/DiningAccessoryController";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = Router();

router.use(authenticate);

router.get("/", getAllAccessories);
router.get("/:id", getAccessoryById);

router.post("/", authorize("admin"), createAccessory);
router.put("/:id", authorize("admin"), updateAccessory);
router.delete("/:id", authorize("admin"), deleteAccessory);

export default router;
