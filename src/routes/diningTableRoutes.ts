import { Router } from "express";
import {
    createTable,
    getAllTables,
    getTableById,
    updateTable,
    deleteTable,
} from "../controllers/DiningTableController";

const router = Router();

router.post("/", createTable);
router.get("/", getAllTables);
router.get("/:id", getTableById);
router.put("/:id", updateTable);
router.delete("/:id", deleteTable);

export default router;
