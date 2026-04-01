import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Check,
  CheckCheck,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  X,
} from "lucide-react";
import API from "../../services/api";
import "../Dashboard/dashboard.css";
import AppTopbar from "../Navbar/AppTopbar";
import { connectSocket, getSocket } from "../../services/socket";
import { logoutUser } from "../../utils/session";
import { getCurrentUserId, renderAvatar } from "../../utils/userHelpers";
import "./messages.css";

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

const isUserOnline = (user) => {
  if (!user) return false;
  if (user.isOnline) return true;
  if (!user.lastSeen) return false;

  const timestamp = new Date(user.lastSeen).getTime();
  if (Number.isNaN(timestamp)) return false;

  return Date.now() - timestamp <= ONLINE_WINDOW_MS;
};

const formatRelativeTime = (value, now) => {
  if (!value) return "";
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) return "";

  const diffMs = Math.max(now - timestamp, 0);
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes === 1) return "1m ago";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return "1h ago";
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1d ago";
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(value).toLocaleDateString();
};

const formatPresenceText = (user, now, isTyping = false) => {
  if (isTyping) {
    return "Typing...";
  }

  if (!user?.lastSeen && !user?.isOnline) return "Last seen unavailable";

  if (isUserOnline(user)) {
    return "Active now";
  }

  return `Last seen ${formatRelativeTime(user.lastSeen, now)}`;
};

const formatMessageTimestamp = (value, now = Date.now()) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const currentDate = new Date(now);
  const startOfToday = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate()
  );
  const startOfMessageDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfMessageDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (dayDiff === 0) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (dayDiff === 1) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
};

const formatBubbleTimestamp = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMessageDayLabel = (value, now = Date.now()) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const currentDate = new Date(now);
  const startOfToday = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate()
  );
  const startOfMessageDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfMessageDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year:
      date.getFullYear() === currentDate.getFullYear() ? undefined : "numeric",
  });
};

const getMessageDeliveryState = (message, selectedUser) => {
  if (message.read) return "seen";
  if (message.delivered || isUserOnline(selectedUser)) return "delivered";
  return "sent";
};

