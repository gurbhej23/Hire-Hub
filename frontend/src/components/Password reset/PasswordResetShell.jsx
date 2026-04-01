import "./passwordReset.css";

const PasswordResetShell = ({
  title,
  description,
  onSubmit,
  submitLabel,
  children,
}) => (
  <div className="password-reset-page">
    <div className="password-reset-shell">
      <span className="password-reset-badge">HireHub Security</span>
      <h2 className="password-reset-title">{title}</h2>
      {description ? (
        <p className="password-reset-copy">{description}</p>
      ) : null}
      <form onSubmit={onSubmit} className="password-reset-form">
          {children}
          <button type="submit" className="password-reset-button">{submitLabel}</button>
        </form>
    </div>
  </div>
);

export default PasswordResetShell;
