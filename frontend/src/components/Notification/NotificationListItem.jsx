import { MoreHorizontal } from "lucide-react";

const NotificationListItem = ({
  notification,
  now,
  activeMenuId,
  menuRef,
  renderAvatar,
  getRelativePostTime,
  onOpenNotification,
  onToggleMenu,
  onDeleteNotification,
  onViewProfile,
}) => (
  <div
    className={`notification-page-card ${notification.read ? "is-read" : ""}`}
  >
    <button
      type="button"
      className="notification-page-main"
      onClick={() => onOpenNotification(notification)}
    >
      {renderAvatar(
        notification.actor?.name || "Someone",
        notification.actor?.profileImage,
        "notification-page-avatar"
      )}
      <div className="notification-page-copy">
        <div className="notification-page-topline">
          <span className="notification-page-name">
            {notification.actor?.name || "Someone"}
          </span>
          <span className="notification-page-time">
            {getRelativePostTime(notification.createdAt, now)}
          </span>
        </div>
        <div className="notification-page-message">{notification.message}</div>
      </div>
    </button>

    <div className="notification-page-menu-wrap">
      <button
        type="button"
        className="notification-page-menu-btn"
        onClick={() => onToggleMenu(notification._id)}
      >
        <MoreHorizontal size={18} />
      </button>
      {activeMenuId === notification._id ? (
        <div
          className="notification-page-menu"
          ref={activeMenuId === notification._id ? menuRef : null}
        >
          <button
            type="button"
            onClick={() => onDeleteNotification(notification._id)}
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => onViewProfile(notification.actor?._id)}
            disabled={!notification.actor?._id}
          >
            View profile
          </button>
        </div>
      ) : null}
    </div>
  </div>
);

export default NotificationListItem;
