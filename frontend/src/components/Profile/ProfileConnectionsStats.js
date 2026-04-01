const ProfileConnectionsStats = ({
  followerCount,
  followingCount,
  onOpenFollowers,
  onOpenFollowing,
}) => (
  <div className="profile-count-strip">
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
);

export default ProfileConnectionsStats;
