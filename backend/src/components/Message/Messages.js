import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../services/api";
import "../Dashboard/dashboard.css"
import AppTopbar from "../Navbar/AppTopbar";
import { connectSocket, getSocket } from "../../services/socket";
import { logoutUser } from "../../utils/session";
import { getCurrentUserId, renderAvatar } from "../../utils/userHelpers";
import { Send } from "lucide-react"
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

const formatMessageTimestamp = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString([], {
    dateStyle: "medium",  
    timeStyle: "short",
  });
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
  const typingTimeoutRef = useRef(null);

  const upsertConversation = useCallback((message, otherUserOverride = null) => {
    const senderId = message.sender?._id;
    const recipientId = message.recipient?._id;
    const otherUserId = senderId === currentUserId ? recipientId : senderId;

    if (!otherUserId) return;

    const otherUser =
      otherUserOverride ||
      (senderId === currentUserId ? message.recipient : message.sender);

    setConversations((prev) => {
      const filtered = prev.filter((conversation) => conversation.user?._id !== otherUserId);
      const hasUnread = senderId !== currentUserId && otherUserId !== userId;

      return [
        {
          user: {
            ...(filtered.find((conversation) => conversation.user?._id === otherUserId)?.user || {}),
            ...(otherUser || {}),
          },
          lastMessage: message.text,
          updatedAt: message.createdAt,
          hasUnread,
        },
        ...filtered,
      ];
    });
  }, [currentUserId, userId]);

  // const getCurrentUserId = () => {
  //   const token = localStorage.getItem("token");

  //   if (!token) return "";

  //   try {
  //     const payloadPart = token.split(".")[1];
  //     const normalizedPayload = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
  //     const payload = JSON.parse(atob(normalizedPayload));
  //     return payload.userId || "";
  //   } catch (error) {
  //     return "";
  //   }
  // };
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
        message.sender?._id === currentUserId ? message.recipient?._id : message.sender?._id;

      if (otherUserId === userId) {
        setMessages((prev) => {
          if (prev.some((existingMessage) => existingMessage._id === message._id)) {
            return prev;
          }

          return [...prev, message];
        });
      }
    };

    const handlePresenceUpdate = ({ userId: changedUserId, isOnline, lastSeen }) => {
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

    socket.on("message:new", handleIncomingMessage);
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("message:typing", handleTyping);

    return () => {
      socket.off("message:new", handleIncomingMessage);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("message:typing", handleTyping);
    };
  }, [currentUserId, upsertConversation, userId]);

  useEffect(() => {
    if (typingUserId && typingUserId !== userId) {
      setTypingUserId("");
    }
  }, [typingUserId, userId]);

  useEffect(() => () => clearTimeout(typingTimeoutRef.current), []);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!userId || !text.trim()) return;

    try {
      const res = await API.post(`/messages/${userId}`, { text });
      setMessages((prev) => [...prev, res.data]);
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

  const toggleFollow = async (userId) => {
    try {
      const res = await API.patch(`/users/${userId}/follow`, {});
      setFollowing(res.data.following || []);
    } catch (err) {
      alert(err.response?.data?.message || "Follow failed");
      console.error(err);
    }
  };

  const handleLogout = () => {
    logoutUser(navigate);
  };

  // const currentUserId = getCurrentUserId();

  // useEffect(() => {
  //   const fetchData = async () => {
  //     const [profileRes, currentUserRes] = await Promise.all([
  //       API.get(`/users/${id}`),
  //       currentUserId ? API.get(`/users/${currentUserId}`) : Promise.resolve(null),
  //     ]);

  //     setUser(profileRes.data);
  //     setFollowing(currentUserRes?.data?.following || []);
  //   };

  //   fetchData();
  // }, [id, currentUserId]);

  const nextPage = () => {
    navigate("/dashboard");
  };

  return (
    <div className="messages-page">
      <AppTopbar
        onBrandClick={nextPage}
        search={search}
        onSearchChange={handleSearch}
        users={users}
        currentUserId={currentUserId}
        followingIds={following}
        onToggleFollow={toggleFollow}
        onUserSelect={(userId) => navigate(`/profile/${userId}`)}
        onLogout={handleLogout}
      />
      <div className={`messages-shell ${userId ? 'has-selected-conversation' : ''}`}>
        <aside className="messages-sidebar">
          <div className="messages-sidebar-header">Messages</div>
          {conversations.length ? (
            conversations.map((conversation) => (
              <button
                type="button"
                key={conversation.user._id}
                className={`messages-thread ${conversation.user._id === userId ? "is-active" : ""} ${conversation.hasUnread ? "is-unread" : ""}`}
                onClick={() => navigate(`/messages/${conversation.user._id}`)}
              >
                {renderAvatar(
                  conversation.user.name,
                  conversation.user.profileImage,
                  "messages-avatar"
                )}
                <div className="messages-thread-copy">
                  <div className="messages-thread-row">
                    <div className="messages-thread-name">{conversation.user.name}</div>
                    <div className="messages-thread-time">
                      {formatMessageTimestamp (conversation.updatedAt)}
                    </div>
                  </div >
                  <div className="messages-thread-text">{conversation.lastMessage}</div>
                </div>
              </button>
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
                  onClick={() => navigate('/messages')}
                  aria-label="Back to conversations"
                >
                  ←
                </button>
                <div className="messages-user-presence">
                  {renderAvatar(selectedUser.name, selectedUser.profileImage, "messages-avatar")}
                  <span
                    className={`messages-status-dot ${
                      isUserOnline(selectedUser) ? "is-online" : ""
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

              <div className="messages-list">
                {messages.length ? (
                  messages.map((message) => {
                    const isOwn = message.sender?._id === selectedUser._id ? false : true;

                    return (
                      <div
                        key={message._id}
                        className={`message-bubble ${isOwn ? "is-own" : ""}`}
                      >
                        <div className="message-text">{message.text}</div>
                        <div className={`message-time ${isOwn ? "is-own" : ""}`}>
                          {formatMessageTimestamp(message.createdAt)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="messages-empty">Start the conversation.</div>
                )}
              </div>

              <form className="messages-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder={`Message ${selectedUser.name}`}
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
                <button type="submit"><Send /></button>
              </form>
            </>
          ) : (
            <div className="messages-placeholder">
              Select a person to start messaging.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Messages;
