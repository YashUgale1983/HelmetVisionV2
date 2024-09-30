import express from "express";
import {
  register,
  login,
  logout,
  checkAuth,
} from "../controllers/authController.js";

/* CREATING A ROUTER */
const router = express.Router();

/* DEFINING API ENDPOINTS */
//test API
// router.get("/", () => {
//   console.log("received");
// });
router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/checkAuth", checkAuth);

export default router;
