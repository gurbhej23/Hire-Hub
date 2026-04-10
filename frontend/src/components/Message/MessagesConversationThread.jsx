const MessagesConversationThread = ({
  conversation,
  userId,
  now,
  navigate,
  renderAvatar,
  formatMessageTimestamp,
}) => (
  <div
    className={`messages-thread ${
      conversation.user._id === userId ? "is-active" : ""
    } ${conversation.hasUnread ? "is-unread" : ""}`}
  >
    <button
      type="button"
      className="messages-avatar-button"
      onClick={() => navigate(`/profile/${conversation.user._id}`)}
    >
      {renderAvatar(
        conversation.user.name,
        conversation.user.profileImage,
        "messages-avatar"
      )}
    </button>
    <button
      type="button"
      className="messages-thread-main"
      onClick={() => navigate(`/messages/${conversation.user._id}`)}
    >
      <div className="messages-thread-copy">
        <div className="messages-thread-row">
          <div className="messages-thread-name">{conversation.user.name}</div>
          <div className="messages-thread-time">
            {formatMessageTimestamp(conversation.updatedAt, now)}
          </div>
        </div>
        <div className="messages-thread-text">{conversation.lastMessage}</div>
      </div>
    </button>
  </div>
);

export default MessagesConversationThread;
