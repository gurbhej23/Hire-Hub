import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../services/api";
import "../Dashboard/dashboard.css";
import "./profile.css";
import AppTopbar from "../Navbar/AppTopbar";
import ProfileHeroCard from "./ProfileHeroCard";
import DashboardPostCard from "../Dashboard/DashboardPostCard";
import ImageCropModal from "../Profile Img crop/ImageCropModal";
import {
  getCurrentUserId,
  getInitials,
  getRelativePostTime,
  renderAvatar,
} from "../../utils/userHelpers";
import { logoutUser } from "../../utils/session";

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [following, setFollowing] = useState([]);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const [connectionsTitle, setConnectionsTitle] = useState("");
  const [connections, setConnections] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [pendingCoverImage, setPendingCoverImage] = useState(null);
  const [pendingProfileImage, setPendingProfileImage] = useState(null);
  const [profileDraft, setProfileDraft] = useState({
    name: "",
    role: "",
    location: "",
    bio: "",
    profileImage: "",
  });
  const [profileFormOpen, setProfileFormOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const currentUserId = getCurrentUserId();

  useEffect(() => {
    const fetchData = async () => {
      const [profileRes, currentUserRes] = await Promise.all([
        API.get(`/users/${id}`),
        currentUserId ? API.get(`/users/${currentUserId}`) : Promise.resolve(null),
      ]);

      setUser(profileRes.data);
      setProfileDraft({
        name: profileRes.data.name || "",
        role: profileRes.data.role || "",
        location: profileRes.data.location || "",
        bio: profileRes.data.bio || "",
        profileImage: profileRes.data.profileImage || "",
      });
      setFollowing(currentUserRes?.data?.following || []);
    };

    fetchData();
  }, [id, currentUserId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  if (!user) return <p>Loading...</p>;

  const aboutText =
    user.bio ||
    user.jobs?.find((job) => job.description?.trim())?.description ||
    "No bio added yet.";

  const handleLogout = () => {
    logoutUser(navigate);
  };

  const handleToggleFollow = async () => {
    try {
      const res = await API.patch(`/users/${id}/follow`, {});
      const isCurrentlyFollowing = following.includes(id);
      setFollowing(res.data.following || []);
      setUser((prevUser) =>
        prevUser
          ? {
            ...prevUser,
            followerCount: isCurrentlyFollowing
              ? Math.max((prevUser.followerCount || 1) - 1, 0)
              : (prevUser.followerCount || 0) + 1,
          }
          : prevUser
      );
    } catch (err) {
      alert(err.response?.data?.message || "Follow failed");
    }
  };

  const handleSearch = async (value) => {
    setSearch(value);

    if (!value.trim()) {
      setUsers([]);
      return;
    }

    try {
      const userRes = await API.get(`/users/search?search=${value}`);
      setUsers(userRes.data);
    } catch (err) {
      console.log(err);
    }
  };

  const toggleFollow = async (userId) => {
    try {
      const res = await API.patch(`/users/${userId}/follow`, {});
      setFollowing(res.data.following || []);
    } catch (err) {
      alert(err.response?.data?.message || "Follow failed");
      console.error(err);
    }
  };

  const nextPage = () => {
    navigate("/dashboard");
  };

  const openConnections = async (type) => {
    try {
      const res = await API.get(`/users/${id}/${type}`);
      setConnections(res.data || []);
      setConnectionsTitle(type === "followers" ? "Followers" : "Following");
      setConnectionsOpen(true);
    } catch (err) {
      alert(err.response?.data?.message || "Unable to load list");
    }
  };

  const handleCoverImageChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file");
      return;
    }

    setPendingCoverImage(file);
    event.target.value = "";
  };

  const handleOpenProfileForm = () => {
    setProfileDraft({
      name: user?.name || "",
      role: user?.role || "",
      location: user?.location || "",
      bio: user?.bio || "",
      profileImage: user?.profileImage || "",
    });
    setProfileFormOpen(true);
  };

  const handleProfileDraftChange = (event) => {
    const { name, value } = event.target;
    setProfileDraft((prevDraft) => ({
      ...prevDraft,
      [name]: value,
    }));
  };

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file");
      return;
    }

    setPendingProfileImage(file);
    event.target.value = "";
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      const res = await API.patch(`/users/${user._id}/profile`, profileDraft);
      setUser((prevUser) =>
        prevUser
          ? {
              ...prevUser,
              ...res.data.user,
            }
          : prevUser
      );
      setProfileFormOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || "Unable to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const profilePosts = (user.jobs || []).map((job) => ({
    ...job,
    postedBy:
      job.postedBy && typeof job.postedBy === "object" && job.postedBy._id
        ? job.postedBy
        : {
            _id: user._id,
            name: user.name,
            profileImage: user.profileImage || "",
          },
  }));

  return (
    <div className="dashboard-page profile-page">
      {pendingCoverImage ? (
        <ImageCropModal
          file={pendingCoverImage}
          aspectRatio={16 / 6}
          title="Crop cover image"
          outputWidth={1600}
          outputHeight={600}
          confirmLabel="Use cover"
          onCancel={() => setPendingCoverImage(null)}
          onConfirm={async (coverImage) => {
            try {
              await API.patch(`/users/${user._id}/cover-image`, { coverImage });
              setUser((prevUser) =>
                prevUser
                  ? {
                      ...prevUser,
                      coverImage,
                    }
                  : prevUser
              );
              setPendingCoverImage(null);
            } catch (err) {
              alert(err.response?.data?.message || "Unable to update cover image");
            }
          }}
        />
      ) : null}
      {pendingProfileImage ? (
        <ImageCropModal
          file={pendingProfileImage}
          aspectRatio={1}
          title="Crop profile photo"
          outputWidth={500}
          outputHeight={500}
          confirmLabel="Use photo"
          onCancel={() => setPendingProfileImage(null)}
          onConfirm={(profileImage) => {
            setProfileDraft((prevDraft) => ({
              ...prevDraft,
              profileImage,
            }));
            setPendingProfileImage(null);
          }}
        />
      ) : null}
      {profileFormOpen && !pendingProfileImage ? (
        <div className="profile-modal-backdrop" onClick={() => setProfileFormOpen(false)}>
          <div className="profile-modal profile-about-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2>Edit Profile</h2> 
            </div>
            <div className="profile-about-editor">
              <div className="profile-photo-editor">
                {profileDraft.profileImage ? (
                  <img
                    src={profileDraft.profileImage}
                    alt={profileDraft.name || "Profile"}
                    className="profile-photo-preview"
                  />
                ) : (
                  <div className="profile-photo-preview profile-avatar-fallback">
                    {getInitials(profileDraft.name || "User")}
                  </div>
                )}
                <label className="profile-photo-upload">
                  Change profile photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                  />
                </label>
              </div>
              <label className="profile-field">
                <span>Name</span>
                <input
                  type="text"
                  name="name"
                  className="profile-about-input"
                  value={profileDraft.name}
                  onChange={handleProfileDraftChange}
                  placeholder="Your full name"
                />
              </label>
              <label className="profile-field">
                <span>Professional profile</span>
                <input
                  type="text"
                  name="role"
                  className="profile-about-input"
                  value={profileDraft.role}
                  onChange={handleProfileDraftChange}
                  placeholder="Frontend Developer"
                />
              </label>
              <label className="profile-field">
                <span>City</span>
                <input
                  type="text"
                  name="location"
                  className="profile-about-input"
                  value={profileDraft.location}
                  onChange={handleProfileDraftChange}
                  placeholder="Jaipur"
                />
              </label>
              <label className="profile-field">
                <span>About</span>
              <textarea
                className="profile-about-textarea"
                name="bio"
                value={profileDraft.bio}
                onChange={handleProfileDraftChange}
                placeholder="Write something about yourself..."
                rows={7}
              />
              </label>
              <div className="profile-about-actions">
                <button
                  type="button"
                  className="profile-about-cancel"
                  onClick={() => setProfileFormOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="profile-about-save"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <AppTopbar
        onBrandClick={nextPage}
        search={search}
        onSearchChange={handleSearch}
        users={users}
        currentUserId={currentUserId}
        followingIds={following}
        onToggleFollow={toggleFollow}
        onUserSelect={(userId) => navigate(`/profile/${userId}`)}
        onLogout={handleLogout}
      />
      <div className="profile-shell">
        {/* <span className="profile-badge">Profile</span> */}
        <ProfileHeroCard
          user={user}
          currentUserId={currentUserId}
          following={following}
          renderAvatar={renderAvatar}
          onToggleFollow={handleToggleFollow}
          onMessage={() => navigate(`/messages/${user._id}`)}
          onOpenFollowers={() => openConnections("followers")}
          onOpenFollowing={() => openConnections("following")}
          onCoverImageChange={handleCoverImageChange}
          onEditProfileClick={handleOpenProfileForm}
        />

        <div className="profile-grid">
          <div className="profile-card">
            <h2>About</h2>
            <div className="profile-job-item">
              <p>{aboutText}</p>
            </div>
          </div>

          <div className="profile-card"> 
            {profilePosts.length ? (
              <div className="profile-job-list">
                {profilePosts.map((job) => (
                  <DashboardPostCard
                    key={job._id}
                    job={job}
                    currentUser={user}
                    currentUserId={currentUserId}
                    now={now}
                    renderAvatar={renderAvatar}
                    getRelativePostTime={getRelativePostTime}
                    onOpenProfile={(userId) => navigate(`/profile/${userId}`)}
                    showOwnerActions={false}
                  />
                ))}
              </div>
            ) : (
              <p>No jobs posted yet.</p>
            )}
          </div>

        </div>
      </div>
      {connectionsOpen ? (
        <div className="profile-modal-backdrop" onClick={() => setConnectionsOpen(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2>{connectionsTitle}</h2>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => setConnectionsOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="profile-modal-list">
              {connections.length ? (
                connections.map((person) => (
                  <button
                    type="button"
                    key={person._id}
                    className="profile-modal-item"
                    onClick={() => {
                      setConnectionsOpen(false);
                      navigate(`/profile/${person._id}`);
                    }}
                  >
                    {renderAvatar(person.name, person.profileImage, "search-dropdown-avatar")}
                    <div className="profile-modal-copy">
                      <div className="profile-modal-name">{person.name}</div>
                      <div className="profile-modal-role">
                        {person.role || "HireHub member"}
                        {person.company ? ` - ${person.company}` : ""}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="profile-modal-empty">No users found.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Profile;
