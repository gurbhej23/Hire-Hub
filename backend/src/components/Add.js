import { useEffect, useState } from "react";
import API from "../services/api";
import { getInitials } from "../utils/userHelpers";
import "../App.css";

const AddJob = ({
  onJobAdded,
  onCreateJob,
  editJob,
  onUpdate,
  currentUser,
  onOpenProfile,
}) => {
  const [form, setForm] = useState({
    title: "",
    company: "HireHub",
    location: "Online",
    description: "",
    mediaUrl: "",
    mediaType: "",
  });

  useEffect(() => {
    if (editJob) {
      setForm({
        title: editJob.title,
        company: editJob.company || "HireHub",
        location: editJob.location || "Online",
        description: editJob.description || "",
        mediaUrl: editJob.mediaUrl || "",
        mediaType: editJob.mediaType || "",
      });
    }
  }, [editJob]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editJob) {
        await onUpdate(form);
      } else if (onCreateJob) {
        await onCreateJob(form);
      } else {
        const res = await API.post("/jobs", form);
        onJobAdded(res.data);
      }

      setForm({
        title: "",
        company: "HireHub",
        location: "Online",
        description: "",
        mediaUrl: "",
        mediaType: "",
      });
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Unable to create post");
    }
  };

  const handleMediaChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      alert("Please select an image or video file.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        mediaUrl: reader.result,
        mediaType: isImage ? "image" : "video",
      }));
    };
    reader.readAsDataURL(file);
  };

  const clearMedia = () => {
    setForm((prev) => ({
      ...prev,
      mediaUrl: "",
      mediaType: "",
    }));
  };

  return (
    <div className="container"> 
      <form onSubmit={handleSubmit}>
        <div className="add-post-row">
          <button
            type="button"
            className="add-post-avatar-button"
            onClick={() => onOpenProfile?.(currentUser?._id)}
            aria-label="Open your profile"
          >
            {currentUser?.profileImage ? (
              <img
                src={currentUser.profileImage}
                alt={currentUser?.name || "User"}
                className="add-post-avatar"
              />
            ) : (
              <div className="add-post-avatar add-post-avatar-fallback">
                {getInitials(currentUser?.name || "User")}
              </div>
            )}
          </button>
          <input
            className="add-post-input"
            name="title"
            placeholder="What do you want to post?"
            value={form.title}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            className="add-post-media-button"
            title="Add image or video"
            aria-label="Add image or video"
            onClick={() => document.getElementById("post-media-input")?.click()}
          >
            <svg
              className="add-post-media-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="8.5" cy="10" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </button>
          <input
            id="post-media-input"
            className="add-post-hidden-input"
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaChange}
          />
        </div>
        {form.mediaUrl ? (
          <div className="add-post-media-preview">
            {form.mediaType === "image" ? (
              <img src={form.mediaUrl} alt="Selected media" className="add-post-preview-image" />
            ) : (
              <video src={form.mediaUrl} className="add-post-preview-video" controls />
            )}
            <button
              type="button"
              className="add-post-clear-media"
              onClick={clearMedia}
            >
              Remove
            </button>
          </div>
        ) : null}
        <button type="submit">{editJob ? "Update Post" : "Post"}</button>
      </form>
    </div>
  );
};

export default AddJob;
