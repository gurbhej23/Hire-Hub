const PasswordResetField = ({
  type,
  placeholder,
  value,
  onChange,
  required = true,
}) => (
  <input
    className="password-reset-input"
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    required={required}
  />
);

export default PasswordResetField;
