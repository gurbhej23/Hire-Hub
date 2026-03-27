import Navbar from "./Navbar";
import { renderAvatar } from "../../utils/userHelpers";

const AppTopbar = ({
  onBrandClick,
  search,
  onSearchChange,
  users = [],
  isSearching = false,
  currentUserId = "",
  followingIds = [],
  onToggleFollow,
  onUserSelect,
  onLogout,
  searchPlaceholder = "Search jobs or users...",
}) => (
  <div className="navbar">
    <div className="dashboard-brand">
      <button className="dashboard-badge" onClick={onBrandClick}>HireHub</button>
    </div>
    <Navbar />
    <div className="dashboard-toolbar">
      <div className="search-dropdown-wrapper">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />

        {search.trim() ? (
          <div className="search-dropdown">
            {isSearching ? (
              <div className="search-dropdown-empty">Searching...</div>
            ) : users.length === 0 ? (
              <div className="search-dropdown-empty">No person found</div>
            ) : (
              users.map((user) => (
                <div
                  key={user._id}
                  className="search-dropdown-item"
                  onClick={() => onUserSelect(user._id)}
                >
                  {renderAvatar(
                    user.name,
                    user.profileImage,
                    "search-dropdown-avatar"
                  )}
                  <div className="search-dropdown-content">
                    <div className="search-dropdown-name">{user.name}</div>
                    <div className="search-dropdown-role">
                      {user.jobTitle || user.role || "No job added"}
                      {user.company ? ` - ${user.company}` : ""}
                    </div>
                  </div>
                  {user._id !== currentUserId && onToggleFollow ? (
                    <button
                      type="button"
                      className="search-follow-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleFollow(user._id);
                      }}
                    >
                      {followingIds.includes(user._id) ? "Following" : "Follow"}
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>

      <button className="logout-btn" onClick={onLogout}>
        Logout
      </button>
    </div>
  </div>
);

export default AppTopbar;
