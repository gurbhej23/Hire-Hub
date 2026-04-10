const MessagesDeleteModal = ({ deleteTargetId, onClose, onDelete }) =>
  deleteTargetId ? (
    <div className="message-delete-modal-backdrop" onClick={onClose}>
      <div className="message-delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="message-delete-title">Delete message?</div>
        <div className="message-delete-copy">
          Are you sure you want to delete this message?
        </div>
        <div className="message-delete-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="is-danger"
            onClick={() => onDelete(deleteTargetId)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  ) : null;

export default MessagesDeleteModal;
