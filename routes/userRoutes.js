import express from "express";
import {
  detectLabels,
  emergencyContacts,
  getAllChallans,
  getAllInstances,
  userExists,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/detectLabels/:userUniqueKey", detectLabels);
router.get("/getAllInstances", getAllInstances);
router.get("/getAllChallans", getAllChallans);
router.get("/userExists", userExists);
router.post("/getEmergencyContacts", emergencyContacts);

export default router;
