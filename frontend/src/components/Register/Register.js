import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../services/api";
import { getInitials } from "../../utils/userHelpers";
import "./register.css"; 
import ImageCropModal from "../Profile Img crop/ImageCropModal";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    profileImage: "",
  });
  const [error, setError] = useState("");
  const [pendingProfileImage, setPendingProfileImage] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setForm((prev) => ({ ...prev, profileImage: "" }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Please choose an image smaller than 10MB.");
      return;
    }

    setError("");
    setPendingProfileImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await API.post("/auth/register", form);
      if (res && res.data) {
        alert("Registered successfully! Please login.");
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    }
  };

  return (
    <>
    {pendingProfileImage ? (
      <ImageCropModal
        file={pendingProfileImage}
        aspectRatio={1}
        title="Crop profile photo"
        outputWidth={320}
        outputHeight={320}
        confirmLabel="Use photo"
        onCancel={() => setPendingProfileImage(null)}
        onConfirm={(croppedImage) => {
          setForm((prev) => ({
            ...prev,
            profileImage: croppedImage,
          }));
          setPendingProfileImage(null);
          setError("");
        }}
      />
    ) : null}
    <div className="container1"> 
      <div className="colorDesign"></div>
      <div className="container">
      <h2>Create Your Account</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="register-avatar-preview">
          {form.profileImage ? (
            <img
              src={form.profileImage}
              alt="Profile preview"
              className="register-avatar-image"
            />
          ) : (
            <div className="register-avatar-fallback">
              {getInitials(form.name)}
            </div>
          )}
        </div>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
        />
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
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
        <button type="submit">Register</button>
      </form>
      <Link className="link" to="/login">Already have an account? Login</Link>
      </div>
    </div> 
    </>
  );
};

export default Register;
