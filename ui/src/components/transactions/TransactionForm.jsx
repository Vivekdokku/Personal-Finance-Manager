import React, { useState } from "react";
import { transactionAPI } from "../../services/api";

const TransactionForm = ({ onTransactionAdded }) => {
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    description: "",
    notes: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const commonCategories = [
    "Food",
    "Rent",
    "Salary",
    "Transportation",
    "Entertainment",
    "Healthcare",
    "Shopping",
    "Utilities",
    "Investment",
    "Other",
  ];

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

    if (!formData.amount) {
      newErrors.amount = "Amount is required";
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) === 0) {
      newErrors.amount = "Amount must be a valid non-zero number";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.transaction_date) {
      newErrors.transaction_date = "Transaction date is required";
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
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      await transactionAPI.createTransaction(transactionData);

      setMessage("Transaction added successfully!");
      setFormData({
        amount: "",
        category: "",
        description: "",
        notes: "",
        transaction_date: new Date().toISOString().split("T")[0],
      });

      if (onTransactionAdded) {
        onTransactionAdded();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error creating transaction:", error);
      setMessage(
        error.response?.data?.error?.message || "Failed to add transaction",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="mb-3">Add New Transaction</h3>

      {message && (
        <div
          className={`alert ${message.includes("successfully") ? "alert-success" : "alert-error"} mb-3`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Amount *</label>
          <input
            type="number"
            name="amount"
            step="0.01"
            className={`form-control ${errors.amount ? "error" : ""}`}
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="Enter amount (positive for income, negative for expense)"
          />
          {errors.amount && (
            <div className="error-message">{errors.amount}</div>
          )}
          <small style={{ color: "#666", fontSize: "12px" }}>
            Use positive numbers for income, negative for expenses
          </small>
        </div>

        <div className="form-group">
          <label className="form-label">Category *</label>
          <select
            name="category"
            className={`form-control ${errors.category ? "error" : ""}`}
            value={formData.category}
            onChange={handleInputChange}
          >
            <option value="">Select a category</option>
            {commonCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && (
            <div className="error-message">{errors.category}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <input
            type="text"
            name="description"
            className="form-control"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Brief description of the transaction"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea
            name="notes"
            className="form-control"
            rows="3"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Additional notes or details"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Transaction Date *</label>
          <input
            type="date"
            name="transaction_date"
            className={`form-control ${errors.transaction_date ? "error" : ""}`}
            value={formData.transaction_date}
            onChange={handleInputChange}
          />
          {errors.transaction_date && (
            <div className="error-message">{errors.transaction_date}</div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? "Adding Transaction..." : "Add Transaction"}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
