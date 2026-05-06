import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../services/api";
import { connectSocket } from "../../services/socket";
import "./login.css";
import jobProfile from "../../assets/job.jpg";
import WelcomeSplash from "./WelcomeSplash";

const Login = ({ setUser }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showSplash, setShowSplash] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await API.post("/auth/login", form);
      if (res && res.data) {
        localStorage.setItem("token", res.data.token);
        connectSocket();
        setUser(res.data);
        navigate("/dashboard");
      }
    } catch (err) {
      const message =
        err.userMessage ||
        err.response?.data?.message ||
        (err.request
          ? "Cannot reach the server. Check that the backend is running and CORS allows this frontend URL."
          : "Login failed. Try again.");
      setError(message);
    }
  };

  return (
    <>
      <div className="main login-page-shell">
        {showSplash ? <WelcomeSplash /> : null}
        <div
          className={`login-content ${showSplash ? "is-hidden" : "is-visible"}`}
        >
          <div className="container">
            <h2>Login</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <img src={jobProfile} alt="HireHub login"></img>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button type="submit">Login</button>

              <Link to="/forgot-password">Forgot password?</Link>
            </form>
            <Link className="link" to="/register">
              Don't have an account? Register
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
