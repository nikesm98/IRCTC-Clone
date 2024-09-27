const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./connect");  
// const { response } = require("express");
const schedule = require('node-schedule');
const bcrypt = require('bcrypt');

app.use(cors());
app.use(express.json());

const weekday = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
};

function getNextDay(date = new Date(), day) {
    const dateCopy = new Date(date.getTime());

    const next = new Date(
        dateCopy.setDate(
            dateCopy.getDate() + ((7 - dateCopy.getDay() + day) % 7 || 7),
        ),
    );

    return next;
}

const pricePerMinute = 2;

function getTime(dh, dm) {
    let time = "";
    if (dh < 10) {
        time = time + "0" + String(dh) + ":";
    } else {
        time = time + String(dh) + ":";
    }
    if (dm < 10) {
        time = time + "0" + String(dm) + ":00";
    } else {
        time = time + String(dm) + ":00";
    }
    return time;
}


app.post("/register", async (req, res) => {
    try {
        const { fname, lname, email, contactNo, password } = req.body;

        // console.log(password);

        const [newUser] = await pool.query(
            "INSERT INTO Users (FirstName, LastName, Email, ContactNo, Password) VALUES (?, ?, ?, ?, ?)",
            [fname, lname, email, contactNo, password]
        );

        console.log(newUser);
        res.status(201).json({ created: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ created: false, error: err.message });
    }
});


