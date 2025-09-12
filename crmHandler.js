import fetch from "node-fetch";

// 🔑 Hardcoded Google OAuth2 credentials
const GOOGLE_CLIENT_ID = "608139497039-dn2gs56il0c0799faihe1b9lir7b3bs7.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "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";
const GOOGLE_REFRESH_TOKEN = "YOUR_REFRESH_TOKEN_HERE";

// --- Utility to get Google Calendar Access Token ---
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

// --- Main CRM handler ---
export async function handleCrmAction(req, res) {
  const { crmType, crmApiKey, action, payload, calendarId, clientId, company } = req.body;
  console.log("Incoming CRM Action:", req.body);

  try {
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
        GOOGLE_REFRESH_TOKEN,
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET
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
}
