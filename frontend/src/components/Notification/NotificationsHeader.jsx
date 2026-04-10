const NotificationsHeader = ({
  unreadCount,
  onMarkAllRead,
  onDeleteAll,
}) => (
  <div className="notifications-header">
    <div>
      <h1>Notifications</h1>
      <p>{unreadCount} unread updates</p>
    </div>
    <div className="notifications-header-actions">
      <button type="button" onClick={onMarkAllRead}>
        Mark all as read
      </button>
      <button type="button" onClick={onDeleteAll}>
        Delete all
      </button>
    </div>
  </div>
);

export default NotificationsHeader;
