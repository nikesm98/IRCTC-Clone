import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";


export default function AdminView() {
  const [rows, setRows] = useState([]);
  const token = localStorage.getItem("authToken"); // Retrieve the token from localStorage or state

  const columns = [
    { field: "id", headerName: "User ID", type: "number", width: 100 },
    { field: "username", headerName: "Username", width: 150 },
    { field: "email", headerName: "Email", width: 200 },
    {
      field: "role",
      headerName: "Role",
      width: 130,
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
    },
  ];

  const getAllUsers = async () => {
    try {
      const response = await fetch("http://localhost:5050/admin/allUsers", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Add token to the Authorization header
        },
      });

      const res = await response.json();

      // Make sure each row has a unique `id`
      const formattedRows = res.users.map(user => ({
        id: user.userid,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      }));

      setRows(formattedRows);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getAllUsers();
  }, []);

  return (
    <div className="datagrid-container">
      <h1>Admin View: All Users</h1>
      <div style={{ height: 700, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          getRowId={(row) => row.id}
        />
      </div>
    </div>
  );
}
