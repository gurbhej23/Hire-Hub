import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import ForgotPassword from "./components/Password reset/forgotPass";
import ResetPassword from "./components/Password reset/resetPass";
import Dashboard from "./components/Dashboard/Dashboard";
import Profile from "./components/Profile/Profile";
import SearchUsers from "./components/Navbar/SearchUser";
import Messages from "./components/Message/Messages";
import { connectSocket, disconnectSocket } from "./services/socket";

function App() {
  const [, setUser] = useState(() =>
    localStorage.getItem("token") ? { isAuthenticated: true } : null
  );
  const isAuthenticated = Boolean(localStorage.getItem("token"));

  useEffect(() => {
    if (localStorage.getItem("token")) {
      connectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={ isAuthenticated ? <Navigate to="/dashboard" /> 
        : 
        <Navigate to="/login" />}/>
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> 
        : 
        <Login setUser={setUser} />}/>
        <Route path="/search-users" element={<SearchUsers />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:userId" element={<Messages />} />
      </Routes>
    </Router>
  );
}

export default App;
