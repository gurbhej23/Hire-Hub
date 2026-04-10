const DashboardSuggestedPeople = ({
  suggestedUsers,
  following,
  renderAvatar,
  onOpenProfile,
  onToggleFollow,
}) => (
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
            onClick={() => onOpenProfile(person._id)}
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
              onClick={() => onToggleFollow(person._id)}
            >
              {following.includes(person._id) ? "Following" : "Follow"}
            </button>
          </div>
        </div>
      ))
    )}
  </div>
);

export default DashboardSuggestedPeople;
