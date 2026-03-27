import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";

const SearchUsers = () => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async () => {
    const res = await API.get(`/users/search?search=${search}`);
    setUsers(res.data);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around" }}>
      <h2 style={{ fontSize: "10px" }}>Search Users</h2>

      <input style={{margin:"0px"}}
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <button onClick={handleSearch} style={{ margin: "0px" }}>Search</button>

      <h3>Users</h3>

      {users.map((user) => (
        <div
          key={user._id}
          className="job-card"
          onClick={() => navigate(`/profile/${user._id}`)}
        >
          <h4>{user.name}</h4>
          <p>{user.role}</p>
          <p>{user.company}</p>
        </div>
      ))}
    </div>
  );
};

export default SearchUsers;