import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "../Dashboard/dashboard.css";
import AppTopbar from "../Navbar/AppTopbar";
import NotificationListItem from "./NotificationListItem";
import NotificationsHeader from "./NotificationsHeader";
import { logoutUser } from "../../utils/session";
import { getCurrentUserId, getRelativePostTime, renderAvatar } from "../../utils/userHelpers";
import "./notifications.css";

const getNotificationTargetLink = (notification) => {
  const directLink = notification?.link || "";

  if (directLink.includes("post=")) {
    return directLink;
  }

  if (
    notification?.entityId &&
    ["post_like", "post_comment", "post_repost"].includes(notification.type)
  ) {
    return `/dashboard?post=${notification.entityId}`;
  }

  return directLink || "/dashboard";
};

const Notifications = () => {
  const navigate = useNavigate();
  const currentUserId = getCurrentUserId();
  const [currentUser, setCurrentUser] = useState(null);
  const [following, setFollowing] = useState([]);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [activeMenuId, setActiveMenuId] = useState("");
  const [toast, setToast] = useState("");
  const menuRef = useRef(null);

  const fetchCurrentUser = async () => {
    if (!currentUserId) return;

    try {
      const res = await API.get(`/users/${currentUserId}`);
      setCurrentUser(res.data || null);
      setFollowing(res.data?.following || []);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchNotifications();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;

    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (value) => {
    setSearch(value);

    if (!value.trim()) {
      setUsers([]);
      return;
    }

    try {
      setIsSearching(true);
      const userRes = await API.get(`/users/search?search=${value}`);
      setUsers(userRes.data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleFollow = async (userId) => {
    try {
      const res = await API.patch(`/users/${userId}/follow`, {});
      setFollowing(res.data.following || []);
    } catch (error) {
      console.log(error);
    }
  };

  const handleLogout = () => {
    logoutUser(navigate);
  };

  const handleOpenNotification = async (notification) => {
    try {
      if (!notification.read) {
        await API.patch(`/notifications/${notification._id}/read`);
        setNotifications((prev) =>
          prev.map((item) =>
            item._id === notification._id ? { ...item, read: true } : item
          )
        );
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }

      navigate(getNotificationTargetLink(notification));
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await API.delete(`/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((item) => item._id !== notificationId));
      setUnreadCount((prev) => {
        const notification = notifications.find((item) => item._id === notificationId);
        return notification?.read ? prev : Math.max(prev - 1, 0);
      });
      setActiveMenuId("");
      setToast("Notification deleted");
    } catch (error) {
      setToast(error.response?.data?.message || "Unable to delete notification");
    }
  };
 
  const handleDeleteAllNotifications = async () => {
    try {
      await API.delete("/notifications");
      setNotifications([]);
      setUnreadCount(0);
      setToast("All notifications deleted");
    } catch (error) {
      setToast(error.response?.data?.message || "Unable to delete notifications");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await API.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch (error) {
      setToast(error.response?.data?.message || "Unable to update notifications");
    }
  };

  return (
    <div className="dashboard-page notifications-page">
      {toast ? <div className="app-toast app-toast-success">{toast}</div> : null}
      <AppTopbar
        onBrandClick={() => navigate("/dashboard")}
        search={search}
        onSearchChange={handleSearch}
        users={users}
        isSearching={isSearching}
        currentUserId={currentUserId}
        currentUser={currentUser}
        followingIds={following}
        onToggleFollow={toggleFollow}
        onUserSelect={(userId) => navigate(`/profile/${userId}`)}
        onLogout={handleLogout}
      />
      <div className="notifications-shell">
        <NotificationsHeader
          unreadCount={unreadCount}
          onMarkAllRead={handleMarkAllRead}
          onDeleteAll={handleDeleteAllNotifications}
        />

        <div className="notifications-list">
          {notifications.length ? (
            notifications.map((notification) => (
              <NotificationListItem
                key={notification._id}
                notification={notification}
                now={now}
                activeMenuId={activeMenuId}
                menuRef={menuRef}
                renderAvatar={renderAvatar}
                getRelativePostTime={getRelativePostTime}
                onOpenNotification={handleOpenNotification}
                onToggleMenu={(notificationId) =>
                  setActiveMenuId((prev) =>
                    prev === notificationId ? "" : notificationId
                  )
                }
                onDeleteNotification={handleDeleteNotification}
                onViewProfile={(userId) => navigate(`/profile/${userId}`)}
              />
            ))
          ) : (
            <div className="notifications-empty">No notifications yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
