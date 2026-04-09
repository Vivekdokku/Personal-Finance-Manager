import React, { useState } from "react";
import { transactionAPI } from "../../services/api";

const TransactionList = ({
  transactions,
  loading,
  onTransactionUpdated,
  onTransactionDeleted,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const formatAmount = (amount) => {
    const num = parseFloat(amount);
    const formatted = Math.abs(num).toFixed(2);
    return num >= 0 ? `+$${formatted}` : `-$${formatted}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setEditFormData({
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description || "",
      notes: transaction.notes || "",
      transaction_date: transaction.transaction_date,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleSaveEdit = async () => {
    try {
      await transactionAPI.updateTransaction(editingId, {
        ...editFormData,
        amount: parseFloat(editFormData.amount),
      });

      setEditingId(null);
      setEditFormData({});

      if (onTransactionUpdated) {
        onTransactionUpdated();
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      alert("Failed to update transaction");
    }
  };

  const handleDelete = async (id) => {
    try {
      await transactionAPI.deleteTransaction(id);
      setDeleteConfirm(null);

      if (onTransactionDeleted) {
        onTransactionDeleted();
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Failed to delete transaction");
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <div className="card">
        <h3 className="mb-3">Transaction History</h3>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="mb-3">Transaction History</h3>

      {transactions.length === 0 ? (
        <p style={{ color: "#666", textAlign: "center", padding: "40px" }}>
          No transactions found. Add your first transaction to get started!
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  {editingId === transaction.id ? (
                    <>
                      <td>
                        <input
                          type="date"
                          name="transaction_date"
                          value={editFormData.transaction_date}
                          onChange={handleEditInputChange}
                          style={{ width: "100%", padding: "4px" }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="amount"
                          step="0.01"
                          value={editFormData.amount}
                          onChange={handleEditInputChange}
                          style={{ width: "100%", padding: "4px" }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          name="category"
                          value={editFormData.category}
                          onChange={handleEditInputChange}
                          style={{ width: "100%", padding: "4px" }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          name="description"
                          value={editFormData.description}
                          onChange={handleEditInputChange}
                          style={{ width: "100%", padding: "4px" }}
                        />
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={handleSaveEdit}
                            className="btn btn-success"
                            style={{ padding: "4px 8px", fontSize: "12px" }}
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="btn btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "12px" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{formatDate(transaction.transaction_date)}</td>
                      <td>
                        <span
                          style={{
                            color:
                              parseFloat(transaction.amount) >= 0
                                ? "#28a745"
                                : "#dc3545",
                            fontWeight: "500",
                          }}
                        >
                          {formatAmount(transaction.amount)}
                        </span>
                      </td>
                      <td>{transaction.category}</td>
                      <td>
                        <div>
                          {transaction.description && (
                            <div style={{ fontWeight: "500" }}>
                              {transaction.description}
                            </div>
                          )}
                          {transaction.notes && (
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              {transaction.notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="btn btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "12px" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(transaction.id)}
                            className="btn btn-danger"
                            style={{ padding: "4px 8px", fontSize: "12px" }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
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
              Are you sure you want to delete this transaction? This action
              cannot be undone.
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
