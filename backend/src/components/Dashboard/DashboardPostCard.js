import { useState } from "react";

const ActionIcon = ({ children }) => (
  <span className="linkedin-action-icon" aria-hidden="true">
    {children}
  </span>
);

const DashboardPostCard = ({
  job,
  currentUser,
  currentUserId,
  now,
  renderAvatar,
  getRelativePostTime,
  onOpenProfile = () => { },
  onEdit = () => { },
  onDelete = () => { },
  onLike = () => { },
  onComment = () => { },
  onCommentEdit = () => { },
  onCommentDelete = () => { },
  onCommentLike = () => { },
  onCommentReply = () => { },
  onReplyEdit = () => { },
  onReplyDelete = () => { },
  onRepost = () => { },
  onShare = () => { },
  onMessageUser = () => { },
  onToggleFollow = () => { },
  followingIds = [],
  showOwnerActions = true,
}) => {
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [activeCommentMenuId, setActiveCommentMenuId] = useState("");
  const [editingCommentId, setEditingCommentId] = useState("");
  const [editingCommentText, setEditingCommentText] = useState("");
  const [replyCommentId, setReplyCommentId] = useState("");
  const [replyText, setReplyText] = useState("");
  const [activeReplyMenuId, setActiveReplyMenuId] = useState("");
  const [editingReplyId, setEditingReplyId] = useState("");
  const [editingReplyText, setEditingReplyText] = useState("");

  if (!job) return null;

  const displayJob = job.repostOf || job;
  const isRepostCard = Boolean(job.repostOf);
  const actionJob = isRepostCard ? displayJob : job;
  const likeCount = actionJob.likes?.length || 0;
  const commentCount = actionJob.comments?.length || 0;
  const repostCount = actionJob.reposts?.length || 0;
  const isLiked = (actionJob.likes || []).some((id) => id?.toString() === currentUserId);
  const isReposted = (actionJob.reposts || []).some((id) => id?.toString() === currentUserId);

  const submitComment = async () => {
    if (!commentText.trim()) return;
    await onComment(actionJob._id, commentText);
    setCommentText("");
    setIsCommentOpen(true);
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment._id || "");
    setEditingCommentText(comment.text || "");
    setActiveCommentMenuId("");
  };

  const submitCommentEdit = async (commentId) => {
    if (!editingCommentText.trim()) return;
    await onCommentEdit(actionJob._id, commentId, editingCommentText);
    setEditingCommentId("");
    setEditingCommentText("");
  };

  const submitReply = async (commentId) => {
    if (!replyText.trim()) return;
    await onCommentReply(actionJob._id, commentId, replyText);
    setReplyCommentId("");
    setReplyText("");
  };

  const submitReplyEdit = async (commentId, replyId) => {
    if (!editingReplyText.trim()) return;
    await onReplyEdit(actionJob._id, commentId, replyId, editingReplyText);
    setEditingReplyId("");
    setEditingReplyText("");
  };

  return (
    <div className="job-card">
      {isRepostCard ? (
        <div className="repost-banner">
          {job.postedBy?.name || "Someone"} reposted this
        </div>
      ) : null}
      <div className="job-card-header">
        <button
          type="button"
          className="job-card-profile"
          onClick={() => onOpenProfile(displayJob.postedBy?._id)}
        >
          {renderAvatar(
            displayJob.postedBy?.name || "Unknown",
            displayJob.postedBy?.profileImage,
            "job-card-avatar"
          )}
          <div className="job-card-copy">
            <div className="job-title">{displayJob.postedBy?.name || "Unknown"}</div>
            <div className="job-card-role">
              {displayJob.postedBy?._id?.toString() === currentUserId
                ? currentUser?.role || "HireHub member"
                : "HireHub member"}
            </div>
            <div className="job-card-meta">
              {getRelativePostTime(job.createdAt || job.updatedAt, now)}
            </div>
          </div>
        </button>
        <div className="job-card-tools">
          {showOwnerActions &&
            !isRepostCard &&
            job.postedBy?._id?.toString() === currentUserId ? (
            <>
              <button
                type="button"
                className="job-tool-btn"
                onClick={() => onEdit(job)}
              >
                Edit
              </button>
              <button
                type="button"
                className="job-tool-btn"
                onClick={() => onDelete(job._id)}
              >
                Delete
              </button>
            </>
          ) : null}
        </div>
      </div>
      <div className="job-description-preview">{displayJob.title}</div>
      {displayJob.mediaUrl ? (
        displayJob.mediaType === "video" ? (
          <video
            className="post-media-preview"
            src={displayJob.mediaUrl}
            controls
          />
        ) : (
          <img
            className="post-media-preview"
            src={displayJob.mediaUrl}
            alt="Post media"
          />
        )
      ) : null}
      {likeCount > 0 || commentCount > 0 || repostCount > 0 ? (
        <div className="post-engagement-bar">
          <div className="post-reaction-summary">
            {likeCount > 0 ? (
              <>
                <span className="reaction-dot reaction-like">👍</span>
                <span className="reaction-total">{likeCount}</span>
              </>
            ) : null}
          </div>
          <div className="post-meta-summary">
            {commentCount > 0 ? <span>{commentCount} comments</span> : null}
            {commentCount > 0 && repostCount > 0 ? <span>•</span> : null}
            {repostCount > 0 ? <span>{repostCount} reposts</span> : null}
          </div>
        </div>
      ) : null}
      <div className="linkedin-actions">
        <button type="button" className="linkedin-action-btn" onClick={() => onLike(actionJob._id)}>
          <ActionIcon>
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M14 9V5a3 3 0 0 0-3-3L9 7H5v13h4h7l4-8V9h-6Z"
                fill={isLiked ? "currentColor" : "none"}
              />
            </svg>
          </ActionIcon>
          <span>{isLiked ? `Liked` : `Like`}</span>
        </button>
        <button type="button" className="linkedin-action-btn" onClick={() => setIsCommentOpen((prev) => !prev)}>
          <ActionIcon>
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M4 5h16v10H8l-4 4V5Z" />
            </svg>
          </ActionIcon>
          <span>{`Comment`}</span>
        </button>
        <button type="button" className="linkedin-action-btn" onClick={() => onRepost(job)}>
          <ActionIcon>
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M7 7V3L2 8l5 5V9a6 6 0 0 1 6 6v3h2v-3A8 8 0 0 0 7 7Zm10 4v4a6 6 0 0 1-6 6H9v2h2a8 8 0 0 0 8-8v-4h3l-5-5-5 5h3Z" />
            </svg>
          </ActionIcon>
          <span>{isReposted ? `Reposted` : `Repost`}</span>
        </button>
      </div>
      {isCommentOpen ? (
        <div className="post-comments">
          <div className="post-comment-form">
            {renderAvatar(
              currentUser?.name || "You",
              currentUser?.profileImage,
              "post-comment-avatar"
            )}
            <input
              type="text"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Add a comment..."
            />
            <div className="post-comment-form-actions">
              <button type="button" className="post-comment-emoji-btn" aria-label="Emoji">
                ☺
              </button>
              <button type="button" className="post-comment-submit" onClick={submitComment}>
                Post
              </button>
            </div>
          </div>
          <div className="post-comment-sort">Most relevant</div>
          {(actionJob.comments || []).length ? (
            <div className="post-comment-list">
              {actionJob.comments.map((comment, index) => {
                const commentId = comment._id?.toString() || `${index}`;
                const commentOwnerId = comment.user?._id?.toString() || "";
                const isCommentOwner = commentOwnerId === currentUserId;
                const isSelfCommentUser = !commentOwnerId || commentOwnerId === currentUserId;
                const isCommentLiked = (comment.likes || []).some(
                  (id) => id?.toString() === currentUserId
                );
                const isFollowingCommentUser = followingIds.some(
                  (id) => id?.toString() === commentOwnerId
                );

                return (
                  <div
                    key={`${comment.user?._id || "user"}-${comment.createdAt || index}`}
                    className="post-comment-item"
                  >
                    <button
                      type="button"
                      className="post-comment-profile-btn"
                      onClick={() => onOpenProfile(comment.user?._id)}
                    >
                      {renderAvatar(
                        comment.user?.name || "User",
                        comment.user?.profileImage,
                        "post-comment-user-avatar"
                      )}
                    </button>
                    <div className="post-comment-body">
                      <div className="post-comment-card">
                        <div className="post-comment-top">
                          <button
                            type="button"
                            className="post-comment-name post-comment-name-btn"
                            onClick={() => onOpenProfile(comment.user?._id)}
                          >
                            {comment.user?.name || "User"}
                          </button>
                          <div className="post-comment-menu-wrap">
                            <button
                              type="button"
                              className="post-comment-menu-btn"
                              onClick={() =>
                                setActiveCommentMenuId((prev) =>
                                  prev === commentId ? "" : commentId
                                )
                              }
                            >
                              ...
                            </button>
                            {activeCommentMenuId === commentId ? (
                              <div className="post-comment-menu">
                                {isCommentOwner ? (
                                  <button
                                    type="button"
                                    onClick={() => startEditComment(comment)}
                                  >
                                    Edit
                                  </button>
                                ) : null}
                                {isCommentOwner ||
                                  actionJob.postedBy?._id?.toString() === currentUserId ? (
                                  <button
                                    type="button"
                                    onClick={() => onCommentDelete(actionJob._id, commentId)}
                                  >
                                    Delete
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => onOpenProfile(commentOwnerId)}
                                  disabled={!commentOwnerId}
                                >
                                  Open profile
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onMessageUser(commentOwnerId)}
                                  disabled={isSelfCommentUser}
                                >
                                  Message user
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onToggleFollow(commentOwnerId)}
                                  disabled={isSelfCommentUser}
                                >
                                  {isFollowingCommentUser ? "Unfollow user" : "Follow user"}
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                        {editingCommentId === commentId ? (
                          <div className="post-comment-edit-box">
                            <input
                              type="text"
                              value={editingCommentText}
                              onChange={(event) => setEditingCommentText(event.target.value)}
                            />
                            <div className="post-comment-edit-actions">
                              <button
                                type="button"
                                onClick={() => submitCommentEdit(commentId)}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCommentId("");
                                  setEditingCommentText("");
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="post-comment-text">{comment.text}</div>
                        )}
                      </div>
                      <div className="post-comment-actions">
                        <button
                          type="button"
                          onClick={() => onCommentLike(actionJob._id, commentId)}
                        >
                          {isCommentLiked
                            ? `Liked (${comment.likes?.length || 0})`
                            : `Like (${comment.likes?.length || 0})`}
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() =>
                            setReplyCommentId((prev) => (prev === commentId ? "" : commentId))
                          }
                        >
                          Reply
                        </button>
                      </div>
                      {(comment.replies || []).length ? (
                        <div className="post-reply-list">
                          {comment.replies.map((reply, replyIndex) => (
                            (() => {
                              const replyOwnerId = reply.user?._id?.toString() || "";
                              const isSelfReplyUser =
                                !replyOwnerId || replyOwnerId === currentUserId;
                              const isFollowingReplyUser = followingIds.some(
                                (id) => id?.toString() === replyOwnerId
                              );
                              const replyMenuId = `${commentId}-${replyIndex}`;
                              const replyId = reply._id?.toString() || replyMenuId;
                              const isReplyOwner = replyOwnerId === currentUserId;

                              return (
                                <div
                                  key={`${reply.user?._id || "reply"}-${reply.createdAt || replyIndex}`}
                                  className="post-reply-item"
                                >
                                  {renderAvatar(
                                    reply.user?.name || "User",
                                    reply.user?.profileImage,
                                    "post-reply-avatar"
                                  )}
                                  <div className="post-reply-body">
                                    <div className="post-reply-card">
                                      <div className="post-comment-top">
                                        <button
                                          type="button"
                                          className="post-comment-name post-comment-name-btn"
                                          onClick={() => onOpenProfile(reply.user?._id)}
                                        >
                                          {reply.user?.name || "User"}
                                        </button>
                                        <div className="post-comment-menu-wrap">
                                          <button
                                            type="button"
                                            className="post-comment-menu-btn"
                                            onClick={() =>
                                              setActiveReplyMenuId((prev) =>
                                                prev === replyMenuId ? "" : replyMenuId
                                              )
                                            }
                                          >
                                            ...
                                          </button>
                                          {activeReplyMenuId === replyMenuId ? (
                                            <div className="post-comment-menu">
                                              {isReplyOwner ? (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setEditingReplyId(replyId);
                                                    setEditingReplyText(reply.text || "");
                                                    setActiveReplyMenuId("");
                                                  }}
                                                >
                                                  Edit
                                                </button>
                                              ) : null}
                                              {isReplyOwner ||
                                                commentOwnerId === currentUserId ||
                                                actionJob.postedBy?._id?.toString() === currentUserId ? (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    onReplyDelete(actionJob._id, commentId, replyId)
                                                  }
                                                >
                                                  Delete
                                                </button>
                                              ) : null}
                                              <button
                                                type="button"
                                                onClick={() => onOpenProfile(replyOwnerId)}
                                                disabled={!replyOwnerId}
                                              >
                                                Open profile
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => onMessageUser(replyOwnerId)}
                                                disabled={isSelfReplyUser}
                                              >
                                                Message user
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => onToggleFollow(replyOwnerId)}
                                                disabled={isSelfReplyUser}
                                              >
                                                {isFollowingReplyUser
                                                  ? "Unfollow user"
                                                  : "Follow user"}
                                              </button>
                                            </div>
                                          ) : null}
                                        </div>
                                      </div>
                                      {editingReplyId === replyId ? (
                                        <div className="post-comment-edit-box">
                                          <input
                                            type="text"
                                            value={editingReplyText}
                                            onChange={(event) =>
                                              setEditingReplyText(event.target.value)
                                            }
                                          />
                                          <div className="post-comment-edit-actions">
                                            <button
                                              type="button"
                                              onClick={() => submitReplyEdit(commentId, replyId)}
                                            >
                                              Save
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingReplyId("");
                                                setEditingReplyText("");
                                              }}
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="post-comment-text">{reply.text}</div>
                                      )}
                                    </div>
                                    <div className="post-comment-actions post-reply-actions">
                                      <button
                                        type="button"
                                        onClick={() => setReplyCommentId(commentId)}
                                      >
                                        Reply
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()
                          ))}
                        </div>
                      ) : null}
                      {replyCommentId === commentId ? (
                        <div className="post-reply-form">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(event) => setReplyText(event.target.value)}
                            placeholder="Write a reply..."
                          />
                          <button type="button" onClick={() => submitReply(commentId)}>
                            Reply
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="post-comment-empty">No comments yet</div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default DashboardPostCard;
