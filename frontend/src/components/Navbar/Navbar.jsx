import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./navbar.css";
import { getCurrentUserId, renderAvatar } from "../../utils/userHelpers";
import {
  House, UserRound, BriefcaseBusiness, MessageSquareMore, Bell, Menu
} from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const [people, setPeople] = useState([]);
  const [peopleError, setPeopleError] = useState("");
  const [isPeopleLoading, setIsPeopleLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPeopleOpen, setIsPeopleOpen] = useState(false);
  const peoplePanelRef = useRef(null);

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

    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handlePeopleToggle = async () => {
    const nextOpen = !isPeopleOpen;
    setIsPeopleOpen(nextOpen);

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
	        <li className="notification-item">
	          <button
	            type="button"
	            onClick={() => {
	              openMessages();
	              closeMenu();
	              setIsPeopleOpen(false);
	            }}
	          >
	            <MessageSquareMore />
	            {unreadMessageCount > 0 ? (
	              <span className="notification-badge"></span>
	            ) : null}
	          </button>
	        </li>
	        <li className="notification-item">
	          <button
	            type="button"
	            onClick={() => {
	              navigate("/notifications");
	              closeMenu();
	            }}
	          >
	            <Bell />
	            {unreadCount > 0 ? (
	              <span className="notification-badge"></span>
	            ) : null}
	          </button>
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
