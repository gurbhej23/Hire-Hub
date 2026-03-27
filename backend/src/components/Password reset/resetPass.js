import { useState } from "react";
import API from "../../services/api";
import { useParams, useNavigate } from "react-router-dom";
import PasswordResetField from "./PasswordResetField";
import PasswordResetShell from "./PasswordResetShell";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post(`/auth/resetPassword/${token}`, { password });
      alert(res.data.message); // "Password reset successful"
      navigate("/"); // redirect to login
    } catch (err) {
      console.log(err.response?.data);
      alert(err.response?.data?.message || "Reset failed");
    }
  };

  return (
    <PasswordResetShell
      title="Reset Password"
      description="Choose a strong new password for your HireHub account and continue back to login."
      onSubmit={submitHandler}
      submitLabel="Reset"
    >
      <PasswordResetField
        type="password"
        placeholder="New password"
        value={password}
        onChange={setPassword}
      />
    </PasswordResetShell>
  );
};

export default ResetPassword;
