import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../services/api";
import AddJob from "../Add";
import AppTopbar from "../Navbar/AppTopbar";
import DashboardProfileCard from "../Profile/DashboardProfileCard";
import DashboardPostCard from "./DashboardPostCard"; 
import {
  getCurrentUserId,
  getRelativePostTime,
  renderAvatar,
} from "../../utils/userHelpers";
import { logoutUser } from "../../utils/session"; 

const isFakeJobId = (jobId = "") => jobId?.toString().startsWith("fake-job-");

const demoPosts = [
  {
    id: 1,
    title: "Frontend developer role open for React and modern UI work",
    body: "We are building polished hiring workflows and need someone who can turn rough ideas into clean, responsive interfaces.",
  },
  {
    id: 2,
    title: "Hiring a MERN stack developer for product and dashboard features",
    body: "Looking for a developer comfortable with React, Node.js, Express, MongoDB, and shipping practical features quickly.",
  },
  {
    id: 3,
    title: "Need a UI designer who can work closely with developers",
    body: "This role is focused on light theme design systems, clean visual hierarchy, and collaboration with frontend engineers.",
  },
  {
    id: 4,
    title: "Internship opening for full stack web development",
    body: "Great fit for someone learning fast, contributing to real projects, and wanting exposure to frontend and backend work.",
  },
  {
    id: 5,
    title: "Product team searching for a junior React developer",
    body: "You will help improve navigation, profile pages, and interaction flows across the platform with mentor support.",
  },
  {
    id: 6,
    title: "Remote opportunity for JavaScript engineer",
    body: "Strong fundamentals in JavaScript, reusable components, and API integration are the main things we care about here.",
  },
];

const demoUsers = [
  {
    id: 1,
    firstName: "Aman",
    lastName: "Sharma",
    email: "aman@example.com",
    image: "https://picsum.photos/seed/user-aman/200/200",
    address: { city: "Chandigarh" },
    company: { name: "PixelForge", title: "Frontend Team" },
  },
  {
    id: 2,
    firstName: "Simran",
    lastName: "Kaur",
    email: "simran@example.com",
    image: "https://picsum.photos/seed/user-simran/200/200",
    address: { city: "Ludhiana" },
    company: { name: "CodeNest", title: "Product Engineering" },
  },
  {
    id: 3,
    firstName: "Rahul",
    lastName: "Verma",
    email: "rahul@example.com",
    image: "https://picsum.photos/seed/user-rahul/200/200",
    address: { city: "Mohali" },
    company: { name: "HireHub Labs", title: "Growth Team" },
  },
  {
    id: 4,
    firstName: "Neha",
    lastName: "Bansal",
    email: "neha@example.com",
    image: "https://picsum.photos/seed/user-neha/200/200",
    address: { city: "Delhi" },
    company: { name: "BrightStack", title: "Design Systems" },
  },
  {
    id: 5,
    firstName: "Arjun",
    lastName: "Singh",
    email: "arjun@example.com",
    image: "https://picsum.photos/seed/user-arjun/200/200",
    address: { city: "Jaipur" },
    company: { name: "NextOrbit", title: "Platform Team" },
  },
  {
    id: 6,
    firstName: "Priya",
    lastName: "Mehta",
    email: "priya@example.com",
    image: "https://picsum.photos/seed/user-priya/200/200",
    address: { city: "Pune" },
    company: { name: "LaunchGrid", title: "Web Experience" },
  },
];

const buildFakeJobs = (posts = [], users = []) => {
  const now = Date.now();

  return (posts || []).map((post, index) => {
    const author = users[index % users.length] || {};

    return {
      _id: `fake-job-${post.id}`,
      title: post.title,
      company: author.company?.name || author.company?.title || "HireHub Network",
      location: author.address?.city || "Remote",
      description: post.body,
      mediaUrl: `https://picsum.photos/seed/hirehub-${post.id}/900/520`,
      mediaType: "image",
      createdAt: new Date(now - index * 3600000).toISOString(),
      updatedAt: new Date(now - index * 3600000).toISOString(),
      likes: [],
      comments: [],
      reposts: [],
      shares: 0,
      postedBy: {
        _id: `fake-user-${author.id || post.id}`,
        name: `${author.firstName || "Demo"} ${author.lastName || "User"}`.trim(),
        email: author.email || "",
        profileImage: author.image || "",
      },
    };
  });
};

