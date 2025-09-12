import express from "express";
import fetch from "node-fetch";
import { handleCrmAction } from "./crmHandler.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for parsing form data

// --- Simple HTML form ---
app.get("/form", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>CRM Booking Form</title>
      </head>
      <body>
        <h2>Book Appointment</h2>
        <form action="/submit-form" method="POST">
          <label>Company:</label><br/>
          <input type="text" name="company" value="Salon Luxe" required/><br/><br/>

          <label>Client ID:</label><br/>
          <input type="text" name="clientId" value="C001" required/><br/><br/>

          <label>Name:</label><br/>
          <input type="text" name="name" required/><br/><br/>

          <label>Email:</label><br/>
          <input type="email" name="email" required/><br/><br/>

          <label>Phone:</label><br/>
          <input type="text" name="phone" required/><br/><br/>

          <label>Service:</label><br/>
          <input type="text" name="service" required/><br/><br/>

          <label>Start Time (ISO):</label><br/>
          <input type="text" name="startTime" placeholder="2025-09-12T10:00:00+02:00" required/><br/><br/>

          <label>End Time (ISO):</label><br/>
          <input type="text" name="endTime" placeholder="2025-09-12T11:00:00+02:00" required/><br/><br/>

          <label>Calendar ID (for Google Calendar or Sheets ID):</label><br/>
          <input type="text" name="calendarId" value="primary" required/><br/><br/>

          <label>CRM Type:</label><br/>
          <select name="crmType">
            <option value="googlecalendar">Google Calendar</option>
            <option value="googlesheets">Google Sheets</option>
            <option value="hubspot">HubSpot</option>
            <option value="pipedrive">Pipedrive</option>
            <option value="airtable">Airtable</option>
          </select><br/><br/>

          <button type="submit">Submit</button>
        </form>
      </body>
    </html>
  `);
});

// --- Route to handle form submission ---
app.post("/submit-form", async (req, res) => {
  const {
    company, clientId, name, email, phone, service,
    startTime, endTime, calendarId, crmType
  } = req.body;

  // Forward request into crmHandler
  req.body = {
    crmType,
    crmApiKey: "dummy_or_refresh_token_here",
    action: "BOOK_APPOINTMENT",
    payload: { name, email, phone, service, startTime, endTime },
    calendarId,
    clientId,
    company
  };

  return handleCrmAction(req, res);
});

// --- Direct API endpoint (for AI Agent / HTTP Request node) ---
app.post("/crm-action", handleCrmAction);

app.listen(3000, () => console.log("✅ CRM Webhook running on port 3000"));
