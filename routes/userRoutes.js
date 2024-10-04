import express from "express";
import {
  detectLabels,
  getAllChallans,
  getAllInstances,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/detectLabels/:userUniqueKey", detectLabels);
router.get("/getAllInstances", getAllInstances);
router.get("/getAllChallans", getAllChallans);

export default router;