const buildDemoJobFromForm = (form, currentUser) => ({
  _id: `fake-job-local-${Date.now()}`,
  title: form.title,
  company: form.company || "HireHub",
  location: form.location || "Online",
  description: form.description || "",
  mediaUrl: form.mediaUrl || "",
  mediaType: form.mediaType || "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  likes: [],
  comments: [],
  reposts: [],
  shares: [],
  postedBy: {
    _id: currentUser?._id || "demo-current-user",
    name: currentUser?.name || "You",
    email: currentUser?.email || "",
    profileImage: currentUser?.profileImage || "",
  },
});

const normalizeJobForList = (job, currentUser) => {
  if (!job) return job;

  if (job.postedBy && typeof job.postedBy === "object" && job.postedBy._id) {
    return job;
  }

  if (!currentUser?._id) {
    return job;
  }

  const postedById =
    typeof job.postedBy === "string" ? job.postedBy : currentUser._id;

  return {
    ...job,
    postedBy: {
      _id: postedById,
      name: currentUser.name || "You",
      email: currentUser.email || "",
      profileImage: currentUser.profileImage || "",
    },
  };
};

const Dashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editJob, setEditJob] = useState(null);
  const [user, setUser] = useState([]);
  const [onOpenFollowers, setOnOpenFollowers] = useState([]);
  const [onOpenFollowing, setOnOpenFollowing] = useState([]);
  const [users, setUsers] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [following, setFollowing] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState(null);
  const [isUsingFakeJobs, setIsUsingFakeJobs] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentUserId = getCurrentUserId();
  const currentUserName = currentUser?.name || "User";
  const currentUserJobAbout =
    currentUser?.jobs?.find((job) => job.description?.trim())?.description || "";
  const currentUserDescription =
    currentUser?.bio ||
    currentUserJobAbout ||
    currentUser?.role ||
    "View your profile and manage your hiring activity.";
  const followerCount = currentUser?.followerCount || 0;
  const followingCount = currentUser?.followingCount || 0;

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const fetchFakeJobs = async () => {
    const demoJobs = buildFakeJobs(demoPosts, demoUsers);

    setJobs(demoJobs);
    setIsUsingFakeJobs(true);
  };

  const fetchJobs = async () => {
    try {
      const res = await API.get("/jobs");
      setJobs(res.data || []);
      setIsUsingFakeJobs(false);
    } catch (err) {
      try {
        await fetchFakeJobs();
        showToast("Demo posts loaded", "success");
      } catch (fakeError) {
        showToast(
          fakeError.message || err.response?.data?.message || err.message,
          "error"
        );
      }
    }
  };

  const fetchCurrentUser = async () => {
    if (!currentUserId) return;

    try {
      const res = await API.get(`/users/${currentUserId}`);
      setCurrentUser(res.data);
      setFollowing(res.data.following || []);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      const res = await API.get("/users/search?search=");
      const nextUsers = (res.data || [])
        .filter((person) => person._id !== currentUserId)
        .slice(0, 6);
      setSuggestedUsers(nextUsers);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      await Promise.all([fetchJobs(), fetchCurrentUser(), fetchSuggestedUsers()]);
      setIsLoading(false);
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;

    const timer = setTimeout(() => {
      setToast(null);
    }, 2400);

    return () => clearTimeout(timer);
  }, [toast]);

  const handleDelete = async (id) => {
    if (isFakeJobId(id)) {
      setJobs((prevJobs) => prevJobs.filter((job) => job._id !== id));
      showToast("Demo post removed");
      return;
    }

    try {
      await API.delete(`/jobs/${id}`);
      setJobs(jobs.filter((job) => job._id !== id));
      fetchCurrentUser();
      showToast("Post deleted");
    } catch (err) {
      console.log(err);
      showToast(err.response?.data?.message || "Delete failed", "error");
    }
  };

  const handleLogout = () => {
    logoutUser(navigate);
  };

  const handleJobAdded = (newJob) => {
    const normalizedJob = normalizeJobForList(newJob, currentUser);
    setJobs((prevJobs) => [normalizedJob, ...prevJobs]);
    fetchCurrentUser();
    showToast("Post added");
  };

  const handleCreateJob = async (form) => {
    if (isUsingFakeJobs) {
      const demoJob = buildDemoJobFromForm(form, currentUser);
      setJobs((prevJobs) => [demoJob, ...prevJobs]);
      showToast("Demo post added");
      return;
    }

    const res = await API.post("/jobs", form);
    handleJobAdded(res.data);
  };

  const handleUpdate = async (updatedData) => {
    if (isFakeJobId(editJob?._id)) {
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job._id === editJob._id
            ? {
              ...job,
              ...updatedData,
              updatedAt: new Date().toISOString(),
            }
            : job
        )
      );
      setEditJob(null);
      showToast("Demo post updated");
      return;
    }

    const res = await API.put(`/jobs/${editJob._id}`, updatedData);
    const normalizedJob = normalizeJobForList(res.data, currentUser);

    setJobs((prevJobs) =>
      prevJobs.map((job) => (job._id === editJob._id ? normalizedJob : job))
    );
    setEditJob(null);
    fetchCurrentUser();
    showToast("Post updated");
  };

  const handleOpenProfile = (userId) => {
    if (userId) {
      if (userId.toString().startsWith("fake-user-")) {
        showToast("Demo profile is not available yet", "error");
        return;
      }

      navigate(`/profile/${userId}`);
    }
  };

  const handleLike = async (jobId) => {
    if (isFakeJobId(jobId)) {
      setJobs((prevJobs) =>
        prevJobs.map((job) => {
          const target = job.repostOf?._id === jobId ? job.repostOf : job;

          if (target._id !== jobId) {
            return job;
          }

          const nextLikes = (target.likes || []).includes(currentUserId)
            ? target.likes.filter((id) => id !== currentUserId)
            : [...(target.likes || []), currentUserId];

          if (job.repostOf?._id === jobId) {
            return {
              ...job,
              repostOf: {
                ...job.repostOf,
                likes: nextLikes,
              },
            };
          }

          return {
            ...job,
            likes: nextLikes,
          };
        })
      );
      return;
    }

    try {
      const res = await API.patch(`/jobs/${jobId}/like`);
      replaceJobInState(res.data);
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to update like", "error");
    }
  };

  const replaceJobInState = (updatedJob) => {
    const normalizedJob = normalizeJobForList(updatedJob, currentUser);
    const normalizedJobId = normalizedJob?._id?.toString();

    setJobs((prevJobs) =>
      prevJobs.map((job) => {
        if (job._id?.toString() === normalizedJobId) {
          return normalizedJob;
        }

        if (job.repostOf?._id?.toString() === normalizedJobId) {
          return {
            ...job,
            repostOf: normalizedJob,
          };
        }

        return job;
      })
    );
  };

  const handleComment = async (jobId, text) => {
    if (isFakeJobId(jobId)) {
      const newComment = {
        _id: `fake-comment-${Date.now()}`,
        text,
        createdAt: new Date().toISOString(),
        likes: [],
        replies: [],
        user: {
          _id: currentUserId,
          name: currentUser?.name || "You",
          profileImage: currentUser?.profileImage || "",
        },
      };

      setJobs((prevJobs) =>
        prevJobs.map((job) => {
          if (job._id === jobId) {
            return {
              ...job,
              comments: [...(job.comments || []), newComment],
            };
          }

          if (job.repostOf?._id === jobId) {
            return {
              ...job,
              repostOf: {
                ...job.repostOf,
                comments: [...(job.repostOf.comments || []), newComment],
              },
            };
          }

          return job;
        })
      );
      return;
    }

    try {
      const res = await API.patch(`/jobs/${jobId}/comment`, { text });
      replaceJobInState(res.data);
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to add comment", "error");
    }
  };

  const handleCommentEdit = async (jobId, commentId, text) => {
    if (isFakeJobId(jobId)) {
      setJobs((prevJobs) =>
        prevJobs.map((job) => {
          const updateComments = (comments = []) =>
            comments.map((comment) =>
              comment._id?.toString() === commentId
                ? { ...comment, text }
                : comment
            );

          if (job._id === jobId) {
            return { ...job, comments: updateComments(job.comments) };
          }

          if (job.repostOf?._id === jobId) {
            return {
              ...job,
              repostOf: {
                ...job.repostOf,
                comments: updateComments(job.repostOf.comments),
              },
            };
          }

          return job;
        })
      );
      showToast("Comment updated");
      return;
    }

    try {
      const res = await API.patch(`/jobs/${jobId}/comments/${commentId}`, { text });
      replaceJobInState(res.data);
      showToast("Comment updated");
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to edit comment", "error");
    }
  };

  const handleCommentDelete = async (jobId, commentId) => {
    if (isFakeJobId(jobId)) {
      setJobs((prevJobs) =>
        prevJobs.map((job) => {
          const updateComments = (comments = []) =>
            comments.filter((comment) => comment._id?.toString() !== commentId);

          if (job._id === jobId) {
            return { ...job, comments: updateComments(job.comments) };
          }

          if (job.repostOf?._id === jobId) {
            return {
              ...job,
              repostOf: {
                ...job.repostOf,
                comments: updateComments(job.repostOf.comments),
              },
            };
          }

          return job;
        })
      );
      showToast("Comment deleted");
      return;
    }

    try {
      const res = await API.delete(`/jobs/${jobId}/comments/${commentId}`);
      replaceJobInState(res.data);
      showToast("Comment deleted");
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to delete comment", "error");
    }
  };

  const handleCommentLike = async (jobId, commentId) => {
    if (isFakeJobId(jobId)) {
      setJobs((prevJobs) =>
        prevJobs.map((job) => {
          const updateComments = (comments = []) =>
            comments.map((comment) => {
              if (comment._id?.toString() !== commentId) return comment;

              const nextLikes = (comment.likes || []).includes(currentUserId)
                ? comment.likes.filter((id) => id !== currentUserId)
                : [...(comment.likes || []), currentUserId];

              return {
                ...comment,
                likes: nextLikes,
              };
            });

          if (job._id === jobId) {
            return { ...job, comments: updateComments(job.comments) };
          }

          if (job.repostOf?._id === jobId) {
            return {
              ...job,
              repostOf: {
                ...job.repostOf,
                comments: updateComments(job.repostOf.comments),
              },
            };
          }

          return job;
        })
      );
      return;
    }

    try {
      const res = await API.patch(`/jobs/${jobId}/comments/${commentId}/like`);
      replaceJobInState(res.data);
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to like comment", "error");
    }
  };

  const handleCommentReply = async (jobId, commentId, text) => {
    if (isFakeJobId(jobId)) {
      const newReply = {
        _id: `fake-reply-${Date.now()}`,
        text,
        createdAt: new Date().toISOString(),
        likes: [],
        user: {
          _id: currentUserId,
          name: currentUser?.name || "You",
          profileImage: currentUser?.profileImage || "",
        },
      };

      setJobs((prevJobs) =>
        prevJobs.map((job) => {
          const updateComments = (comments = []) =>
            comments.map((comment) =>
              comment._id?.toString() === commentId
                ? {
                  ...comment,
                  replies: [...(comment.replies || []), newReply],
                }
                : comment
            );

          if (job._id === jobId) {
            return { ...job, comments: updateComments(job.comments) };
          }

          if (job.repostOf?._id === jobId) {
            return {
              ...job,
              repostOf: {
                ...job.repostOf,
                comments: updateComments(job.repostOf.comments),
              },
            };
          }

          return job;
        })
      );
      showToast("Reply added");
      return;
    }

    try {
      const res = await API.patch(`/jobs/${jobId}/comments/${commentId}/reply`, { text });
      replaceJobInState(res.data);
      showToast("Reply added");
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to reply", "error");
    }
  };

  const handleReplyEdit = async (jobId, commentId, replyId, text) => {
    if (isFakeJobId(jobId)) {
      setJobs((prevJobs) =>
        prevJobs.map((job) => {
          const updateComments = (comments = []) =>
            comments.map((comment) =>
              comment._id?.toString() === commentId
                ? {
                  ...comment,
                  replies: (comment.replies || []).map((reply) =>
                    reply._id?.toString() === replyId
                      ? { ...reply, text }
                      : reply
                  ),
                }
                : comment
            );

          if (job._id === jobId) {
            return { ...job, comments: updateComments(job.comments) };
          }

          if (job.repostOf?._id === jobId) {
            return {
              ...job,
              repostOf: {
                ...job.repostOf,
                comments: updateComments(job.repostOf.comments),
              },
            };
          }

          return job;
        })
      );
      showToast("Reply updated");
      return;
    }

    try {
      const res = await API.patch(
        `/jobs/${jobId}/comments/${commentId}/replies/${replyId}`,
        { text }
      );
      replaceJobInState(res.data);
      showToast("Reply updated");
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to edit reply", "error");
    }
  };

  const handleReplyDelete = async (jobId, commentId, replyId) => {
    if (isFakeJobId(jobId)) {
      setJobs((prevJobs) =>
        prevJobs.map((job) => {
          const updateComments = (comments = []) =>
            comments.map((comment) =>
              comment._id?.toString() === commentId
                ? {
                  ...comment,
                  replies: (comment.replies || []).filter(
                    (reply) => reply._id?.toString() !== replyId
                  ),
                }
                : comment
            );

          if (job._id === jobId) {
            return { ...job, comments: updateComments(job.comments) };
          }

          if (job.repostOf?._id === jobId) {
            return {
              ...job,
              repostOf: {
                ...job.repostOf,
                comments: updateComments(job.repostOf.comments),
              },
            };
          }

          return job;
        })
      );
      showToast("Reply deleted");
      return;
    }

    try {
      const res = await API.delete(
        `/jobs/${jobId}/comments/${commentId}/replies/${replyId}`
      );
      replaceJobInState(res.data);
      showToast("Reply deleted");
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to delete reply", "error");
    }
  };

  const handleReplyLike = async (jobId, commentId, replyId) => {
    if (isFakeJobId(jobId)) {
      setJobs((prevJobs) =>
        prevJobs.map((job) => {
          const updateComments = (comments = []) =>
            comments.map((comment) =>
              comment._id?.toString() === commentId
                ? {
                  ...comment,
                  replies: (comment.replies || []).map((reply) => {
                    if (reply._id?.toString() !== replyId) return reply;

                    const nextLikes = (reply.likes || []).includes(currentUserId)
                      ? reply.likes.filter((id) => id !== currentUserId)
                      : [...(reply.likes || []), currentUserId];

                    return {
                      ...reply,
                      likes: nextLikes,
                    };
                  }),
                }
                : comment
            );

          if (job._id === jobId) {
            return { ...job, comments: updateComments(job.comments) };
          }

          if (job.repostOf?._id === jobId) {
            return {
              ...job,
              repostOf: {
                ...job.repostOf,
                comments: updateComments(job.repostOf.comments),
              },
            };
          }

          return job;
        })
      );
      return;
    }

    try {
      const res = await API.patch(
        `/jobs/${jobId}/comments/${commentId}/replies/${replyId}/like`
      );
      replaceJobInState(res.data);
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to like reply", "error");
    }
  };

  const handleRepost = async (jobData) => {
    const sourceJobId = (jobData?.repostOf?._id || jobData?._id)?.toString();

    if (isFakeJobId(sourceJobId)) {
      setJobs((prevJobs) =>
        prevJobs.map((job) => {
          if (job._id?.toString() !== sourceJobId) {
            return job;
          }

          const nextReposts = (job.reposts || []).includes(currentUserId)
            ? job.reposts.filter((id) => id !== currentUserId)
            : [...(job.reposts || []), currentUserId];

          return {
            ...job,
            reposts: nextReposts,
          };
        })
      );
      return;
    }

    const clickedRepostCardId = jobData?.repostOf ? jobData?._id?.toString() : null;
    const currentReposts = jobData?.repostOf?.reposts || jobData?.reposts || [];
    const isRemovingRepost = currentReposts.some(
      (id) => id?.toString() === currentUserId
    );

    setJobs((prevJobs) =>
      prevJobs
        .map((job) => {
          if (job._id?.toString() === sourceJobId) {
            const nextReposts = isRemovingRepost
              ? (job.reposts || []).filter((id) => id?.toString() !== currentUserId)
              : [...(job.reposts || []), currentUserId];

            return {
              ...job,
              reposts: nextReposts,
            };
          }

          if (job.repostOf?._id?.toString() === sourceJobId) {
            if (job.postedBy?._id?.toString() === currentUserId && isRemovingRepost) {
              return null;
            }

            const nextReposts = isRemovingRepost
              ? (job.repostOf?.reposts || []).filter(
                (id) => id?.toString() !== currentUserId
              )
              : [...(job.repostOf?.reposts || []), currentUserId];

            return {
              ...job,
              repostOf: {
                ...job.repostOf,
                reposts: nextReposts,
              },
            };
          }

          return job;
        })
        .filter((job) => job && job._id?.toString() !== clickedRepostCardId)
    );

    try {
      const res = await API.patch(`/jobs/${sourceJobId}/repost`);
      const normalizedJob = normalizeJobForList(res.data, currentUser);
      const normalizedJobId = normalizedJob?._id?.toString();
      const hasCurrentUserRepost = (normalizedJob.reposts || []).some(
        (id) => id?.toString() === currentUserId
      );

      setJobs((prevJobs) =>
        prevJobs
          .map((job) => {
            if (job._id?.toString() === normalizedJobId) {
              return normalizedJob;
            }

            if (job.repostOf?._id?.toString() === normalizedJobId) {
              if (
                job.postedBy?._id?.toString() === currentUserId &&
                !hasCurrentUserRepost
              ) {
                return null;
              }

              return {
                ...job,
                repostOf: normalizedJob,
              };
            }

            return job;
          })
          .filter((job) => job)
      );
    } catch (err) {
      await fetchJobs();
      showToast(err.response?.data?.message || "Unable to repost", "error");
    }
  };

  const handleShare = async (job) => {
    if (isFakeJobId(job._id)) {
      const shareText = `${job.title}\n${window.location.origin}/dashboard`;

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        showToast("Demo post copied");
      }

      return;
    }

    try {
      const res = await API.patch(`/jobs/${job._id}/share`);
      replaceJobInState(res.data);

      const shareText = `${job.title}\n${window.location.origin}/dashboard`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: "HireHub post",
            text: shareText,
          });
        } catch (shareError) {
          // user may cancel native share; notification/share state is already updated
        }
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        showToast("Post text copied");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to share post", "error");
    }
  };

  const notificationParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const targetPostId = notificationParams.get("post") || "";
  const targetCommentId = notificationParams.get("comment") || "";
  const targetReplyId = notificationParams.get("reply") || "";
  const isNotificationPostView = Boolean(targetPostId);

  const filteredJobs = jobs.filter((job) => {
    const sourceJobId = (job.repostOf?._id || job._id)?.toString();

    if (targetPostId && sourceJobId !== targetPostId) {
      return false;
    }

    if (!job.postedBy?._id) {
      return false;
    }

    const value = search.toLowerCase();

    return (
      job.title.toLowerCase().includes(value) ||
      job.company.toLowerCase().includes(value) ||
      job.postedBy?.name?.toLowerCase().includes(value)
    );
  });

  const handleSearch = async (value) => {
    setSearch(value);

    if (!value.trim()) {
      setUsers([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const userRes = await API.get(`/users/search?search=${value}`);
      setUsers(userRes.data);
    } catch (err) {
      console.log(err);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleFollow = async (userId) => {
    try {
      const res = await API.patch(`/users/${userId}/follow`, {});
      setFollowing(res.data.following || []);
      const isNowFollowing = (res.data.following || []).includes(userId);
      showToast(isNowFollowing ? "User followed" : "User unfollowed");
      fetchSuggestedUsers();
    } catch (err) {
      showToast(err.response?.data?.message || "Follow failed", "error");
      console.error(err);
    }
  };

  const nextPage = () => {
    navigate("/dashboard");
  }

  const handleMessageUser = (userId) => {
    if (!userId) return;
    navigate(`/messages/${userId}`);
  };
  return (
    <div className="dashboard-page">
      {toast ? (
        <div className={`app-toast app-toast-${toast.type}`}>
          {toast.message}
        </div>
      ) : null}

      {/* Navbar */}
      <AppTopbar
        onBrandClick={nextPage}
        search={search}
        onSearchChange={handleSearch}
        users={users}
        isSearching={isSearching}
        currentUserId={currentUserId}
        currentUser={currentUser}
        followingIds={following}
        onToggleFollow={toggleFollow}
        onUserSelect={(userId) => navigate(`/profile/${userId}`)}
        onLogout={handleLogout}
      />

      {/* Add job */}
      <div className="dashboard-main">
        <div className="dashboard-container">

          {!isNotificationPostView ? (
            <DashboardProfileCard
              currentUser={currentUser}
              currentUserName={currentUserName}
              currentUserDescription={currentUserDescription}
              followerCount={followerCount}
              followingCount={followingCount}
              renderAvatar={renderAvatar}
              onOpenProfile={handleOpenProfile}
            />
          ) : null}
          <div className="dashboard-center-column">

            {!isNotificationPostView ? (
              editJob ? (
                <AddJob
                  editJob={editJob}
                  onUpdate={handleUpdate}
                  currentUser={currentUser}
                  onOpenProfile={handleOpenProfile}
                />
              ) : (
                <AddJob
                  onCreateJob={handleCreateJob}
                  onJobAdded={handleJobAdded}
                  currentUser={currentUser}
                  onOpenProfile={handleOpenProfile}
                />
              )
            ) : null}

            <div className="jobList-flex dashboard-new-posts-card">
              {isLoading ? (
                <div className="dashboard-skeleton-list">
                  <div className="dashboard-skeleton-card" />
                  <div className="dashboard-skeleton-card" />
                </div>
              ) : isNotificationPostView && filteredJobs.length === 0 ? (
                <div className="dashboard-empty">This post is unavailable</div>
              ) : jobs.length === 0 ? (
                <div className="dashboard-empty">No posts available</div>
              ) : (
                filteredJobs.map((job) => (
                  <DashboardPostCard
                    key={job._id}
                    job={job}
                    currentUser={currentUser}
                    currentUserId={currentUserId}
                    now={now}
                    renderAvatar={renderAvatar}
                    getRelativePostTime={getRelativePostTime}
                    onOpenProfile={handleOpenProfile}
                    onEdit={setEditJob}
                    onDelete={handleDelete}
                    onLike={handleLike}
                    onComment={handleComment}
                    onCommentEdit={handleCommentEdit}
                    onCommentDelete={handleCommentDelete}
                    onCommentLike={handleCommentLike}
                    onCommentReply={handleCommentReply}
                    onReplyEdit={handleReplyEdit}
                    onReplyDelete={handleReplyDelete}
	                    onReplyLike={handleReplyLike}
	                    onRepost={handleRepost}
	                    onShare={handleShare}
	                    onMessageUser={handleMessageUser}
	                    onToggleFollow={toggleFollow}
	                    followingIds={following}
                      forceOpenComments={Boolean(targetCommentId || targetReplyId)}
                      highlightedCommentId={targetCommentId}
                      highlightedReplyId={targetReplyId}
	                  />
                ))
              )}
            </div>
          </div>

          {!isNotificationPostView ? (
            <div className="dashboard-right-column">
              <div className="jobList-flex dashboard-suggestions-card">
                <div className="dashboard-section-header">
                  <div>
                    <h2>Suggested People</h2>
                    <p>Discover new members you may want to connect with.</p>
                  </div>
                </div>
                {suggestedUsers.length === 0 ? (
                  <div className="dashboard-empty">No new people to suggest right now</div>
                ) : (
                  suggestedUsers.map((person) => (
                    <div key={`suggested-${person._id}`} className="suggested-user-item">
                      <button
                        type="button"
                        className="suggested-user-profile"
                        onClick={() => handleOpenProfile(person._id)}
                      >
                        {renderAvatar(
                          person.name || "Unknown",
                          person.profileImage,
                          "search-dropdown-avatar"
                        )}
                        <div className="suggested-user-copy">
                          <div className="suggested-user-name">{person.name || "Unknown"}</div>
                          <div className="suggested-user-meta">
                            {person.role || person.jobTitle || "New HireHub member"}
                          </div>
                        </div>
                      </button>
                      <div className="suggested-user-actions">
                        <button
                          type="button"
                          className="suggested-follow-btn"
                          onClick={() => toggleFollow(person._id)}
                        >
                          {following.includes(person._id) ? "Following" : "Follow"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div> 
    </div>
  );
};

export default Dashboard;
