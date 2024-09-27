import React, { useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import "./addtrain.css";

function Addtrain() {
  const [routeFields, setRouteFields] = useState([
    {
      station: "",
      timeFromStart: "",
    },
  ]);

  const [trainInfo, setTrainInfo] = useState({
    trainName: "",
    runson: "",
    totalseats: "",
    starttime: "",
  });

  const handleTrainFrom = (event) => {
    const newValue = event.target.value;
    const inputName = event.target.name;
    setTrainInfo((prevValue) => ({
      ...prevValue,
      [inputName]: newValue,
    }));
  };

  const handleRouteForm = (event, index) => {
    let data = [...routeFields];
    data[index][event.target.name] = event.target.value;
    setRouteFields(data);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    const formData = {
      routes: routeFields,
      trainName: trainInfo.trainName,
      runson: trainInfo.runson,
      totalseats: trainInfo.totalseats,
      starttime: trainInfo.starttime,
    };
    console.log(formData);

    try {
      const response = await fetch("http://localhost:5050/addTrain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const res = await response.json();
      console.log(res);
      if (!res.success) {
        alert("Train was not added.");
      } else {
        alert("Train added.");
        window.location.href = "/allTrains";
      }
    } catch (err) {
      console.log(err);
    }
  };

  const addFields = () => {
    const newField = {
      station: "",
      timeFromStart: "",
    };
    setRouteFields([...routeFields, newField]);
  };

  const removeFields = (index) => {
    let data = [...routeFields];
    data.splice(index, 1);
    setRouteFields(data);
  };

  return (
    <div className="add-train">
      <form>
        <h2>Train Details</h2>
        <div className="train-details">
          <div className="train-details-child">
            <TextField
              required
              name="trainName"
              label="Train Name"
              value={trainInfo.trainName}
              onChange={handleTrainFrom}
            />
          </div>
          <div className="train-details-child">
            <TextField
              required
              name="runson"
              label="Runs On"
              value={trainInfo.runson}
              onChange={handleTrainFrom}
            />
          </div>
          <div className="train-details-child">
            <TextField
              required
              name="totalseats"
              label="Total Seats"
              value={trainInfo.totalseats}
              onChange={handleTrainFrom}
            />
          </div>
          <div className="train-details-child">
            <TextField
              required
              name="starttime"
              label="Start Time"
              value={trainInfo.starttime}
              onChange={handleTrainFrom}
            />
          </div>
        </div>
        <h2>Route Details</h2>
        <div className="route-details">
          <div className="route-form-container">
            {routeFields.map((route, index) => (
              <div key={index} className="route-form-repeat"> {/* Added unique key */}
                <div className="route-form-repeat-child">
                  <TextField
                    required
                    name="station"
                    label="Station Name"
                    value={route.station}
                    onChange={(event) => handleRouteForm(event, index)}
                  />
                </div>
                <div className="route-form-repeat-child">
                  <TextField
                    required
                    name="timeFromStart"
                    label="Time From Start (mins)"
                    value={route.timeFromStart}
                    onChange={(event) => handleRouteForm(event, index)}
                  />
                </div>
                <div className="route-form-repeat-child">
                  <Button
                    color="warning"
                    variant="contained"
                    onClick={() => removeFields(index)} // Fix to properly call removeFields
                  >
                    Remove Station
                  </Button>
                </div>
              </div>
            ))}
            <Button
              sx={{ backgroundColor: "#4CAF50" }}
              type="button" // Changed to button to prevent form submission
              variant="contained"
              onClick={addFields}
            >
              Add Station
            </Button>
          </div>
        </div>
        <Button
          sx={{ backgroundColor: "#4CAF50" }}
          type="submit"
          variant="contained"
          onClick={submitForm}
        >
          Add Train and Route
        </Button>
      </form>
    </div>
  );
}

export default Addtrain;
