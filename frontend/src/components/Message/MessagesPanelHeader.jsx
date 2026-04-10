import { ChevronLeft } from "lucide-react";

const MessagesPanelHeader = ({
  selectedUser,
  now,
  typingUserId,
  navigate,
  renderAvatar,
  isUserOnline,
  formatPresenceText,
}) => (
  <div className="messages-panel-header">
    <button
      className="messages-back-button"
      onClick={() => navigate("/messages")}
      aria-label="Back to conversations"
    >
      <ChevronLeft />
    </button>
    <div className="messages-user-presence">
      {renderAvatar(
        selectedUser.name,
        selectedUser.profileImage,
        "messages-avatar",
      )}
      <span
        className={`messages-status-dot ${
          isUserOnline(selectedUser) ? "is-online" : ""
        }`}
      />
    </div>
    <div className="active-shell">
      <div className="messages-thread-name">{selectedUser.name}</div>
      <div className="messages-thread-text messages-status-text">
        {formatPresenceText(
          selectedUser,
          now,
          typingUserId === selectedUser._id,
        )}
      </div>
    </div>
  </div>
);

export default MessagesPanelHeader;
