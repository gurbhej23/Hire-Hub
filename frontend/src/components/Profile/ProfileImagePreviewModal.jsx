import { X } from "lucide-react";

const ProfileImagePreviewModal = ({
  user,
  getInitials,
  onClose,
}) => (
  <div
    className="profile-modal-backdrop profile-image-backdrop"
    onClick={onClose}
  >
    <div
      className="profile-image-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="profile-image-close"
        onClick={onClose}
      >
        <X />
      </button>
      {user.profileImage ? (
        <img
          src={user.profileImage}
          alt={user.name || "Profile"}
          className="profile-image-preview-large"
        />
      ) : (
        <div className="profile-image-preview-large profile-avatar-fallback">
          {getInitials(user.name || "User")}
        </div>
      )}
    </div>
  </div>
);

export default ProfileImagePreviewModal;
