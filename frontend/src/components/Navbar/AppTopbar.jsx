import { useEffect, useRef, useState } from "react";
import API from "../../services/api";
import { Search } from "lucide-react";
import Navbar from "./Navbar";
import { renderAvatar } from "../../utils/userHelpers";

const AppTopbar = ({
  onBrandClick,
  search,
  onSearchChange,
  users = [],
  isSearching = false,
  currentUserId = "",
  currentUser = null,
  followingIds = [],
  onToggleFollow,
  onUserSelect,
  onLogout,
  searchPlaceholder = "Search jobs or users...",
}) => {
  const [resolvedCurrentUser, setResolvedCurrentUser] = useState(currentUser);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const mobileSearchRef = useRef(null);

  useEffect(() => {
    setResolvedCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    if (currentUser || !currentUserId) return undefined;

    let isMounted = true;

    const fetchCurrentUser = async () => {
      try {
        const res = await API.get(`/users/${currentUserId}`);

        if (isMounted) {
          setResolvedCurrentUser(res.data || null);
        }
      } catch (error) {
        if (isMounted) {
          setResolvedCurrentUser(null);
        }
      }
    };

    fetchCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [currentUser, currentUserId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }

      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target)) {
        setIsMobileSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
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

        <div className="mobile-search-menu" ref={mobileSearchRef}>
          <button
            type="button"
            className="mobile-search-trigger"
            onClick={() => setIsMobileSearchOpen((prev) => !prev)}
            aria-label="Open search"
          >
            <Search size={18} />
          </button>
          {isMobileSearchOpen ? (
            <div className="mobile-search-dropdown">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                autoFocus
              />
              {search.trim() ? (
                <div className="search-dropdown mobile-search-results">
                  {isSearching ? (
                    <div className="search-dropdown-empty">Searching...</div>
                  ) : users.length === 0 ? (
                    <div className="search-dropdown-empty">No person found</div>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user._id}
                        className="search-dropdown-item"
                        onClick={() => {
                          setIsMobileSearchOpen(false);
                          onUserSelect(user._id);
                        }}
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
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mobile-profile-menu" ref={profileMenuRef}>
          <button
            type="button"
            className="mobile-profile-trigger"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
          >
            {renderAvatar(
              resolvedCurrentUser?.name || "You",
              resolvedCurrentUser?.profileImage,
              "mobile-profile-avatar"
            )}
          </button>
          {isProfileMenuOpen ? (
            <div className="mobile-profile-dropdown">
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onLogout();
                }}
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AppTopbar;
