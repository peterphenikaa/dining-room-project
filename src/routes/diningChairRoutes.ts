import { Router } from "express";
import {
    createChair,
    getAllChairs,
    getChairById,
    updateChair,
    deleteChair,
} from "../controllers/DiningChairController";
import { makeImageControllers } from "../controllers/EntityImageController";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { imageUpload } from "../middlewares/imageUpload";

const router = Router();
const images = makeImageControllers("chair");

router.use(authenticate);

router.get("/", getAllChairs);
router.get("/:id", getChairById);

router.post("/", authorize("admin"), createChair);
router.put("/:id", authorize("admin"), updateChair);
router.delete("/:id", authorize("admin"), deleteChair);

router.post("/:id/image", authorize("admin"), imageUpload.single("image"), images.upload);
router.delete("/:id/image", authorize("admin"), images.remove);

export default router;
