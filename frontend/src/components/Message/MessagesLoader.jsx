const MessagesLoader = () => (
  <div className="messages-loader-overlay" aria-live="polite" aria-busy="true">
    <div className="messages-loader-card">
      <div className="messages-loader-spinner" />
      <div className="messages-loader-text">Loading messages...</div>
    </div>
  </div>
);

export default MessagesLoader;
