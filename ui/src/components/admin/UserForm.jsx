import React, { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";

const UserForm = ({ user, onUserCreated, onUserUpdated, onCancel }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "user",
    status: "active",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        password: "",
        role: user.role,
        status: user.status,
      });
    } else {
      setFormData({
        email: "",
        password: "",
        role: "user",
        status: "active",
      });
    }
    setErrors({});
    setMessage("");
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!isEditing && !formData.password) {
      newErrors.password = "Password is required for new users";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    if (!formData.status) {
      newErrors.status = "Status is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const submitData = {
        email: formData.email,
        role: formData.role,
        status: formData.status,
      };

      // Only include password if it's provided
      if (formData.password) {
        submitData.password = formData.password;
      }

      if (isEditing) {
        await adminAPI.updateUser(user.id, submitData);
        setMessage("User updated successfully!");
        setTimeout(() => {
          onUserUpdated();
        }, 1000);
      } else {
        await adminAPI.createUser(submitData);
        setMessage("User created successfully!");
        setTimeout(() => {
          onUserCreated();
        }, 1000);
      }
    } catch (error) {
      console.error("Error saving user:", error);
      setMessage(error.response?.data?.error?.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "6px",
        padding: "20px",
        backgroundColor: "#f8f9fa",
      }}
    >
      <h4 className="mb-3">{isEditing ? "Edit User" : "Create New User"}</h4>

      {message && (
        <div
          className={`alert ${message.includes("successfully") ? "alert-success" : "alert-error"} mb-3`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email *</label>
          <input
            type="email"
            name="email"
            className={`form-control ${errors.email ? "error" : ""}`}
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter user email"
          />
          {errors.email && <div className="error-message">{errors.email}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">
            Password {isEditing ? "(leave blank to keep current)" : "*"}
          </label>
          <input
            type="password"
            name="password"
            className={`form-control ${errors.password ? "error" : ""}`}
            value={formData.password}
            onChange={handleInputChange}
            placeholder={
              isEditing ? "Enter new password (optional)" : "Enter password"
            }
          />
          {errors.password && (
            <div className="error-message">{errors.password}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Role *</label>
          <select
            name="role"
            className={`form-control ${errors.role ? "error" : ""}`}
            value={formData.role}
            onChange={handleInputChange}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          {errors.role && <div className="error-message">{errors.role}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Status *</label>
          <select
            name="status"
            className={`form-control ${errors.status ? "error" : ""}`}
            value={formData.status}
            onChange={handleInputChange}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {errors.status && (
            <div className="error-message">{errors.status}</div>
          )}
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving..." : isEditing ? "Update User" : "Create User"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
