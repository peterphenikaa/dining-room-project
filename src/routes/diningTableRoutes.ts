import { Router } from "express";
import {
    createTable,
    getAllTables,
    getTableById,
    updateTable,
    deleteTable,
} from "../controllers/DiningTableController";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = Router();

router.use(authenticate);

router.get("/", getAllTables);
router.get("/:id", getTableById);

router.post("/", authorize("admin"), createTable);
router.put("/:id", authorize("admin"), updateTable);
router.delete("/:id", authorize("admin"), deleteTable);

export default router;
