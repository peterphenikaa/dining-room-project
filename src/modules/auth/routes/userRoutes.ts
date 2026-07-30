import { Router } from "express";
import {
    deleteUser,
    getUserById,
    listUsers,
    updateUser,
} from "../controllers/UserController";
import { authenticate, authorize } from "../middlewares/authenticate";

const router = Router();

router.use(authenticate);
router.use(authorize("admin"));

router.get("/", listUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
