import {
  Building2, 
  MessageSquareMore,
  Pencil,
  UserPlus,
  UserRoundCheck,
} from "lucide-react";
import ProfileConnectionsStats from "./ProfileConnectionsStats";

const ProfileHeroCard = ({
  user,
  currentUserId,
  following,
  renderAvatar,
  onToggleFollow,
  onMessage,
  onOpenFollowers,
  onOpenFollowing,
  onCoverImageChange,
  onEditProfileClick,
  onProfileImagePreview,
}) => (
  <div className="profile-hero">
    <div
      className="profile-cover"
      style={user.coverImage ? { backgroundImage: `url(${user.coverImage})` } : undefined}
    >
      {currentUserId === user._id ? (
        <label className="profile-cover-edit" htmlFor="profile-cover-input">
          <Pencil />
          <input
            id="profile-cover-input"
            type="file"
            accept="image/*"
            onChange={onCoverImageChange}
          />
        </label>
      ) : null}
    </div>
    <div className="profile-hero-body">
      <div className="profile-avatar-wrap">
        <div className="profile-flex">
          <button
            type="button"
            className="profile-avatar-button"
            onClick={onProfileImagePreview}
            aria-label="View profile photo"
          >
            {renderAvatar(
              user.name,
              user.profileImage,
              user.profileImage ? "profile-avatar" : "profile-avatar profile-avatar-fallback"
            )}
          </button>

          <ProfileConnectionsStats
            followerCount={user.followerCount}
            followingCount={user.followingCount}
            onOpenFollowers={onOpenFollowers}
            onOpenFollowing={onOpenFollowing}
          />
        </div>

        <div className="profile-msg ">
          {currentUserId === user._id ? (
            <button
              type="button"
              className="edit-Btn profile-action-btn profile-action-secondary"
              onClick={onEditProfileClick}
              aria-label="Edit profile"
            >
              <span><Pencil /></span>
            </button>
          ) : null}
          {currentUserId && currentUserId !== user._id ? (
            <>
              <button className="edit-Btn profile-action-btn profile-action-primary" onClick={onToggleFollow}>
                {following.includes(user._id) ? <UserRoundCheck size={18} /> : <UserPlus size={18} />}
                {/* {following.includes(user._id) ? "Following" : "Follow"} */}
              </button>
              <button className="edit-Btn profile-action-btn profile-action-secondary" onClick={onMessage}>
                <MessageSquareMore size={18} /> 
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="profile-hero-content">
        <div className="profile-hero-grid">
          <div className="profile-intro">
            <div className="profile-heading-row">
              <div className="profile-name">
                <h1>{user.name}</h1>
              </div>
              <p>{user.role || "Professional profile"}</p>
            </div>

            <div className="profile-identity-line">
              {user.company ? (
                <span className="profile-identity-chip">
                  <Building2 size={15} />
                  {user.company}
                </span>
              ) : null}
              {user.location ? (
                <span className="profile-identity-chip"> 
                  {user.location}
                </span>
              ) : null}
            </div>
          </div>

          <div className="profile-sidecard">
            <div className="profile-sidecard-icon">
              <Building2 size={18} />
            </div>
            <div className="profile-sidecard-copy">
              <strong>{user.company || "HireHub member"}</strong>
              <span>{user.role || "Professional profile"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ProfileHeroCard;
