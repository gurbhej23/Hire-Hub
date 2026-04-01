import { useState } from "react";
import API from "../../services/api";
import PasswordResetField from "./PasswordResetField";
import PasswordResetShell from "./PasswordResetShell";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/forgotPassword", { email });
      if (res.data.resetUrl) {
        console.log("Reset URL:", res.data.resetUrl);
      }
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || "Error sending email");
    }
  };

  return (
    <PasswordResetShell
      title="Forgot Password"
      description="Enter the email linked with your account and we will send you a password reset link."
      onSubmit={submitHandler}
      submitLabel="Send Reset Link"
    >
      <PasswordResetField
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={setEmail}
      />
    </PasswordResetShell>
  );
};

export default ForgotPassword;
