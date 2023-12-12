# JESA'23 Attendee Management System

This is a simple Express.js application for managing attendees at the JESA'23 event. It includes functionality to list attendees, download attendee details as a CSV file, mark attendance, add attendees, and update attendee details from and to a json file located in the backend server.

## Getting Started

### Prerequisites

- Node.js
- npm (Node Package Manager)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/th3-s7r4ng3r/JESA-2023-Backend.git
   ```

2. Navigate to the project directory:

   ```bash
   cd JESA-2023-Backend
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the server:

   ```bash
   npm run dev
   ```

5. Send requests to http://localhost:8080

### Importrant

This backend api does not link to any database servers. All the data files are stored in the `\data\` directory.

## Features

### List Attendees

`GET /user/list`
Retrieves a list of all attendees as a JSON array.

### Download Attendees as CSV

`GET /user/list-download`
Downloads attendee details as a CSV file.

### Mark Attendance

`POST /user/mark/:contactNo`
Marks attendance for an attendee with the specified contact number.

### Add Attendee

`POST /user/add`
Adds a new attendee to the list. Provide the user details as a JSON object in the request body.

### Update Attendee

`PUT /user/update/:id`
Updates attendee details based on the provided ID. Also send user details as a JSON object in the request body.

## SMS Notification

The application includes an SMS notification feature. After marking attendance or adding a new attendee, an SMS is sent using the [SMS API](https://dashboard.smsapi.lk). If planing to use the same sms api gateway, create a `api-keys.json` file in the `\data\` directory and specify the key inside `smsApiKey` field as a json object.
