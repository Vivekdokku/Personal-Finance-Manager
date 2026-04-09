import React, { useState, useEffect, useCallback } from "react";
import TransactionForm from "./TransactionForm";
import TransactionList from "./TransactionList";
import DateFilter from "./DateFilter";
import SummaryCard from "./SummaryCard";
import { transactionAPI } from "../../services/api";

const TransactionDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({});
  const [dateFilter, setDateFilter] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getTransactions(dateFilter);
      setTransactions(response.data.transactions);
      setError("");
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await transactionAPI.getSpendingSummary();
      setSummary(response.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleTransactionAdded = () => {
    fetchTransactions();
    fetchSummary();
  };

  const handleTransactionUpdated = () => {
    fetchTransactions();
    fetchSummary();
  };

  const handleTransactionDeleted = () => {
    fetchTransactions();
    fetchSummary();
  };

  const handleDateFilterChange = (newFilter) => {
    setDateFilter(newFilter);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="mb-4">Transaction Dashboard</h1>

      {error && <div className="alert alert-error mb-3">{error}</div>}

      <div className="grid grid-2 mb-4">
        <SummaryCard summary={summary} />
        <DateFilter onFilterChange={handleDateFilterChange} />
      </div>

      <div className="grid grid-2">
        <div>
          <TransactionForm onTransactionAdded={handleTransactionAdded} />
        </div>
        <div>
          <TransactionList
            transactions={transactions}
            loading={loading}
            onTransactionUpdated={handleTransactionUpdated}
            onTransactionDeleted={handleTransactionDeleted}
          />
        </div>
      </div>
    </div>
  );
};

export default TransactionDashboard;
