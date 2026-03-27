import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./navbar.css";
import { getCurrentUserId } from "../../utils/userHelpers";
import {
  House, UserRound, BriefcaseBusiness, MessageSquareMore, Bell, Menu
} from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const [people, setPeople] = useState([]);
  const [peopleError, setPeopleError] = useState("");
  const [isPeopleLoading, setIsPeopleLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPeopleOpen, setIsPeopleOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const peoplePanelRef = useRef(null);
  const notificationPanelRef = useRef(null);
  const messagePanelRef = useRef(null);

  const currentUserId = getCurrentUserId();

  const nextPage = () => {
    window.location.href = "/dashboard";
  };

  const openMessages = () => {
    navigate("/messages");
  };

  const openProfile = () => {
    if (!currentUserId) return;
    navigate(`/profile/${currentUserId}`);
  };

  const fetchConversations = async () => {
    try {
      const res = await API.get("/messages");
      setConversations(res.data || []);
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

  const fetchUnreadMessages = async () => {
    try {
      const res = await API.get("/messages/unread-count");
      setUnreadMessageCount(res.data.unreadCount || 0);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchPeople = async () => {
    try {
      setIsPeopleLoading(true);
      setPeopleError("");
      const res = await fetch("https://dummyjson.com/users?limit=6");

      if (!res.ok) {
        throw new Error("Unable to load people");
      }

      const data = await res.json();
      setPeople(data.users || []);
    } catch (error) {
      console.log(error);
      setPeopleError("Unable to load people right now");
    } finally {
      setIsPeopleLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchConversations();
    fetchUnreadMessages();
    const intervalId = setInterval(() => {
      fetchNotifications();
      fetchConversations();
      fetchUnreadMessages();
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (peoplePanelRef.current && !peoplePanelRef.current.contains(event.target)) {
        setIsPeopleOpen(false);
      }

      if (
        notificationPanelRef.current &&
        !notificationPanelRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }

      if (messagePanelRef.current && !messagePanelRef.current.contains(event.target)) {
        setIsMessageOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = async (notification) => {
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

      if (notification.link) {
        navigate(notification.link);
      }

      setIsNotificationOpen(false);
      setIsMenuOpen(false);
    } catch (error) {
      console.log(error);
    }
  };

  const handleConversationClick = async (conversation) => {
    try {
      navigate(`/messages/${conversation.user?._id}`);
      setIsMessageOpen(false);
      setIsMenuOpen(false);
      await fetchUnreadMessages();
      await fetchConversations();
    } catch (error) {
      console.log(error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await API.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      await API.delete("/notifications");
      setNotifications([]);
      setUnreadCount(0);
      setIsNotificationOpen(false);
    } catch (error) {
      console.log(error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handlePeopleToggle = async () => {
    const nextOpen = !isPeopleOpen;
    setIsPeopleOpen(nextOpen);
    setIsMessageOpen(false);
    setIsNotificationOpen(false);

    if (nextOpen && people.length === 0 && !isPeopleLoading) {
      await fetchPeople();
    }
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="Navbar-List">
      <button
        type="button"
        className="menu"
        onClick={toggleMenu}
        aria-expanded={isMenuOpen}
        aria-controls="menu"
      >
        <Menu />
      </button>
      <ul id="menu" className={isMenuOpen ? "is-open" : ""}>
        <li>
          <button onClick={() => { nextPage(); closeMenu(); }}>
            <House />
          </button>
        </li>
        <li className="notification-item" ref={peoplePanelRef}>
          <button
            type="button"
            onClick={handlePeopleToggle}
            aria-label="Open people"
            title="People"
          >
            <BriefcaseBusiness />
          </button>
          {isPeopleOpen ? (
            <div className="notification-panel people-panel">
              <div className="notification-header">
                <span>People</span>
              </div>
              <div className="notification-list">
                {isPeopleLoading ? (
                  <div className="notification-empty">Loading people...</div>
                ) : peopleError ? (
                  <div className="notification-empty">{peopleError}</div>
                ) : people.length ? (
                  people.map((person) => (
                    <button
                      type="button"
                      key={person.id}
                      className="notification-card people-card"
                      onClick={() => {
                        setIsPeopleOpen(false);
                        closeMenu();
                      }}
                    >
                      <img
                        src={person.image}
                        alt={`${person.firstName} ${person.lastName}`}
                        className="people-avatar"
                      />
                      <div className="people-copy">
                        <div className="notification-title">
                          {person.firstName} {person.lastName}
                        </div>
                        <div className="notification-message">
                          {person.company?.title || person.company?.department || "Professional"}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="notification-empty">No people found</div>
                )}
              </div>
            </div>
          ) : null}
        </li>
        <li className="notification-item" ref={messagePanelRef}>
          <button
            type="button"
            onClick={() => {
              setIsMessageOpen((prev) => !prev);
              setIsPeopleOpen(false);
              setIsNotificationOpen(false);
            }}
          >
            <MessageSquareMore />
            {unreadMessageCount > 0 ? (
              <span className="notification-badge">{unreadMessageCount}</span>
            ) : null}
          </button>
          {isMessageOpen ? (
            <div className="notification-panel">
              <div className="notification-header">
                <span>Messages</span>
                <button
                  type="button"
                  className="notification-mark-all"
                  onClick={() => {
                    openMessages();
                    closeMenu();
                    setIsMessageOpen(false);
                  }}
                >
                  Open inbox
                </button>
              </div>
              <div className="notification-list">
                {conversations.length ? (
                  conversations.map((conversation) => (
                    <button
                      type="button"
                      key={conversation.user?._id}
                      className={`notification-card ${conversation.hasUnread ? "" : "is-read"}`}
                      onClick={() => handleConversationClick(conversation)}
                    >
                      <div className="notification-title">
                        {conversation.user?.name || "User"}
                      </div>
                      <div className="notification-message">
                        {conversation.lastMessage || "Open conversation"}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="notification-empty">No messages yet</div>
                )}
              </div>
            </div>
          ) : null}
        </li>
        <li className="notification-item" ref={notificationPanelRef}>
          <button
            type="button"
            onClick={() => {
              setIsNotificationOpen((prev) => !prev);
              setIsPeopleOpen(false);
              setIsMessageOpen(false);
            }}
          >
            <Bell />
            {unreadCount > 0 ? (
              <span className="notification-badge">{unreadCount}</span>
            ) : null}
          </button>
          {isNotificationOpen ? (
            <div className="notification-panel">
              <div className="notification-header">
                <span>Notifications</span>
              </div>
              <div className="notification-list">
                {notifications.length ? (
                  notifications.map((notification) => (
                    <button
                      type="button"
                      key={notification._id}
                      className={`notification-card ${notification.read ? "is-read" : ""}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="notification-title">
                        {notification.actor?.name || "Someone"}
                      </div>
                      <div className="notification-message">{notification.message}</div>

                      {notifications.length ? (
                        <div className="notification-header-actions">
                          <button
                            type="button"
                            className="notification-delete-all"
                            onClick={handleDeleteAllNotifications}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}</button>
                  ))
                ) : (
                  <div className="notification-empty">No notifications yet</div>
                )}
              </div>
            </div>
          ) : null}
        </li>
        <li>
          <button
            type="button"
            onClick={() => {
              openProfile();
              closeMenu();
            }}
            aria-label="Open profile"
            title="Profile"
          >
            <UserRound />
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Navbar;