const Messages = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentUserId = getCurrentUserId();
  const [following, setFollowing] = useState([]);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [now, setNow] = useState(Date.now());
  const [typingUserId, setTypingUserId] = useState("");
  const [openMenuId, setOpenMenuId] = useState("");
  const [editingMessageId, setEditingMessageId] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState("");
  const typingTimeoutRef = useRef(null);
  const menuRef = useRef(null);
  const composerInputRef = useRef(null);
  const messagesListRef = useRef(null);

  const syncConversationWithMessages = useCallback(
    (targetUserId, nextMessages) => {
      if (!targetUserId) return;

      setConversations((prev) =>
        prev
          .map((conversation) => {
            if (conversation.user?._id !== targetUserId) {
              return conversation;
            }

            const lastMessage = nextMessages[nextMessages.length - 1];

            return {
              ...conversation,
              lastMessage: lastMessage?.text || "",
              updatedAt:
                lastMessage?.updatedAt ||
                lastMessage?.createdAt ||
                conversation.updatedAt,
            };
          })
          .filter(
            (conversation) =>
              conversation.user?._id !== targetUserId || Boolean(conversation.lastMessage)
          )
      );
    },
    []
  );

  const upsertConversation = useCallback(
    (message, otherUserOverride = null) => {
      const senderId = message.sender?._id;
      const recipientId = message.recipient?._id;
      const otherUserId = senderId === currentUserId ? recipientId : senderId;

      if (!otherUserId) return;

      const otherUser =
        otherUserOverride ||
        (senderId === currentUserId ? message.recipient : message.sender);

      setConversations((prev) => {
        const filtered = prev.filter(
          (conversation) => conversation.user?._id !== otherUserId
        );
        const hasUnread = senderId !== currentUserId && otherUserId !== userId;

        return [
          {
            user: {
              ...(filtered.find(
                (conversation) => conversation.user?._id === otherUserId
              )?.user || {}),
              ...(otherUser || {}),
            },
            lastMessage: message.text,
            updatedAt: message.updatedAt || message.createdAt,
            hasUnread,
          },
          ...filtered,
        ];
      });
    },
    [currentUserId, userId]
  );

  const fetchConversations = async () => {
    try {
      const res = await API.get("/messages");
      setConversations(res.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchConversation = async (targetUserId) => {
    if (!targetUserId) {
      setSelectedUser(null);
      setMessages([]);
      return;
    }

    try {
      const res = await API.get(`/messages/${targetUserId}`);
      setSelectedUser(res.data.user);
      setMessages(res.data.messages || []);
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.user._id === targetUserId
            ? { ...conversation, hasUnread: false }
            : conversation
        )
      );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    fetchConversation(userId);
    setOpenMenuId("");
    setEditingMessageId("");
    setText("");
  }, [userId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const socket = connectSocket();

    if (!socket) return undefined;

    const handleIncomingMessage = (message) => {
      upsertConversation(message);

      const otherUserId =
        message.sender?._id === currentUserId
          ? message.recipient?._id
          : message.sender?._id;

      if (otherUserId === userId) {
        setMessages((prev) => {
          const existingIndex = prev.findIndex(
            (existingMessage) => existingMessage._id === message._id
          );

          if (existingIndex >= 0) {
            return prev.map((existingMessage) =>
              existingMessage._id === message._id ? message : existingMessage
            );
          }

          const isIncomingForOpenChat =
            message.sender?._id === userId &&
            message.recipient?._id === currentUserId;

          if (isIncomingForOpenChat) {
            getSocket()?.emit("message:read", { messageId: message._id });
          }

          return [...prev, message];
        });
      }
    };

    const handlePresenceUpdate = ({
      userId: changedUserId,
      isOnline,
      lastSeen,
    }) => {
      setSelectedUser((prev) =>
        prev && prev._id === changedUserId ? { ...prev, isOnline, lastSeen } : prev
      );

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.user?._id === changedUserId
            ? {
              ...conversation,
              user: {
                ...conversation.user,
                isOnline,
                lastSeen,
              },
            }
            : conversation
        )
      );
    };

    const handleTyping = ({ userId: typingFromUserId, isTyping }) => {
      if (typingFromUserId !== userId) return;
      setTypingUserId(isTyping ? typingFromUserId : "");
    };

    const handleDeletedMessage = ({ messageId, senderId, recipientId }) => {
      const targetConversationUserId =
        senderId === currentUserId ? recipientId : senderId;

      if (targetConversationUserId !== userId) return;

      setMessages((prev) => {
        const nextMessages = prev.filter((message) => message._id !== messageId);
        syncConversationWithMessages(userId, nextMessages);
        return nextMessages;
      });

      if (editingMessageId === messageId) {
        handleCancelEdit();
      }
    };

    socket.on("message:new", handleIncomingMessage);
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("message:typing", handleTyping);
    socket.on("message:delete", handleDeletedMessage);

    return () => {
      socket.off("message:new", handleIncomingMessage);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("message:typing", handleTyping);
      socket.off("message:delete", handleDeletedMessage);
    };
  }, [currentUserId, editingMessageId, syncConversationWithMessages, upsertConversation, userId]);

  useEffect(() => {
    if (typingUserId && typingUserId !== userId) {
      setTypingUserId("");
    }
  }, [typingUserId, userId]);

  useEffect(() => () => clearTimeout(typingTimeoutRef.current), []);

  useEffect(() => {
    if (!messagesListRef.current) return;

    messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
  }, [messages, typingUserId, userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (editingMessageId && composerInputRef.current) {
      composerInputRef.current.focus();
      composerInputRef.current.select();
    }
  }, [editingMessageId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!userId || !text.trim()) return;

    if (editingMessageId) {
      await handleEditMessage(editingMessageId);
      return;
    }

    try {
      const res = await API.post(`/messages/${userId}`, { text });
      setMessages((prev) => {
        const exists = prev.some((message) => message._id === res.data._id);

        if (exists) {
          return prev.map((message) =>
            message._id === res.data._id ? res.data : message
          );
        }

        return [...prev, res.data];
      });
      upsertConversation(res.data, selectedUser);
      setText("");
      const socket = getSocket();
      socket?.emit("message:typing", { recipientId: userId, isTyping: false });
    } catch (error) {
      alert(error.response?.data?.message || "Message send failed");
    }
  };

  const handleSearch = async (value) => {
    setSearch(value);

    if (!value.trim()) {
      setUsers([]);
      return;
    }

    try {
      const userRes = await API.get(`/users/search?search=${value}`);
      setUsers(userRes.data);
    } catch (err) {
      console.log(err);
    }
  };

  const toggleFollow = async (targetUserId) => {
    try {
      const res = await API.patch(`/users/${targetUserId}/follow`, {});
      setFollowing(res.data.following || []);
    } catch (err) {
      alert(err.response?.data?.message || "Follow failed");
      console.error(err);
    }
  };

  const handleLogout = () => {
    logoutUser(navigate);
  };

  const handleStartEdit = (message) => {
    setEditingMessageId(message._id);
    setText(message.text);
    setOpenMenuId("");
  };

  const handleCancelEdit = () => {
    setEditingMessageId("");
    setText("");
  };

  const handleOpenDeleteConfirm = (messageId) => {
    setDeleteTargetId(messageId);
    setOpenMenuId("");
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteTargetId("");
  };

  const handleEditMessage = async (messageId) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    try {
      const res = await API.patch(`/messages/item/${messageId}`, {
        text: trimmedText,
      });

      setMessages((prev) => {
        const nextMessages = prev.map((message) =>
          message._id === messageId ? res.data : message
        );
        syncConversationWithMessages(userId, nextMessages);
        return nextMessages;
      });

      handleCancelEdit();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to update message");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await API.delete(`/messages/item/${messageId}`);

      setMessages((prev) => {
        const nextMessages = prev.filter((message) => message._id !== messageId);
        syncConversationWithMessages(userId, nextMessages);
        return nextMessages;
      });

      setOpenMenuId("");
      handleCloseDeleteConfirm();

      if (editingMessageId === messageId) {
        handleCancelEdit();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Unable to delete message");
    }
  };

  const nextPage = () => {
    navigate("/dashboard");
  };

  return (
    <div className="dashboard-page messages-page">
      <AppTopbar
        onBrandClick={nextPage}
        search={search}
        onSearchChange={handleSearch}
        users={users}
        currentUserId={currentUserId}
        currentUser={null}
        followingIds={following}
        onToggleFollow={toggleFollow}
        onUserSelect={(targetUserId) => navigate(`/profile/${targetUserId}`)}
        onLogout={handleLogout}
      />
      <div className={`messages-shell ${userId ? "has-selected-conversation" : ""}`}>
        <aside className="messages-sidebar">
          <div className="messages-sidebar-header">Messages</div>
	          {conversations.length ? (
	            conversations.map((conversation) => (
	              <div
	                key={conversation.user._id}
	                className={`messages-thread ${conversation.user._id === userId ? "is-active" : ""
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
	            ))
	          ) : (
            <div className="messages-empty">No conversations yet.</div>
          )}
        </aside>

        <section className="messages-panel">
          {selectedUser ? (
            <>
              <div className="messages-panel-header">
                <button
                  className="messages-back-button"
                  onClick={() => navigate("/messages")}
                  aria-label="Back to conversations"
                >
                  ←
                </button>
                <div className="messages-user-presence">
                  {renderAvatar(selectedUser.name, selectedUser.profileImage, "messages-avatar")}
                  <span
                    className={`messages-status-dot ${isUserOnline(selectedUser) ? "is-online" : ""
                      }`}
                  />
                </div>
                <div className="active-shell">
                  <div className="messages-thread-name">{selectedUser.name}</div>
                  <div className="messages-thread-text messages-status-text">
                    {formatPresenceText(selectedUser, now, typingUserId === selectedUser._id)}
                  </div>
                </div>
              </div>

              <div className="messages-list" ref={messagesListRef}>
                {messages.length ? (
                  messages.map((message, index) => {
                    const isOwn = message.sender?._id !== selectedUser._id;
                    const deliveryState = getMessageDeliveryState(message, selectedUser);
                    const isEditing = editingMessageId === message._id;
                    const previousMessage = messages[index - 1];
                    const currentDayLabel = formatMessageDayLabel(message.createdAt, now);
                    const previousDayLabel = formatMessageDayLabel(
                      previousMessage?.createdAt,
                      now
                    );
                    const shouldShowDayLabel = currentDayLabel !== previousDayLabel;

                    return (
                      <div
                        key={message._id}
                        className={`message-group ${isOwn ? "is-own" : ""}`}
                      >
                        {shouldShowDayLabel ? (
                          <div className="messages-day-separator">
                            <span>{currentDayLabel}</span>
                          </div>
                        ) : null}
                        <div className={`message-bubble ${isOwn ? "is-own" : ""}`}>
                          {isOwn ? (
                            <div
                              className="message-bubble-menu-shell"
                              ref={openMenuId === message._id ? menuRef : null}
                            >
                              <button
                                type="button"
                                className="message-menu-trigger"
                                aria-label="Message options"
                                onClick={() =>
                                  setOpenMenuId((prev) =>
                                    prev === message._id ? "" : message._id
                                  )
                                }
                              >
                                <MoreHorizontal size={16} />
                              </button>
                              {openMenuId === message._id ? (
                                <div className="message-menu">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(message)}
                                  >
                                    <Pencil size={14} />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="is-danger"
                                    onClick={() => handleOpenDeleteConfirm(message._id)}
                                  >
                                    <Trash2 size={14} />
                                    Delete
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          ) : null}

                          {isEditing ? null : (
                            <>
                              <div className="message-text">{message.text}</div>
                              <div className={`message-meta-row ${isOwn ? "is-own" : ""}`}>
                                {message.edited ? (
                                  <span className="message-edited">Edited</span>
                                ) : null}
                                <span className="message-time">
                                  {formatBubbleTimestamp(message.createdAt)}
                                </span>
                                {isOwn ? (
                                  <span
                                    className={`message-status is-${deliveryState}`}
                                    aria-label={`Message ${deliveryState}`}
                                  >
                                    {deliveryState === "sent" ? <Check size={14} /> : null}
                                    {deliveryState === "delivered" ? (
                                      <CheckCheck size={14} />
                                    ) : null}
                                    {deliveryState === "seen" ? <CheckCheck size={14} /> : null}
                                  </span>
                                ) : null}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="messages-empty">Start the conversation.</div>
                )}
                {typingUserId === selectedUser._id ? (
                  <div className="message-typing-bubble" aria-label="Typing">
                    Typing...
                  </div>
                ) : null}
              </div>

              <form className="messages-form" onSubmit={handleSendMessage}>
                {editingMessageId ? (
                  <div className="messages-edit-banner">
                    <div className="messages-edit-copy">Editing message</div>
                    <button type="button" onClick={handleCancelEdit} aria-label="Cancel edit">
                      <X size={16} />
                    </button>
                  </div>
                ) : null}
                <input
                  ref={composerInputRef}
                  type="text"
                  placeholder={editingMessageId ? "Edit message" : `Message ${selectedUser.name}`}
                  value={text}
                  onChange={(e) => {
                    const value = e.target.value;
                    setText(value);

                    const socket = getSocket();
                    if (!socket || !selectedUser?._id) return;

                    const isTyping = Boolean(value.trim());
                    socket.emit("message:typing", {
                      recipientId: selectedUser._id,
                      isTyping,
                    });

                    clearTimeout(typingTimeoutRef.current);

                    if (isTyping) {
                      typingTimeoutRef.current = setTimeout(() => {
                        socket.emit("message:typing", {
                          recipientId: selectedUser._id,
                          isTyping: false,
                        });
                      }, 1200);
                    }
                  }}
                />
                <button type="submit">
                  <Send />
                </button>
              </form>
            </>
          ) : (
            <div className="messages-placeholder">
              Select a person to start messaging.
            </div>
          )}
        </section>
      </div>
      {deleteTargetId ? (
        <div
          className="message-delete-modal-backdrop"
          onClick={handleCloseDeleteConfirm}
        >
          <div
            className="message-delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="message-delete-title">Delete message?</div>
            <div className="message-delete-copy">
              Are you sure you want to delete this message?
            </div>
            <div className="message-delete-actions">
              <button type="button" onClick={handleCloseDeleteConfirm}>
                Cancel
              </button>
              <button
                type="button"
                className="is-danger"
                onClick={() => handleDeleteMessage(deleteTargetId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Messages;
