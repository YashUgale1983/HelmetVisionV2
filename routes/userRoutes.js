import express from "express";
import { detectLabels } from "../controllers/userController.js";

const router = express.Router();

router.post("/detectLabels/:userUniqueKey", detectLabels);

export default router;
