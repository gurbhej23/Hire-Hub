const ProfileEditModal = ({
  profileDraft,
  getInitials,
  onClose,
  onProfileImageChange,
  onProfileDraftChange,
  onSaveProfile,
  isSavingProfile,
}) => (
  <div className="profile-modal-backdrop" onClick={onClose}>
    <div
      className="profile-modal profile-about-modal"
      onClick={(e) => e.stopPropagation()}
    >
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
              onChange={onProfileImageChange}
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
            onChange={onProfileDraftChange}
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
            onChange={onProfileDraftChange}
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
            onChange={onProfileDraftChange}
            placeholder="Jaipur"
          />
        </label>
        <label className="profile-field">
          <span>About</span>
          <textarea
            className="profile-about-textarea"
            name="bio"
            value={profileDraft.bio}
            onChange={onProfileDraftChange}
            placeholder="Write something about yourself..."
            rows={7}
          />
        </label>
        <div className="profile-about-actions">
          <button
            type="button"
            className="profile-about-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="profile-about-save"
            onClick={onSaveProfile}
            disabled={isSavingProfile}
          >
            {isSavingProfile ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default ProfileEditModal;
