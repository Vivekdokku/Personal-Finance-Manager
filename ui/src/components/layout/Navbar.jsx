import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/dashboard" className="navbar-brand">
            Personal Finance Manager
          </Link>

          <ul className="navbar-nav">
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
            {isAdmin() && (
              <li>
                <Link to="/admin">Admin Panel</Link>
              </li>
            )}
            <li>
              <span style={{ color: "#666" }}>Welcome, {user?.email}</span>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ padding: "8px 16px", fontSize: "14px" }}
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
