import { X } from "lucide-react";

const ProfileConnectionsModal = ({
  connectionsTitle,
  connections,
  renderAvatar,
  onClose,
  onOpenProfile,
}) => (
  <div className="profile-modal-backdrop" onClick={onClose}>
    <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
      <div className="profile-modal-header">
        <h2>{connectionsTitle}</h2>
        <button
          type="button"
          className="profile-modal-close"
          onClick={onClose}
        >
          <X />
        </button>
      </div>
      <div className="profile-modal-list">
        {connections.length ? (
          connections.map((person) => (
            <button
              type="button"
              key={person._id}
              className="profile-modal-item"
              onClick={() => onOpenProfile(person._id)}
            >
              {renderAvatar(
                person.name,
                person.profileImage,
                "search-dropdown-avatar"
              )}
              <div className="profile-modal-copy">
                <div className="profile-modal-name">{person.name}</div>
                <div className="profile-modal-role">
                  {person.role || "HireHub member"}
                  {person.company ? ` - ${person.company}` : ""}
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="profile-modal-empty">No users found.</div>
        )}
      </div>
    </div>
  </div>
);

export default ProfileConnectionsModal;
