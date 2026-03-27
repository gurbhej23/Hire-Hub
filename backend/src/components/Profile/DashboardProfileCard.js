const DashboardProfileCard = ({
  currentUser,
  currentUserName,
  currentUserDescription,
  followerCount,
  followingCount,
  onOpenFollowers,
  onOpenFollowing,
  renderAvatar,
  onOpenProfile,
}) => (
  <div className="nav-profile-card">
    <div className="dashboard-profile-copy">
      <div className="dashboard-profile-about">
        <div className="profile-count-strip">{currentUser && (
          <div className="navbar-profile-card">
            <button
              type="button"
              className="navbar-profile-button"
              onClick={() => onOpenProfile(currentUser._id)}
            >
              {renderAvatar(
                currentUserName,
                currentUser.profileImage,
                "navbar-profile-avatar"
              )}
            </button>
          </div>
        )}
          <button
            type="button"
            className="profile-count-card"
            onClick={onOpenFollowers}
          >
            <span className="profile-count-number">{followerCount || 0}</span>
            <span className="profile-count-label">followers</span>
          </button>
          <button
            type="button"
            className="profile-count-card"
            onClick={onOpenFollowing}
          >
            <span className="profile-count-number">{followingCount || 0}</span>
            <span className="profile-count-label">following</span>
          </button>
        </div>
        <h1>{currentUserName}</h1>
        <p className="navbar-profile-description">
          {currentUser?.role || "HireHub member"}
        </p>
        <span className="dashboard-profile-about-label">About</span>
        <p className="profile-about">{currentUserDescription}</p>
      </div>
    </div>
  </div>
);

export default DashboardProfileCard;
