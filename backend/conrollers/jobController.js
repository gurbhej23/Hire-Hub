import Job from "../models/Job.js";
import {
  createNotification,
  deleteNotification,
  upsertNotification,
} from "../utils/notificationHelpers.js";

const populateJobQuery = (query) =>
  query
    .populate("postedBy", "name email profileImage role location")
    .populate("comments.user", "name profileImage")
    .populate("comments.replies.user", "name profileImage");

const getPopulatedJob = async (jobId) =>
  populateJobQuery(Job.findById(jobId)).populate({
    path: "repostOf",
    populate: {
      path: "postedBy comments.user comments.replies.user",
    },
  });

const toggleIdInArray = (arr, id) => {
  const normalizedId = id.toString();
  const exists = arr.some((item) => item.toString() === normalizedId);

  if (exists) {
    return arr.filter((item) => item.toString() !== normalizedId);
  }

  return [...arr, id];
};

export const getJobs = async (req, res) => {
  try {
    const jobs = await populateJobQuery(Job.find())
      .populate({
        path: "repostOf",
        populate: {
          path: "postedBy comments.user comments.replies.user",
        },
      })
      .sort({ createdAt: -1 });

    return res.json(jobs);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to fetch jobs" });
  }
};

export const createJob = async (req, res) => {
  try {
    const { title, description, company, location, mediaUrl, mediaType } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const job = await Job.create({
      title: title.trim(),
      description: description || "",
      company: company || "HireHub",
      location: location || "Online",
      mediaUrl: mediaUrl || "",
      mediaType: mediaType || "",
      postedBy: req.user._id,
    });

    const populatedJob = await getPopulatedJob(job._id);
    return res.status(201).json(populatedJob);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to create job" });
  }
};

export const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can update only your own post" });
    }

    ["title", "description", "company", "location", "mediaUrl", "mediaType"].forEach(
      (field) => {
        if (typeof req.body[field] !== "undefined") {
          job[field] = req.body[field];
        }
      }
    );

    await job.save();
    const populatedJob = await getPopulatedJob(job._id);
    return res.json(populatedJob);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to update job" });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can delete only your own post" });
    }

    await job.deleteOne();
    return res.json({ message: "Job deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to delete job" });
  }
};

export const toggleJobLike = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const hadLiked = (job.likes || []).some(
      (id) => id.toString() === req.user._id.toString()
    );

    job.likes = toggleIdInArray(job.likes || [], req.user._id);
    await job.save();

    if (hadLiked) {
      await deleteNotification({
        recipient: job.postedBy,
        actor: req.user._id,
        type: "post_like",
        entityId: job._id.toString(),
      });
    } else {
      await upsertNotification({
        recipient: job.postedBy,
        actor: req.user._id,
        type: "post_like",
        message: `${req.user.name} liked your post`,
        link: "/dashboard",
        entityId: job._id.toString(),
      });
    }

    const populatedJob = await getPopulatedJob(job._id);
    return res.json(populatedJob);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to like post" });
  }
};

export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (!text?.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    job.comments.push({
      user: req.user._id,
      text: text.trim(),
      likes: [],
      replies: [],
    });

    await job.save();
    await createNotification({
      recipient: job.postedBy,
      actor: req.user._id,
      type: "post_comment",
      message: `${req.user.name} commented on your post`,
      link: "/dashboard",
      entityId: job._id.toString(),
    });

    const populatedJob = await getPopulatedJob(job._id);
    return res.json(populatedJob);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to add comment" });
  }
};

export const editComment = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    const comment = job?.comments.id(req.params.commentId);

    if (!job || !comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can edit only your own comment" });
    }

    comment.text = req.body.text?.trim() || comment.text;
    await job.save();

    const populatedJob = await getPopulatedJob(job._id);
    return res.json(populatedJob);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to edit comment" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    const comment = job?.comments.id(req.params.commentId);

    if (!job || !comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can delete only your own comment" });
    }

    comment.deleteOne();
    await job.save();

    const populatedJob = await getPopulatedJob(job._id);
    return res.json(populatedJob);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to delete comment" });
  }
};

