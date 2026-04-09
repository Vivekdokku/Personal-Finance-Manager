import React, { useState } from "react";

const UserSearch = ({ onSearch }) => {
  const [searchData, setSearchData] = useState({
    search: "",
    status: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Filter out empty values
    const searchParams = {};
    if (searchData.search.trim()) {
      searchParams.search = searchData.search.trim();
    }
    if (searchData.status) {
      searchParams.status = searchData.status;
    }

    onSearch(searchParams);
  };

  const handleClear = () => {
    setSearchData({
      search: "",
      status: "",
    });
    onSearch({});
  };

  return (
    <div className="card">
      <h3 className="mb-3">Search Users</h3>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Search by Email</label>
          <input
            type="text"
            name="search"
            className="form-control"
            value={searchData.search}
            onChange={handleInputChange}
            placeholder="Enter email to search..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Filter by Status</label>
          <select
            name="status"
            className="form-control"
            value={searchData.status}
            onChange={handleInputChange}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="btn btn-secondary"
          >
            Clear
          </button>
        </div>
      </form>

      {(searchData.search || searchData.status) && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            backgroundColor: "#f8f9fa",
            borderRadius: "6px",
          }}
        >
          <small style={{ color: "#666" }}>
            <strong>Active Filters:</strong>
            {searchData.search && ` Email contains "${searchData.search}"`}
            {searchData.search && searchData.status && ", "}
            {searchData.status && ` Status: ${searchData.status}`}
          </small>
        </div>
      )}
    </div>
  );
};

export default UserSearch;
