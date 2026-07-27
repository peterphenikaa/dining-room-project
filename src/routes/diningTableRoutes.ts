import { Router } from "express";
import {
    createTable,
    getAllTables,
    getTableById,
    updateTable,
    deleteTable,
} from "../controllers/DiningTableController";
import { makeImageControllers } from "../controllers/EntityImageController";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { imageUpload } from "../middlewares/imageUpload";

const router = Router();
const images = makeImageControllers("table");

router.use(authenticate);

router.get("/", getAllTables);
router.get("/:id", getTableById);

router.post("/", authorize("admin"), createTable);
router.put("/:id", authorize("admin"), updateTable);
router.delete("/:id", authorize("admin"), deleteTable);

router.post("/:id/image", authorize("admin"), imageUpload.single("image"), images.upload);
router.delete("/:id/image", authorize("admin"), images.remove);

export default router;