// Endpoint for login
app.post("/login", async (req, res) => {
    try {
        // Extract the body data
        const { email, password } = req.body;

        
        const [users] = await pool.query(
            "SELECT * FROM Users WHERE Email = ?",
            [email]
        );

        // Check if the user exists
        if (users.length === 0) {
            return res.json({ success: false, message: "User not found." });
        }

        const user = users[0];

        if (password === req.Password) {
            const responseObj = {
                success: true,
                userId: user.UserId
            };
            res.json(responseObj);
        } else {
            res.json({ success: false, message: "Incorrect password." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});



// Fetch all trains
app.post("/allTrains", async (req, res) => {
    try {
        const [allTrainsData] = await pool.query(
            "SELECT * FROM Trains"
        );
        res.json({ allTrainsData });
    } catch (err) {
        console.log(err);
        res.json({ success: false });
    }
});
// Fetch all bookings
app.post("/allBookings", async (req, res) => {
    try {
        let [allBookingsData] = await pool.query(
            "SELECT * FROM Tickets"
        );
        res.json({ allBookingsData });
    } catch (err) {
        console.log(err);
        res.json({ success: false });
    }
});

// Endpoint to change password
app.post("/changePasswords", async (req, res) => {
    try {
        req = req.body;
        let [User] = await pool.query(
            "SELECT Password FROM USERS WHERE USERID=?",
            [req.userId]
        );
        if (!User) {
            res.json({ success: false });
        } else {
            if (User.Password === req.oldPassword) {
                await pool.query(
                    "UPDATE USERS SET PASSWORD=? WHERE USERID=?",
                    [req.newPassword, req.userId]
                );
                res.json({ success: true });
            } else {
                res.json({ success: false });
            }
        }
    } catch (err) {
        console.log(err);
        res.json({ success: false });
    }
});

// Admin login
app.post("/adminLogin", async (req, res) => {
    try {
        
        const { email, password } = req.body;
        let [User] = await pool.query(
            "SELECT * FROM ADMINS WHERE ADMINEMAIL=?",
            [email]
        );
        if (!User) {
            res.json({ success: false });
        } else {
            if (password === req.Password) {
                let obj = {
                    success: true,
                    adminId: User.adminid
                };
                res.json(obj);
            } else {
                res.json({ success: false });
            }
        }
    } catch (err) {
        console.log(err);
        res.json({ success: false });
    }
});


app.post("/getTrains", async(req, res) =>{
    
    let trainDetails = [];
    try {
        req=req.body;
        console.log(req);
        let trains = await pool.query(
            "SELECT DEPARTURE.TRAINID AS TRAINID, DEPARTURE.ROUTEID AS ROUTEID, DEPARTURE.CURRENTSTATION  AS DEPT, ARRIVAL.CURRENTSTATION AS ARR, to_char(DEPARTURE.CURRENTDATE, 'YYYY-MM-DD') AS DEPARTUREDATE, to_char(ARRIVAL.CURRENTDATE, 'YYYY-MM-DD') AS ARRIVALDATE, ARRIVAL.TIMEFROMSTART-DEPARTURE.TIMEFROMSTART AS DURATION, ARRIVAL.TIMEFROMSTART AS ARRIVALTIME, DEPARTURE.TIMEFROMSTART AS DEPARTURETIME FROM ROUTES AS DEPARTURE INNER JOIN ROUTES AS ARRIVAL ON (DEPARTURE.ROUTEID=ARRIVAL.ROUTEID AND DEPARTURE.TRAINID=ARRIVAL.TRAINID) WHERE DEPARTURE.CURRENTSTATION=$1 AND ARRIVAL.CURRENTSTATION=$2 AND ARRIVAL.TIMEFROMSTART>DEPARTURE.TIMEFROMSTART AND DEPARTURE.CURRENTDATE=$3;",
            [req.departure.toLowerCase(), req.arrival.toLowerCase(), req.date]
        );
        trains=trains.rows;
        //console.log(trains);
        for(let i=0;i<trains.length;i++){
            let currenTrain = await pool.query(
                "SELECT * FROM TRAINS WHERE TRAINID=$1;",
                [trains[i].trainid]
            );
            let remainingSeats = await pool.query(
                "SELECT MIN(REMAININGSEATS) FROM ROUTES WHERE TRAINID=$1 AND ROUTEID=$2 AND TIMEFROMSTART>=$3 AND TIMEFROMSTART<$4;",
                [trains[i].trainid, trains[i].routeid, trains[i].departuretime, trains[i].arrivaltime]
            );
            remainingSeats=remainingSeats.rows[0];
            currentTrain=currenTrain.rows[0];
            //console.log(currentTrain);
            let h=parseInt((currentTrain.starttime).slice(0, 3)), m=parseInt((currentTrain.starttime).slice(3,5));
            let dh=(h+Math.floor(trains[i].departuretime/60))%24, dm=(m+trains[i].departuretime%60)%60;
            dh+=Math.floor((m+trains[i].departuretime%60)/60);
            let departureTime = getTime(dh, dm);
            dh=(h+Math.floor(trains[i].arrivaltime/60))%24;
            dm=(m+trains[i].arrivaltime%60)%60;
            let arrivalTime = getTime(dh, dm);
            trainDetails.push({
                trainid: parseInt(trains[i].trainid),
                departure: trains[i].dept,
                arrival: trains[i].arr,
                departureDate: trains[i].departuredate,
                arrivalDate: trains[i].arrivaldate,
                durationHours: Math.floor(trains[i].duration/60),
                durationMinutes: trains[i].duration%60,
                price: trains[i].duration*pricePerMinute,
                trainName: currentTrain.trainname,
                runsOn: currentTrain.runson,
                remainingSeats: remainingSeats.min,
                arrivalTime: arrivalTime,
                departureTime: departureTime,
                routeId: parseInt(trains[i].routeid)
            })
        }
        console.log(trainDetails);
        res.json(trainDetails);
    } catch (err) {
        res.json(trainDetails);
    }

});


app.post("/getRoute", async(req, res) =>{
    let details = {
        flag : false
    };
    try {
        req=req.body;
        req.tID=parseInt(req.tID);   
        let route = await pool.query(
            "SELECT CURRENTSTATION, TIMEFROMSTART FROM ROUTES WHERE TRAINID=$1 AND ROUTEID IN (SELECT MIN(ROUTEID) FROM ROUTES) ORDER BY TIMEFROMSTART;",
            [req.tID]
        );
        let startSt = await pool.query(
            "SELECT CURRENTSTATION FROM ROUTES WHERE TRAINID=$1 AND TIMEFROMSTART IN (SELECT MIN(TIMEFROMSTART) FROM ROUTES);",
            [req.tID]
        );
        console.log(startSt);
        startSt=startSt.rows[0].currentstation;
        console.log(startSt);
        let endSt = await pool.query(
            "SELECT CURRENTSTATION FROM ROUTES WHERE TRAINID=$1 AND TIMEFROMSTART IN (SELECT MAX(TIMEFROMSTART) FROM ROUTES);",
            [req.tID]
        );
        endSt=endSt.rows[0].currentstation;
        console.log(endSt);
        let train = await pool.query(
            "SELECT * FROM TRAINS WHERE TRAINID=$1;",
            [req.tID]
        );
        train=train.rows[0];
        route=route.rows;
        console.log(route);
        console.log(train);
        console.log(startSt);
        console.log(endSt);
        details = {
            trainId: req.tID,
            trainName: train.trainname,
            startStation: startSt,
            destinationStation: endSt,
            runsOn: train.runson,
            stations: [],
            flag: true
        }
        let h=parseInt((train.starttime).slice(0, 3)), m=parseInt((train.starttime).slice(3,5));
        for(let i=0;i<route.length;i++){
            let dh=(h+Math.floor(route[i].timefromstart/60))%24, dm=(m+route[i].timefromstart%60)%60;
            dh+=Math.floor((m+route[i].timefromstart%60)/60);
            let arrivalTime = getTime(dh, dm);
            m+=10;
            dh=(h+Math.floor(route[i].timefromstart/60))%24
            dm=(m+route[i].timefromstart%60)%60;
            dh+=Math.floor((m+route[i].timefromstart%60)/60);
            let departureTime = getTime(dh, dm);

            details.stations.push({
                stationName: route[i].currentstation,
                arrivalTime: arrivalTime,
                departureTime: departureTime
            })
        }
        console.log(details);
        res.json(details);
    } catch (err) {
        console.log(err);
        res.json(details);
    }
});


app.post("/deleteTrain", async (req, res) => {
    try {
        console.log(req.body);
        const [result] = await pool.query(
            "DELETE FROM TRAINS WHERE TRAINID = ?",
            [req.body.trainId]
        );
        if (result.affectedRows === 0) {
            res.json({ created: false });
        } else {
            res.json({ created: true });
        }
    } catch (err) {
        console.error(err);
        res.json({ created: false });
    }
});

app.post("/deleteTicket", async(req, res) =>{
    try {
        console.log(req.body);  
        const newUser = await pool.query(
            "DELETE FROM TICKETS WHERE TICKETID=$1;",
            [req.body.ticketId]
        );
        res.json({created: true});
    } catch (err) {
        res.json({created: false});
    }
});

app.post("/getBookings", async (req, res) => {
    req = req.body;
    console.log(req);
    let obj = [];
    try {  
        // Query to get tickets for the user
        let [tickets] = await pool.query(
            "SELECT * FROM TICKETS WHERE USERID = ?",
            [req.id]
        );
        
        console.log(tickets);
        
        for (let i = 0; i < tickets.length; i++) {
            // Query to get train details
            let [train] = await pool.query(
                "SELECT TRAINNAME, RUNSON, STARTTIME FROM TRAINS WHERE TRAINID = ?",
                [tickets[i].TrainID]
            );
            train = train[0];
            console.log(train);
            
            // Query to get station details
            let [stationDetails] = await pool.query(
                `SELECT 
                    DEPARTURE.CurrentDate AS DEPARTUREDATE, 
                    ARRIVAL.CurrentDate AS ARRIVALDATE, 
                    (ARRIVAL.TimefromStart - DEPARTURE.TimefromStart) AS DURATION, 
                    ARRIVAL.TimefromStart AS ARRIVALTIME, 
                    DEPARTURE.TimefromStart AS DEPARTURETIME 
                FROM 
                    ROUTES AS DEPARTURE 
                INNER JOIN 
                    ROUTES AS ARRIVAL 
                ON 
                    (DEPARTURE.RouteID = ARRIVAL.RouteID AND DEPARTURE.TrainID = ARRIVAL.TrainID) 
                WHERE 
                    DEPARTURE.CurrentStation = ? 
                    AND ARRIVAL.CurrentStation = ? 
                    AND ARRIVAL.RouteID = ?`,
                [tickets[i].SourceStation, tickets[i].DestinationStation, tickets[i].RouteID]
            );
            
            stationDetails = stationDetails[0];
            
            // Calculate departure and arrival times
            let h = parseInt((train.STARTTIME).slice(0, 2)), m = parseInt((train.STARTTIME).slice(3, 5));
            let dh = (h + Math.floor(stationDetails.DEPARTURETIME / 60)) % 24, dm = (m + stationDetails.DEPARTURETIME % 60) % 60;
            dh += Math.floor((m + stationDetails.DEPARTURETIME % 60) / 60);
            let departureTime = getTime(dh, dm);
            dh = (h + Math.floor(stationDetails.ARRIVALTIME / 60)) % 24;
            dm = (m + stationDetails.ARRIVALTIME % 60) % 60;
            let arrivalTime = getTime(dh, dm);
            
            // Construct the object to push into the result array
            obj.push({
                trainName: train.TRAINNAME,
                trainId: tickets[i].TrainID,
                noOfPassengers: tickets[i].NoOfPassenger,
                departureStation: tickets[i].SourceStation,
                departureTime: departureTime,
                departureDate: stationDetails.DEPARTUREDATE,
                durationHours: Math.floor(stationDetails.DURATION / 60),
                durationMinutes: stationDetails.DURATION % 60,
                runsOn: train.RUNSON,
                arrivalStation: tickets[i].DestinationStation,
                arrivalTime: arrivalTime,
                arrivalDate: stationDetails.ARRIVALDATE,
                ticketId: tickets[i].TicketID
            });
        }
        console.log(obj);
        res.json(obj);
    } catch (err) {
        console.log(err);
        res.json(obj);
    }
});


app.post("/bookTicket", async(req, res) =>{
    try {
        req = req.body;
        console.log(req.passengers);  
        
        // Insert into Tickets table and get the auto-generated TicketID
        const [newTicket] = await pool.query(
            "INSERT INTO Tickets (UserID, RouteID, TrainID, SourceStation, DestinationStation, Price, Email, ContactNo, NoOfPassenger) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?);",
            [req.userId, req.routeId, req.trainId, req.sourceStation.toLowerCase(), req.destinationStation.toLowerCase(), req.price, req.email, req.contactno, req.passengers.length]
        );
        
        // Get the inserted TicketID
        const ticketId = newTicket.insertId;
        console.log(ticketId);
        
        // Insert each passenger associated with this ticket
        for(let i = 0; i < req.passengers.length; i++){
            await pool.query(
                "INSERT INTO Passengers (TicketID, Name, Age, Gender) VALUES(?, ?, ?, ?);",
                [ticketId, req.passengers[i].name.toLowerCase(), req.passengers[i].age, req.passengers[i].gender]
            );
        }
        
        // Update the remaining seats in the Routes table
        await pool.query(
            "UPDATE Routes SET RemainingSeats = (RemainingSeats - ?) WHERE TimefromStart >= (SELECT TimefromStart FROM Routes WHERE CurrentStation = ? AND RouteID = ? AND TrainID = ?) AND TimefromStart < (SELECT TimefromStart FROM Routes WHERE CurrentStation = ? AND RouteID = ? AND TrainID = ?) AND RouteID = ? AND TrainID = ?;",
            [req.passengers.length, req.sourceStation.toLowerCase(), req.routeId, req.trainId, req.destinationStation.toLowerCase(), req.routeId, req.trainId, req.routeId, req.trainId]
        );
        
        res.json({created: true});
    } catch (err) {
        res.json({created: false});
        console.log(err);
    }
});

app.post("/addTrain", async (req, res) => {
    req = req.body;
    console.log(req.runson);
    console.log(weekday[req.runson]);
    let d1 = getNextDay(new Date(), weekday[req.runson]), 
        d2 = getNextDay(d1, weekday[req.runson]);

    try {
        console.log(req);
        let maxRouteIdResult = await pool.query(
            "SELECT MAX(ROUTEID) AS max FROM ROUTES;"
        );
        let maxRouteId = maxRouteIdResult[0][0].max; // Adjusting based on your query results
        
        console.log(maxRouteId);

        // Insert new train and get the TrainID
        let newTrain = await pool.query(
            "INSERT INTO Trains (TrainName, RunsOn, TotalSeats, StartTime) VALUES (?, ?, ?, ?);",
            [req.trainName.toLowerCase(), req.runson.toLowerCase(), req.totalseats, req.starttime]
        );

        // Fetch the last inserted TrainID
        let newTrainIdResult = await pool.query("SELECT LAST_INSERT_ID() AS TrainID;");
        let newTrainId = newTrainIdResult[0][0].TrainID;

        // Insert routes for the first date
        for (let i = 0; i < req.routes.length; i++) {
            await pool.query(
                "INSERT INTO Routes (TrainID, CurrentStation, RemainingSeats, TimefromStart, CurrentDate, RouteID) VALUES (?, ?, ?, ?, ?, ?);",
                [newTrainId, req.routes[i].station.toLowerCase(), req.totalseats, req.routes[i].timeFromStart, d1, maxRouteId + 1]
            );
        }

        // Insert routes for the second date
        for (let i = 0; i < req.routes.length; i++) {
            await pool.query(
                "INSERT INTO Routes (TrainID, CurrentStation, RemainingSeats, TimefromStart, CurrentDate, RouteID) VALUES (?, ?, ?, ?, ?, ?);",
                [newTrainId, req.routes[i].station.toLowerCase(), req.totalseats, req.routes[i].timeFromStart, d2, maxRouteId + 2]
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.log(err);
        res.json({ success: false });
    }
});


app.listen(5050, () => {
    console.log("Server has started on port 5050");
});