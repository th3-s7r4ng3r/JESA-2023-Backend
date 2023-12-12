const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const axios = require("axios");
const cors = require("cors");
const app = express();

// Server configuration
const PORT = 8080;
const attendeesFile = path.join(__dirname, "data", "attendees.json");

// Middleware to parse JSON in request body
app.use(express.json());
// Middleware to enable CORS
const corsOptions = {
  origin: ["https://www.jesa.lk", "http://localhost:5173"],
};
app.use(cors(corsOptions));

// Middleware to load user data
const loadUserData = async (req, res, next) => {
  try {
    const data = await fs.readFile(attendeesFile, "utf-8");
    req.users = JSON.parse(data); // Attach users to the request object
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Use the middleware for all routes that need user data
app.use(loadUserData);

// Function to send SMS
async function sendSMS(recipientNo, atendeeName) {
  try {
    // configs for api call
    const apiUrl = "https://dashboard.smsapi.lk/api/v3/sms/send";
    const apiToken = "";
    // const apiToken = "41|GuVkuGRBlvf8AhMikKJcgXh8UYqMjPhfpiWARx4P";
    const senderId = "JESA 2023";
    const message = `Hi ${atendeeName}, Welcome to JESA 2023! We are glad to have you onboard. Please enjoy the event!`;

    // Request Header Parameters
    const headers = {
      Authorization: `Bearer ${apiToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    // Request Body Parameters
    const requestBody = {
      recipient: recipientNo,
      sender_id: senderId,
      type: "plain",
      message: message,
    };

    // Make the HTTP POST request
    const response = await axios.post(apiUrl, requestBody, { headers });

    // Log the response or handle it as needed
    console.log("SMS API Response:", response.data);

    // Return the response
    return response.data;
  } catch (error) {
    // Log and handle errors
    console.error("Error sending SMS:", error.message);
    throw error;
  }
}
async function callSendSMS(contactNo, name, res) {
  // Api call to send sms
  const smsResponse = await sendSMS(contactNo, name);
  if (smsResponse.status === "success") {
    return res.json({
      message: "Attendee marked successfully!",
      sms: "SMS sent successfully!",
    });
  } else {
    return res.json({
      message: "Attendee marked successfully!",
      sms: "SMS sent failed!",
      error: smsResponse.message,
    });
  }
}

// Routes
// Get all attendees
app.get("/user/list", async (req, res) => {
  try {
    // Access users from the request object
    const users = req.users;
    return res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Download attendees as a csv file
app.get("/user/list-download", async (req, res) => {
  try {
    // Access users from the request object
    const users = req.users;

    // Create a CSV writer
    const csvWriter = createCsvWriter({
      path: path.join(__dirname, "data", "attendees.csv"),
      header: [
        { id: "id", title: "ID" },
        { id: "name", title: "Name" },
        { id: "contactNo", title: "Contact Number" },
        { id: "award", title: "Award" },
        { id: "category", title: "Category" },
        { id: "attended", title: "Attended" },
      ],
    });

    // Write all users to CSV file
    await csvWriter.writeRecords(users);

    // Set headers for the download
    res.setHeader("Content-Disposition", "attachment; filename=attendees.csv");
    res.setHeader("Content-Type", "text/csv");

    // Stream the file to the response
    const csvFile = path.join(__dirname, "data", "attendees.csv");
    res.download(csvFile);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Mark the attendance
app.post("/user/mark/:contactNo", async (req, res) => {
  try {
    const contactNo = req.params.contactNo;

    // Access users from the request object
    const users = req.users;

    // Find the user by phone number
    const userToUpdate = users.find((user) => user.contactNo === contactNo);

    if (userToUpdate) {
      // Update the attended field
      userToUpdate.attended = true;

      // Write the updated data back to the file
      await fs.writeFile(attendeesFile, JSON.stringify(users, null, 2));
      // Api call to send sms
      callSendSMS(contactNo, userToUpdate.name, res);
    } else {
      return res.status(404).json({ error: "Attendee not found!" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add attendee
app.post("/user/add", async (req, res) => {
  try {
    const newAttendee = req.body;

    // Access users from the request object
    const users = req.users;

    // Calculate the new ID using the array index
    newAttendee.id = `${users.length + 1}`;
    newAttendee.attended = true;

    // Add the new attendee to the array
    users.push(newAttendee);

    // Write the updated data back to the file
    await fs.writeFile(attendeesFile, JSON.stringify(users, null, 2));
    // Api call to send sms
    callSendSMS(newAttendee.contactNo, newAttendee.name, res);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update attendee by ID
app.put("/user/update/:id", async (req, res) => {
  try {
    const attendeeId = req.params.id;
    const updatedAttendee = req.body;

    // Access users from the request object
    const users = req.users;
    updatedAttendee.attended = true;

    // Find the index of the attendee with the given ID
    const indexToUpdate = users.findIndex((user) => user.id === attendeeId);

    if (indexToUpdate !== -1) {
      // Update the attendee
      users[indexToUpdate] = { ...users[indexToUpdate], ...updatedAttendee };

      // Write the updated data back to the file
      await fs.writeFile(attendeesFile, JSON.stringify(users, null, 2));
      // Api call to send sms
      callSendSMS(updatedAttendee.contactNo, updatedAttendee.name, res);
    } else {
      return res.status(404).json({ error: "Attendee not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