export const toggleCommentLike = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    const comment = job?.comments.id(req.params.commentId);

    if (!job || !comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const hadLiked = (comment.likes || []).some(
      (id) => id.toString() === req.user._id.toString()
    );

    comment.likes = toggleIdInArray(comment.likes || [], req.user._id);
    await job.save();

    if (hadLiked) {
      await deleteNotification({
        recipient: comment.user,
        actor: req.user._id,
        type: "comment_like",
        entityId: comment._id.toString(),
      });
    } else {
      await upsertNotification({
        recipient: comment.user,
        actor: req.user._id,
        type: "comment_like",
        message: `${req.user.name} liked your comment`,
        link: "/dashboard",
        entityId: comment._id.toString(),
      });
    }

    const populatedJob = await getPopulatedJob(job._id);
    return res.json(populatedJob);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to like comment" });
  }
};

export const addReply = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    const comment = job?.comments.id(req.params.commentId);
    const { text } = req.body;

    if (!job || !comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (!text?.trim()) {
      return res.status(400).json({ message: "Reply text is required" });
    }

    comment.replies.push({
      user: req.user._id,
      text: text.trim(),
      likes: [],
    });

    await job.save();
    await createNotification({
      recipient: comment.user,
      actor: req.user._id,
      type: "comment_reply",
      message: `${req.user.name} replied to your comment`,
      link: "/dashboard",
      entityId: comment._id.toString(),
    });

    const populatedJob = await getPopulatedJob(job._id);
    return res.json(populatedJob);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to add reply" });
  }
};

export const editReply = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    const comment = job?.comments.id(req.params.commentId);
    const reply = comment?.replies.id(req.params.replyId);

    if (!job || !comment || !reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    if (reply.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can edit only your own reply" });
    }

    reply.text = req.body.text?.trim() || reply.text;
    await job.save();

    const populatedJob = await getPopulatedJob(job._id);
    return res.json(populatedJob);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to edit reply" });
  }
};

export const deleteReply = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    const comment = job?.comments.id(req.params.commentId);
    const reply = comment?.replies.id(req.params.replyId);

    if (!job || !comment || !reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    if (reply.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can delete only your own reply" });
    }

    reply.deleteOne();
    await job.save();

    const populatedJob = await getPopulatedJob(job._id);
    return res.json(populatedJob);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to delete reply" });
  }
};

export const toggleReplyLike = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    const comment = job?.comments.id(req.params.commentId);
    const reply = comment?.replies.id(req.params.replyId);

    if (!job || !comment || !reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    const hadLiked = (reply.likes || []).some(
      (id) => id.toString() === req.user._id.toString()
    );

    reply.likes = toggleIdInArray(reply.likes || [], req.user._id);
    await job.save();

    if (hadLiked) {
      await deleteNotification({
        recipient: reply.user,
        actor: req.user._id,
        type: "reply_like",
        entityId: reply._id.toString(),
      });
    } else {
      await upsertNotification({
        recipient: reply.user,
        actor: req.user._id,
        type: "reply_like",
        message: `${req.user.name} liked your reply`,
        link: "/dashboard",
        entityId: reply._id.toString(),
      });
    }

    const populatedJob = await getPopulatedJob(job._id);
    return res.json(populatedJob);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to like reply" });
  }
};

export const toggleRepost = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const hadReposted = (job.reposts || []).some(
      (id) => id.toString() === req.user._id.toString()
    );

    job.reposts = toggleIdInArray(job.reposts || [], req.user._id);
    await job.save();

    if (hadReposted) {
      await deleteNotification({
        recipient: job.postedBy,
        actor: req.user._id,
        type: "post_repost",
        entityId: job._id.toString(),
      });
    } else {
      await upsertNotification({
        recipient: job.postedBy,
        actor: req.user._id,
        type: "post_repost",
        message: `${req.user.name} reposted your post`,
        link: "/dashboard",
        entityId: job._id.toString(),
      });
    }

    const populatedJob = await getPopulatedJob(job._id);
    return res.json(populatedJob);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to repost" });
  }
};

export const incrementShareCount = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    job.shares = (job.shares || 0) + 1;
    await job.save();

    const populatedJob = await getPopulatedJob(job._id);
    return res.json(populatedJob);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to share post" });
  }
};
