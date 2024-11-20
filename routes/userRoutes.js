import express from "express";
import {
  detectLabels,
  emergencyContacts,
  getAllChallans,
  getAllInstances,
  sensorData,
  userExists,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/detectLabels/:userUniqueKey", detectLabels);
router.get("/getAllInstances", getAllInstances);
router.get("/getAllChallans", getAllChallans);
router.get("/userExists", userExists);
router.post("/getEmergencyContacts", emergencyContacts);
router.post("/sensorData/:userUniqueKey", sensorData);

export default router;
