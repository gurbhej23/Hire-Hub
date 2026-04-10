import DashboardPostCard from "../Dashboard/DashboardPostCard";

const ProfilePostsSection = ({
  profilePosts,
  user,
  viewer,
  currentUserId,
  now,
  renderAvatar,
  getRelativePostTime,
  onOpenProfile,
  onOpenPost = () => {},
  followingIds = [],
  onToggleFollow = () => {},
  onMessageUser = () => {},
  repostLookup = {},
}) => (
  <div className="profile-card">
    {profilePosts.length ? (
      <div className="profile-job-list">
        {profilePosts.map((job) => (
          <DashboardPostCard
            key={job._id}
            job={job}
            currentUser={viewer || user}
            currentUserId={currentUserId}
            now={now}
            renderAvatar={renderAvatar}
            getRelativePostTime={getRelativePostTime}
            onOpenProfile={onOpenProfile}
            onToggleFollow={onToggleFollow}
            onMessageUser={onMessageUser}
            followingIds={followingIds}
            repostTargetId={repostLookup[(job.repostOf?._id || job._id)?.toString()] || ""}
            onOpenPost={onOpenPost}
            showOwnerActions={false}
          />
        ))}
      </div>
    ) : (
      <p>No jobs posted yet.</p>
    )}
  </div>
);

export default ProfilePostsSection;
