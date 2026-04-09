import React, { useState, useEffect } from "react";
import UserSearch from "./UserSearch";
import UserTable from "./UserTable";
import UserForm from "./UserForm";
import { adminAPI } from "../../services/api";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async (params = {}) => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers(params);
      setUsers(response.data.users);
      setError("");
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getUserStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const handleSearch = (params) => {
    setSearchParams(params);
    fetchUsers(params);
  };

  const handleUserCreated = () => {
    setShowCreateForm(false);
    fetchUsers(searchParams);
    fetchStats();
  };

  const handleUserUpdated = () => {
    setEditingUser(null);
    fetchUsers(searchParams);
    fetchStats();
  };

  const handleUserDeleted = () => {
    fetchUsers(searchParams);
    fetchStats();
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowCreateForm(false);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  return (
    <div className="container">
      <h1 className="mb-4">Admin Panel</h1>

      {error && <div className="alert alert-error mb-3">{error}</div>}

      {/* Statistics Cards */}
      <div className="grid grid-3 mb-4">
        <div className="card text-center">
          <h3 style={{ color: "#007bff", marginBottom: "8px" }}>
            {stats.users?.total || 0}
          </h3>
          <p style={{ color: "#666", margin: 0 }}>Total Users</p>
          <small style={{ color: "#999" }}>
            {stats.users?.active || 0} active, {stats.users?.inactive || 0}{" "}
            inactive
          </small>
        </div>

        <div className="card text-center">
          <h3 style={{ color: "#28a745", marginBottom: "8px" }}>
            {stats.users?.admins || 0}
          </h3>
          <p style={{ color: "#666", margin: 0 }}>Admin Users</p>
          <small style={{ color: "#999" }}>
            {stats.users?.regular || 0} regular users
          </small>
        </div>

        <div className="card text-center">
          <h3 style={{ color: "#17a2b8", marginBottom: "8px" }}>
            {stats.transactions?.total || 0}
          </h3>
          <p style={{ color: "#666", margin: 0 }}>Total Transactions</p>
          <small style={{ color: "#999" }}>
            {stats.transactions?.usersWithTransactions || 0} users with
            transactions
          </small>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Left Column - Search and Create */}
        <div>
          <UserSearch onSearch={handleSearch} />

          <div className="card mt-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="mb-0">User Management</h3>
              <button
                onClick={() => {
                  setShowCreateForm(!showCreateForm);
                  setEditingUser(null);
                }}
                className="btn btn-primary"
              >
                {showCreateForm ? "Cancel" : "Create User"}
              </button>
            </div>

            {(showCreateForm || editingUser) && (
              <UserForm
                user={editingUser}
                onUserCreated={handleUserCreated}
                onUserUpdated={handleUserUpdated}
                onCancel={
                  editingUser
                    ? handleCancelEdit
                    : () => setShowCreateForm(false)
                }
              />
            )}
          </div>
        </div>

        {/* Right Column - User Table */}
        <div>
          <UserTable
            users={users}
            loading={loading}
            onUserUpdated={handleUserUpdated}
            onUserDeleted={handleUserDeleted}
            onEditUser={handleEditUser}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
