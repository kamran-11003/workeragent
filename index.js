import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

async function getGoogleAccessToken(refreshToken, clientId, clientSecret) {
  const url = "https://oauth2.googleapis.com/token";
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("refresh_token", refreshToken);
  params.append("grant_type", "refresh_token");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to refresh token");
  return data.access_token;
}

app.post("/crm-action", async (req, res) => {
  const { crmType, crmApiKey, action, payload, calendarId, clientId, company } = req.body;
  console.log("Incoming CRM Action:", req.body);

  try {
    // Normalize crmType (remove spaces, lower-case)
    const crm = crmType.replace(/\s+/g, "").toLowerCase();

    // ✅ Google Sheets
    if (crm === "googlesheets") {
      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${calendarId}/values/Bookings!A1:append?valueInputOption=USER_ENTERED`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${crmApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          values: [[payload.name, payload.email, payload.phone, payload.service, payload.startTime, payload.endTime]]
        })
      });
      return res.json(await response.json());
    }

    // ✅ HubSpot
    if (crm === "hubspot") {
      const response = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${crmApiKey}`
        },
        body: JSON.stringify({
          properties: {
            firstname: payload.name,
            email: payload.email,
            phone: payload.phone
          }
        })
      });
      return res.json(await response.json());
    }

    // ✅ Pipedrive
    if (crm === "pipedrive") {
      const response = await fetch(`https://api.pipedrive.com/v1/persons?api_token=${crmApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          phone: payload.phone
        })
      });
      return res.json(await response.json());
    }

    // ✅ Airtable
    if (crm === "airtable") {
      const response = await fetch("https://api.airtable.com/v0/YOUR_BASE_ID/Contacts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${crmApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fields: {
            Name: payload.name,
            Email: payload.email,
            Phone: payload.phone
          }
        })
      });
      return res.json(await response.json());
    }

    // ✅ Google Calendar
    if (crm === "googlecalendar") {
      const accessToken = await getGoogleAccessToken(
        crmApiKey, // refresh token
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      const event = {
        summary: `${payload.service} Appointment`,
        description: `Booking for ${payload.name}, phone: ${payload.phone}, email: ${payload.email}`,
        start: {
          dateTime: payload.startTime,
          timeZone: "Europe/Stockholm"
        },
        end: {
          dateTime: payload.endTime,
          timeZone: "Europe/Stockholm"
        }
      };

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(event)
      });

      return res.json(await response.json());
    }

    return res.status(400).json({ error: "Unsupported CRM type" });
  } catch (e) {
    console.error("CRM Action Error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log("CRM Webhook running on port 3000"));
