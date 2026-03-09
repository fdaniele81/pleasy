import express from "express";
import authController from "../controllers/authController.js";
import { loginRateLimiter, impersonateRateLimiter } from "../middlewares/rateLimiter.js";
import verifyToken from "../middlewares/verifyToken.js";
import checkRole from "../middlewares/checkRole.js";

const router = express.Router();

router.post("/login", loginRateLimiter, authController.login);

router.post("/impersonate", verifyToken, checkRole(["ADMIN"]), impersonateRateLimiter, authController.impersonate);

router.post("/refresh", authController.refresh);

router.post("/logout", authController.logout);

router.get("/me", verifyToken, authController.me);

export default router;
