import React from "react";

export const getCurrentUserId = () => {
  const token = localStorage.getItem("token");

  if (!token) return "";

  try {
    const payloadPart = token.split(".")[1];
    const normalizedPayload = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalizedPayload));
    return payload.userId || "";
  } catch (error) {
    return "";
  }
};

export const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";

  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
};

export const renderAvatar = (name, profileImage, className) => {
  if (profileImage) {
    return <img src={profileImage} alt={name} className={className} />;
  }

  return <div className={className}>{getInitials(name)}</div>;
};

export const getRelativePostTime = (dateValue, now) => {
  if (!dateValue) return "Just now";

  const postDate = new Date(dateValue);

  if (Number.isNaN(postDate.getTime())) {
    return "Just now";
  }

  const diffMs = Math.max(now - postDate.getTime(), 0);
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes === 1) return "1 min ago";
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;

  return postDate.toLocaleDateString();
};
