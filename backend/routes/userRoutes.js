import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getUserById,
  searchUsers,
  toggleFollowUser,
  getUserConnections,
  updateProfile,
  updateCoverImage,
} from "../conrollers/userConroller.js";

const router = express.Router();

router.use(protect);
router.get("/search", searchUsers);
router.get("/:id/:type", getUserConnections);
router.patch("/:id/follow", toggleFollowUser);
router.patch("/:id/profile", updateProfile);
router.patch("/:id/cover-image", updateCoverImage);
router.get("/:id", getUserById);

export default router;
