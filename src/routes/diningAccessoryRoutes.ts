import { Router } from "express";
import {
    createAccessory,
    getAllAccessories,
    getAccessoryById,
    updateAccessory,
    deleteAccessory,
} from "../controllers/DiningAccessoryController";
import { makeImageControllers } from "../controllers/EntityImageController";
import { authenticate, authorize } from "../security";
import { imageUpload } from "../middlewares/imageUpload";

const router = Router();
const images = makeImageControllers("accessory");

router.use(authenticate);

router.get("/", getAllAccessories);
router.get("/:id", getAccessoryById);

router.post("/", authorize("admin"), createAccessory);
router.put("/:id", authorize("admin"), updateAccessory);
router.delete("/:id", authorize("admin"), deleteAccessory);

router.post("/:id/image", authorize("admin"), imageUpload.single("image"), images.upload);
router.delete("/:id/image", authorize("admin"), images.remove);

export default router;
