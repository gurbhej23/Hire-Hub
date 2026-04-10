import mongoose from "mongoose";
import Job from "../models/Job.js";
import User from "../models/User.js";
import { deleteNotification, upsertNotification } from "../utils/notificationHelpers.js";

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildUserResponse = async (userId) => {
  const user = await User.findById(userId)
    .select("-password -resetPasswordToken -resetPasswordExpires");

  if (!user) {
    return null;
  }

  const jobs = await Job.find({
    $or: [{ postedBy: user._id }, { repostOf: { $ne: null }, postedBy: user._id }],
  })
    .sort({ createdAt: -1 })
    .populate("postedBy", "name email profileImage role location")
    .populate("comments.user", "name profileImage")
    .populate("comments.replies.user", "name profileImage")
    .populate({
      path: "repostOf",
      populate: {
        path: "postedBy comments.user comments.replies.user",
      },
    });

  const userObject = user.toObject();
  userObject.jobs = jobs;
  userObject.followers = (user.followers || []).map((id) => id.toString());
  userObject.following = (user.following || []).map((id) => id.toString());
  userObject.followerCount = userObject.followers.length;
  userObject.followingCount = userObject.following.length;

  return userObject;
};

export const getUserById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await buildUserResponse(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to fetch user" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const query = search
      ? {
          name: { $regex: `^${escapeRegex(search)}`, $options: "i" },
        }
      : {};

    const users = await User.find(query)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .limit(20);

    const result = users
      .filter((user) => user._id.toString() !== req.user._id.toString())
      .map((user) => ({
        ...user.toObject(),
        followers: (user.followers || []).map((id) => id.toString()),
        following: (user.following || []).map((id) => id.toString()),
        followerCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
      }));

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to search users" });
  }
};

export const toggleFollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.user._id),
      User.findById(targetUserId),
    ]);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId
    );

    if (isFollowing) {
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUser._id.toString()
      );
      await deleteNotification({
        recipient: targetUser._id,
        actor: currentUser._id,
        type: "follow",
        entityId: currentUser._id.toString(),
      });
    } else {
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);
      await upsertNotification({
        recipient: targetUser._id,
        actor: currentUser._id,
        type: "follow",
        message: `${currentUser.name} started following you`,
        link: `/profile/${currentUser._id}`,
        entityId: currentUser._id.toString(),
      });
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    return res.json({
      following: currentUser.following.map((id) => id.toString()),
      followers: currentUser.followers.map((id) => id.toString()),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Follow action failed" });
  }
};

export const getUserConnections = async (req, res) => {
  try {
    const { id, type } = req.params;

    if (!["followers", "following"].includes(type)) {
      return res.status(400).json({ message: "Invalid connection type" });
    }

    const user = await User.findById(id)
      .populate(type, "name email profileImage role location")
      .select(type);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user[type] || []);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to fetch connections" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (id !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can update only your own profile" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const fields = ["name", "role", "location", "bio", "profileImage"];
    fields.forEach((field) => {
      if (typeof req.body[field] !== "undefined") {
        user[field] = req.body[field];
      }
    });

    await user.save();

    return res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        bio: user.bio,
        profileImage: user.profileImage,
        coverImage: user.coverImage,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to update profile" });
  }
};

export const updateCoverImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (id !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can update only your own cover image" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.coverImage = req.body.coverImage || "";
    await user.save();

    return res.json({
      message: "Cover image updated",
      coverImage: user.coverImage,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to update cover image" });
  }
};
