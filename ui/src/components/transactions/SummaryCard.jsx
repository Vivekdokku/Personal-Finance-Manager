import React from "react";

const SummaryCard = ({ summary }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const getCategoryColor = (category, type) => {
    const colors = {
      Food: "#ff6b6b",
      Rent: "#4ecdc4",
      Salary: "#45b7d1",
      Transportation: "#96ceb4",
      Entertainment: "#ffeaa7",
      Healthcare: "#dda0dd",
      Shopping: "#98d8c8",
      Utilities: "#f7dc6f",
      Investment: "#bb8fce",
      Other: "#aed6f1",
    };

    return colors[category] || "#95a5a6";
  };

  if (!summary || !summary.summary) {
    return (
      <div className="card">
        <h3 className="mb-3">Spending Summary</h3>
        <p style={{ color: "#666", textAlign: "center", padding: "20px" }}>
          No transaction data available
        </p>
      </div>
    );
  }

  const { summary: categorySummary, totals } = summary;

  return (
    <div className="card">
      <h3 className="mb-3">Spending Summary</h3>

      {/* Overall Totals */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
          padding: "16px",
          backgroundColor: "#f8f9fa",
          borderRadius: "6px",
        }}
      >
        <div className="text-center">
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
            Total Income
          </div>
          <div
            style={{ fontSize: "18px", fontWeight: "600", color: "#28a745" }}
          >
            {formatCurrency(totals?.totalIncome)}
          </div>
        </div>
        <div className="text-center">
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
            Total Expenses
          </div>
          <div
            style={{ fontSize: "18px", fontWeight: "600", color: "#dc3545" }}
          >
            {formatCurrency(totals?.totalExpenses)}
          </div>
        </div>
        <div className="text-center">
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
            Net Balance
          </div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: (totals?.netBalance || 0) >= 0 ? "#28a745" : "#dc3545",
            }}
          >
            {formatCurrency(totals?.netBalance)}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div>
        <h4 style={{ fontSize: "16px", marginBottom: "16px", color: "#555" }}>
          By Category
        </h4>

        {Object.keys(categorySummary).length === 0 ? (
          <p style={{ color: "#666", textAlign: "center", padding: "20px" }}>
            No categories to display
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {Object.entries(categorySummary).map(([category, data]) => (
              <div
                key={category}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "6px",
                  borderLeft: `4px solid ${getCategoryColor(category)}`,
                }}
              >
                <div>
                  <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                    {category}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    Income: {formatCurrency(data.income)} | Expenses:{" "}
                    {formatCurrency(data.expense)}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: "600",
                    color: data.net >= 0 ? "#28a745" : "#dc3545",
                  }}
                >
                  {formatCurrency(data.net)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: "16px",
          padding: "12px",
          backgroundColor: "#f8f9fa",
          borderRadius: "6px",
          fontSize: "12px",
          color: "#666",
        }}
      >
        <strong>Legend:</strong> Green indicates net income, red indicates net
        expense for each category.
      </div>
    </div>
  );
};

export default SummaryCard;
