import { Router } from "express";
import {
    createRoom,
    getAllRooms,
    getRoomById,
    updateRoom,
    deleteRoom,
} from "../controllers/DiningRoomController";
import { makeImageControllers } from "../controllers/EntityImageController";
import { authenticate, authorize } from "../security";
import { imageUpload } from "../middlewares/imageUpload";

const router = Router();
const images = makeImageControllers("room");
    
router.use(authenticate);

router.get("/", getAllRooms);
router.get("/:id", getRoomById);    

router.post("/", authorize("admin"), createRoom);
router.put("/:id", authorize("admin"), updateRoom);
router.delete("/:id", authorize("admin"), deleteRoom);

router.post("/:id/image", authorize("admin"), imageUpload.single("image"), images.upload);
router.delete("/:id/image", authorize("admin"), images.remove);

export default router;
