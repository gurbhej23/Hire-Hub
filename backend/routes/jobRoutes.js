import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  addComment,
  addReply,
  createJob,
  deleteComment,
  deleteJob,
  deleteReply,
  editComment,
  editReply,
  getJobs,
  incrementShareCount,
  toggleCommentLike,
  toggleJobLike,
  toggleReplyLike,
  toggleRepost,
  updateJob,
} from "../conrollers/jobController.js";

const router = express.Router();

router.route("/").get(getJobs).post(protect, createJob);
router.route("/:id").put(protect, updateJob).delete(protect, deleteJob);
router.patch("/:id/like", protect, toggleJobLike);
router.patch("/:id/comment", protect, addComment);
router.patch("/:id/comments/:commentId", protect, editComment);
router.delete("/:id/comments/:commentId", protect, deleteComment);
router.patch("/:id/comments/:commentId/like", protect, toggleCommentLike);
router.patch("/:id/comments/:commentId/reply", protect, addReply);
router.patch("/:id/comments/:commentId/replies/:replyId", protect, editReply);
router.delete("/:id/comments/:commentId/replies/:replyId", protect, deleteReply);
router.patch("/:id/comments/:commentId/replies/:replyId/like", protect, toggleReplyLike);
router.patch("/:id/repost", protect, toggleRepost);
router.patch("/:id/share", protect, incrementShareCount);

export default router;
