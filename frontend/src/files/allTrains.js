import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import "./files.css";
import { useState } from "react";

export default function AllTrain() {
    const columns = [
        { field: "id", headerName: "Train ID", type: "number", width: 100 },
        { field: "trainname", headerName: "Train Name", width: 150 },
        {
            field: "runson",
            headerName: "Runs On",
            width: 130,
        },
        {
            field: "totalseats",
            headerName: "Total Seats",
            type: "number",
            width: 150,
        },
        {
            field: "starttime",
            headerName: "Start Time",
            type: "dateTime",
            width: 140,
        },
    ];

    const [rows, setRows] = useState([]);

    const getAllTrains = async () => {
        try {
            const response = await fetch("http://localhost:5050/allTrains", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            const res = await response.json();
            console.log("API Response: ", res.allTrainsData);

            const formattedRows = res.allTrainsData
                .filter(train => train && train.trainid) 
                .map(train => ({
                    id: train.trainid, 
                    trainname: train.trainname,
                    runson: train.runson,
                    totalseats: train.totalseats,
                    starttime: train.starttime,
                }));

            console.log("Formatted Rows: ", formattedRows);
            setRows(formattedRows);
        } catch (err) {
            console.error("Error fetching train data: ", err);
        }
    };

    React.useEffect(() => {
        getAllTrains();
    }, []);

    return (
        <div className="datagrid-container">
            <br />
            <h1>All Trains</h1>
            <br />
            <div style={{ height: 700, width: "100%" }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    pageSize={11}
                    rowsPerPageOptions={[11]}
                    getRowId={(row) => row.id} 
                />
            </div>
        </div>
    );
}
