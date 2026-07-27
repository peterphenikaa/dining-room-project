import { Router } from "express";
import {
    createCabinet,
    getAllCabinets,
    getCabinetById,
    updateCabinet,
    deleteCabinet,
} from "../controllers/DiningCabinetController";
import { makeImageControllers } from "../controllers/EntityImageController";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { imageUpload } from "../middlewares/imageUpload";

const router = Router();
const images = makeImageControllers("cabinet");

router.use(authenticate);

router.get("/", getAllCabinets);
router.get("/:id", getCabinetById);

router.post("/", authorize("admin"), createCabinet);
router.put("/:id", authorize("admin"), updateCabinet);
router.delete("/:id", authorize("admin"), deleteCabinet);

router.post("/:id/image", authorize("admin"), imageUpload.single("image"), images.upload);
router.delete("/:id/image", authorize("admin"), images.remove);

export default router;
