import React, { useState } from "react";
import { adminAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const UserTable = ({
  users,
  loading,
  onUserUpdated,
  onUserDeleted,
  onEditUser,
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [statusLoading, setStatusLoading] = useState({});
  const { user: currentUser } = useAuth();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const badgeStyle = {
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "500",
    };

    if (status === "active") {
      return (
        <span
          style={{
            ...badgeStyle,
            backgroundColor: "#d4edda",
            color: "#155724",
          }}
        >
          Active
        </span>
      );
    } else {
      return (
        <span
          style={{
            ...badgeStyle,
            backgroundColor: "#f8d7da",
            color: "#721c24",
          }}
        >
          Inactive
        </span>
      );
    }
  };

  const getRoleBadge = (role) => {
    const badgeStyle = {
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "500",
    };

    if (role === "admin") {
      return (
        <span
          style={{
            ...badgeStyle,
            backgroundColor: "#d1ecf1",
            color: "#0c5460",
          }}
        >
          Admin
        </span>
      );
    } else {
      return (
        <span
          style={{
            ...badgeStyle,
            backgroundColor: "#e2e3e5",
            color: "#383d41",
          }}
        >
          User
        </span>
      );
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    setStatusLoading((prev) => ({ ...prev, [userId]: true }));

    try {
      await adminAPI.updateUser(userId, { status: newStatus });
      onUserUpdated();
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Failed to update user status");
    } finally {
      setStatusLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleDelete = async (userId) => {
    try {
      await adminAPI.deleteUser(userId);
      setDeleteConfirm(null);
      onUserDeleted();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(error.response?.data?.error?.message || "Failed to delete user");
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h3 className="mb-3">Users</h3>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="mb-3">Users ({users.length})</h3>

      {users.length === 0 ? (
        <p style={{ color: "#666", textAlign: "center", padding: "40px" }}>
          No users found matching your criteria.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontWeight: "500" }}>{user.email}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      ID: {user.id}
                    </div>
                  </td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>{getStatusBadge(user.status)}</td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>
                    <div
                      style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                    >
                      <button
                        onClick={() => onEditUser(user)}
                        className="btn btn-secondary"
                        style={{ padding: "4px 8px", fontSize: "12px" }}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleStatusToggle(user.id, user.status)}
                        className={`btn ${user.status === "active" ? "btn-secondary" : "btn-success"}`}
                        style={{ padding: "4px 8px", fontSize: "12px" }}
                        disabled={statusLoading[user.id]}
                      >
                        {statusLoading[user.id]
                          ? "Loading..."
                          : user.status === "active"
                            ? "Deactivate"
                            : "Activate"}
                      </button>

                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          className="btn btn-danger"
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div className="card" style={{ maxWidth: "400px", margin: "20px" }}>
            <h4 className="mb-3">Confirm Delete</h4>
            <p>
              Are you sure you want to delete this user? This action will also
              delete all their transactions and cannot be undone.
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="btn btn-danger"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTable;
