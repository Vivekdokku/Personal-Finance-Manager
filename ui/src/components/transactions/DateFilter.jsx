import React, { useState } from "react";

const DateFilter = ({ onFilterChange }) => {
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newDateRange = {
      ...dateRange,
      [name]: value,
    };
    setDateRange(newDateRange);

    // Apply filter immediately when both dates are set or when clearing
    if (
      (newDateRange.startDate && newDateRange.endDate) ||
      (!newDateRange.startDate && !newDateRange.endDate)
    ) {
      onFilterChange(newDateRange);
    }
  };

  const handleClearFilter = () => {
    const clearedRange = { startDate: "", endDate: "" };
    setDateRange(clearedRange);
    onFilterChange(clearedRange);
  };

  const setPresetRange = (preset) => {
    const today = new Date();
    let startDate, endDate;

    switch (preset) {
      case "thisMonth":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "lastMonth":
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "last30Days":
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = today;
        break;
      case "last90Days":
        startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        endDate = today;
        break;
      case "thisYear":
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
      default:
        return;
    }

    const newDateRange = {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };

    setDateRange(newDateRange);
    onFilterChange(newDateRange);
  };

  return (
    <div className="card">
      <h3 className="mb-3">Filter by Date</h3>

      <div className="form-group">
        <label className="form-label">Start Date</label>
        <input
          type="date"
          name="startDate"
          className="form-control"
          value={dateRange.startDate}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-group">
        <label className="form-label">End Date</label>
        <input
          type="date"
          name="endDate"
          className="form-control"
          value={dateRange.endDate}
          onChange={handleInputChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Quick Filters</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setPresetRange("thisMonth")}
            className="btn btn-secondary"
            style={{ padding: "6px 12px", fontSize: "12px" }}
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => setPresetRange("lastMonth")}
            className="btn btn-secondary"
            style={{ padding: "6px 12px", fontSize: "12px" }}
          >
            Last Month
          </button>
          <button
            type="button"
            onClick={() => setPresetRange("last30Days")}
            className="btn btn-secondary"
            style={{ padding: "6px 12px", fontSize: "12px" }}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={() => setPresetRange("last90Days")}
            className="btn btn-secondary"
            style={{ padding: "6px 12px", fontSize: "12px" }}
          >
            Last 90 Days
          </button>
          <button
            type="button"
            onClick={() => setPresetRange("thisYear")}
            className="btn btn-secondary"
            style={{ padding: "6px 12px", fontSize: "12px" }}
          >
            This Year
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleClearFilter}
        className="btn btn-primary w-100"
      >
        Clear Filter
      </button>

      {(dateRange.startDate || dateRange.endDate) && (
        <div
          style={{
            marginTop: "12px",
            padding: "8px",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
          }}
        >
          <small style={{ color: "#666" }}>
            {dateRange.startDate && dateRange.endDate
              ? `Showing transactions from ${dateRange.startDate} to ${dateRange.endDate}`
              : dateRange.startDate
                ? `Showing transactions from ${dateRange.startDate}`
                : `Showing transactions until ${dateRange.endDate}`}
          </small>
        </div>
      )}
    </div>
  );
};

export default DateFilter;
