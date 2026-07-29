import { Router } from "express";
import {
    getMyProfile,
    googleCallback,
    login,
    logout,
    me,
    refresh,
    register,
    startGoogleLogin,
    updateMyProfile,
} from "../controllers/AuthController";
import { authenticate } from "../middlewares/authenticate";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, me);
router.get("/profile", authenticate, getMyProfile);
router.put("/profile", authenticate, updateMyProfile);

router.get("/google", startGoogleLogin);
router.get("/google/callback", googleCallback);

export default router;
