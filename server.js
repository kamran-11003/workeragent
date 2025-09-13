import express from "express";
import { google } from "googleapis";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(__dirname));

// Initialize Google Sheets API with service account
const auth = new google.auth.GoogleAuth({
  keyFile: join(__dirname, 'eastern-surface-466900-f1-227422b976a6.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Hardcoded configuration
const SPREADSHEET_ID = "1vDJ10oYn7tP9Et1l8poKoYZMXfVCdbe7PNuNZ0WSQhM";
const SHEET_NAME = "Sheet1"; // Changed from "Clients" to "Sheet1" based on the error

// --- Google Sheets CRUD Operations ---

// Create new record
app.post("/api/sheets/create", async (req, res) => {
  const { payload } = req.body;
  
  try {
    // Prepare the data array with all fields (extended structure)
    const values = [
      payload.clientId,
      payload.companyName,
      payload.twilioNumber,
      payload.contactEmail,
      payload.crmConnected,
      payload.calendarId,
      payload.status,
      payload.services,
      payload.openingHours,
      payload.bookingRules,
      payload.crmApiKey,
      payload.hubspotApiKey || '',
      payload.pipedriveApiToken || '',
      payload.airtableApiKey || '',
      payload.airtableBaseId || '',
      payload.googleCalendarClientId || '',
      payload.googleCalendarClientSecret || '',
      payload.googleCalendarRefreshToken || '',
      payload.googleSheetsServiceAccountEmail || '',
      payload.googleSheetsServiceAccountKey || ''
    ];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values]
      }
    });
    
    return res.json({ 
      success: true, 
      data: response.data, 
      message: 'Record created successfully!' 
    });
  } catch (error) {
    console.error("Create Sheet Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Read data
app.post("/api/sheets/read", async (req, res) => {
  const { range } = req.body;
  
  try {
    const fullRange = range ? `${SHEET_NAME}!${range}` : `${SHEET_NAME}!A1:Z1000`;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: fullRange
    });
    
    return res.json({ 
      success: true, 
      data: response.data, 
      message: 'Data read successfully!' 
    });
  } catch (error) {
    console.error("Read Sheet Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update record
app.post("/api/sheets/update", async (req, res) => {
  const { row, payload } = req.body;
  
  try {
    // Get current row data to merge with updates (extended range)
    const readResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${row}:T${row}`
    });
    
    // Merge current data with updates (extended structure)
    let currentData = readResponse.data.values?.[0] || new Array(20).fill('');
    
    // Update specific fields if provided (extended field map)
    const fieldMap = {
      clientId: 0,
      companyName: 1,
      twilioNumber: 2,
      contactEmail: 3,
      crmConnected: 4,
      calendarId: 5,
      status: 6,
      services: 7,
      openingHours: 8,
      bookingRules: 9,
      crmApiKey: 10,
      hubspotApiKey: 11,
      pipedriveApiToken: 12,
      airtableApiKey: 13,
      airtableBaseId: 14,
      googleCalendarClientId: 15,
      googleCalendarClientSecret: 16,
      googleCalendarRefreshToken: 17,
      googleSheetsServiceAccountEmail: 18,
      googleSheetsServiceAccountKey: 19
    };
    
    Object.keys(payload).forEach(key => {
      if (payload[key] && fieldMap[key] !== undefined) {
        currentData[fieldMap[key]] = payload[key];
      }
    });
    
    // Update the row (extended range)
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${row}:T${row}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [currentData]
      }
    });
    
    return res.json({ 
      success: true, 
      data: response.data, 
      message: 'Record updated successfully!' 
    });
  } catch (error) {
    console.error("Update Sheet Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete row
app.post("/api/sheets/delete", async (req, res) => {
  const { row } = req.body;
  
  try {
    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0, // Assuming first sheet
              dimension: "ROWS",
              startIndex: parseInt(row) - 1,
              endIndex: parseInt(row)
            }
          }
        }]
      }
    });
    
    return res.json({ 
      success: true, 
      data: response.data, 
      message: 'Row deleted successfully!' 
    });
  } catch (error) {
    console.error("Delete Sheet Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Clear sheet
app.post("/api/sheets/clear", async (req, res) => {
  
  try {
    const response = await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:Z1000`
    });
    
    return res.json({ 
      success: true, 
      data: response.data, 
      message: 'Sheet cleared successfully!' 
    });
  } catch (error) {
    console.error("Clear Sheet Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// --- Serve the HTML interface ---
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// --- N8N Workflow API Endpoints ---

// Helper function to generate available slots
function generateAvailableSlots(date, openingHours, services) {
  // Parse opening hours (e.g., "Mon–Fri: 09–18")
  const slots = [];
  
  // Default slots if no opening hours specified
  const defaultSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];
  
  // In a real implementation, you would:
  // 1. Parse the opening hours
  // 2. Check existing appointments for that date
  // 3. Generate available time slots
  // 4. Filter based on service duration
  
  return defaultSlots.map(time => ({
    time: time,
    available: true,
    service: services.split(';')[0]?.trim() || 'General Service'
  }));
}

// Helper function to get client data by phone number
async function getClientByPhone(phoneNumber) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z1000`
  });

  const rows = response.data.values || [];
  if (rows.length === 0) {
    throw new Error('No data found in sheet');
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);
  
  const phoneColumnIndex = headers.findIndex(header => 
    header.toLowerCase().includes('twilio') || header.toLowerCase().includes('phone')
  );
  
  if (phoneColumnIndex === -1) {
    throw new Error('Phone number column not found');
  }

  const clientRecord = dataRows.find(row => row[phoneColumnIndex] === phoneNumber);
  
  if (!clientRecord) {
    throw new Error(`No client found with phone number: ${phoneNumber}`);
  }

  const clientData = {};
  headers.forEach((header, index) => {
    clientData[header] = clientRecord[index] || '';
  });

  return clientData;
}

// Helper function to get Google access token
async function getGoogleAccessToken(refreshToken, clientId, clientSecret) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  return data.access_token;
}

// --- CRM Action Endpoint ---
app.post("/crm-action", async (req, res) => {
  try {
    const { phoneNumber, action, payload } = req.body;
    
    console.log('🔄 CRM Action:', { phoneNumber, action, payload });
    
    // Validate required fields
    if (!phoneNumber || !action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phoneNumber, action',
        message: 'Please provide phoneNumber and action'
      });
    }

    // Get client data from Google Sheets using phone number
    const clientData = await getClientByPhone(phoneNumber);
    
    const crmType = clientData['CRM Connected'] || 'Google Sheets';
    const crmApiKey = clientData['CRM API Key / OAuth Token'] || '';
    const calendarId = clientData['Calendar ID'] || '';
    const clientId = clientData['Client ID'] || '';
    const company = clientData['Company Name'] || '';
    const services = clientData['Services'] || '';
    const openingHours = clientData['Opening Hours'] || '';
    const bookingRules = clientData['Booking Rules'] || '';
    
    // Extended CRM credentials
    const hubspotApiKey = clientData['HubSpot API Key'] || '';
    const pipedriveApiToken = clientData['Pipedrive API Token'] || '';
    const airtableApiKey = clientData['Airtable API Key'] || '';
    const airtableBaseId = clientData['Airtable Base ID'] || '';
    const googleCalendarClientId = clientData['Google Calendar Client ID'] || '';
    const googleCalendarClientSecret = clientData['Google Calendar Client Secret'] || '';
    const googleCalendarRefreshToken = clientData['Google Calendar Refresh Token'] || '';
    const googleSheetsServiceAccountEmail = clientData['Google Sheets Service Account Email'] || '';
    const googleSheetsServiceAccountKey = clientData['Google Sheets Service Account Key'] || '';

    console.log(`📊 Found client: ${company} (${crmType})`);

    // Handle different actions
    if (action === 'check_availability') {
      // Check availability action
      const date = payload?.date;
      if (!date) {
        return res.status(400).json({
          success: false,
          error: 'Missing date in payload',
          message: 'Please provide date in payload for check_availability action'
        });
      }

      // Generate available slots based on opening hours and date
      const availableSlots = generateAvailableSlots(date, openingHours, services);

      return res.json({
        success: true,
        action: 'check_availability',
        client: {
          companyName: company,
          crmType: crmType,
          phoneNumber: phoneNumber,
          services: services,
          openingHours: openingHours,
          bookingRules: bookingRules
        },
        date: date,
        availableSlots: availableSlots,
        message: `Found ${availableSlots.length} available slots for ${company} on ${date}`
      });
    }

    if (action === 'book_appointment') {
      // Book appointment action
      if (!payload) {
        return res.status(400).json({
          success: false,
          error: 'Missing payload for book_appointment action',
          message: 'Please provide payload with appointment details'
        });
      }

      // HubSpot
      if (crmType === "HubSpot") {
        const apiKey = hubspotApiKey || crmApiKey;
        const response = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            properties: {
              firstname: payload.name,
              email: payload.email,
              phone: payload.phone,
              service: payload.service,
              appointment_date: payload.startTime
            }
          })
        });
        const result = await response.json();
        return res.json({
          success: true,
          action: 'book_appointment',
          crmType: 'HubSpot',
          company: company,
          result: result
        });
      }

      // Pipedrive
      if (crmType === "Pipedrive") {
        const apiToken = pipedriveApiToken || crmApiKey;
        const response = await fetch(`https://api.pipedrive.com/v1/persons?api_token=${apiToken}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            service: payload.service,
            appointment_date: payload.startTime
          })
        });
        const result = await response.json();
        return res.json({
          success: true,
          action: 'book_appointment',
          crmType: 'Pipedrive',
          company: company,
          result: result
        });
      }

      // Airtable
      if (crmType === "Airtable") {
        const apiKey = airtableApiKey || crmApiKey;
        const baseId = airtableBaseId || 'YOUR_BASE_ID';
        
        const response = await fetch(`https://api.airtable.com/v0/${baseId}/Contacts`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fields: {
              Name: payload.name,
              Email: payload.email,
              Phone: payload.phone,
              Service: payload.service,
              "Start Time": payload.startTime,
              "End Time": payload.endTime
            }
          })
        });
        const result = await response.json();
        return res.json({
          success: true,
          action: 'book_appointment',
          crmType: 'Airtable',
          company: company,
          result: result
        });
      }

      // Google Calendar
      if (crmType === "Google Calendar") {
        // Use individual credential fields or fallback to JSON in CRM API Key
        let clientId, clientSecret, refreshToken;
        
        if (googleCalendarClientId && googleCalendarClientSecret && googleCalendarRefreshToken) {
          clientId = googleCalendarClientId;
          clientSecret = googleCalendarClientSecret;
          refreshToken = googleCalendarRefreshToken;
        } else {
          // Fallback to JSON format
          try {
            const googleCredentials = JSON.parse(crmApiKey);
            clientId = googleCredentials.client_id;
            clientSecret = googleCredentials.client_secret;
            refreshToken = googleCredentials.refresh_token;
          } catch (e) {
            throw new Error('Invalid Google Calendar credentials format');
          }
        }

        const accessToken = await getGoogleAccessToken(refreshToken, clientId, clientSecret);

        const event = {
          summary: `${payload.service} Appointment`,
          description: `Booking for ${payload.name}, phone: ${payload.phone}, email: ${payload.email}`,
          start: {
            dateTime: payload.startTime, // must be ISO string e.g. 2025-09-12T10:00:00+02:00
            timeZone: "Europe/Stockholm"
          },
          end: {
            dateTime: payload.endTime, // must be ISO string
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
        const result = await response.json();
        return res.json({
          success: true,
          action: 'book_appointment',
          crmType: 'Google Calendar',
          company: company,
          result: result
        });
      }

      // Google Sheets (fallback)
      if (crmType === "Google Sheets") {
        // For Google Sheets, we can add the appointment data to a new row
        const appointmentData = [
          new Date().toISOString(),
          payload.name || '',
          payload.phone || '',
          payload.email || '',
          payload.service || '',
          payload.startTime || '',
          payload.endTime || '',
          'Booked'
        ];

        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A:Z`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [appointmentData]
          }
        });

        return res.json({
          success: true,
          action: 'book_appointment',
          crmType: 'Google Sheets',
          company: company,
          result: { message: 'Appointment added to Google Sheets' }
        });
      }

      return res.status(400).json({
        success: false,
        error: "Unsupported CRM type for booking",
        message: `CRM type '${crmType}' is not supported for booking appointments`
      });
    }

    // Unsupported action
    res.status(400).json({
      success: false,
      error: "Unsupported action",
      message: `Action '${action}' is not supported. Use 'check_availability' or 'book_appointment'`
    });

  } catch (e) {
    console.error('❌ CRM Action Error:', e);
    res.status(500).json({
      success: false,
      error: e.message,
      message: 'Failed to perform CRM action'
    });
  }
});

// --- Health check ---
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Google Sheets CRUD API is running with Service Account authentication" 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Google Sheets CRUD Server running on port " + PORT);
  console.log("📊 Interface: http://localhost:" + PORT);
  console.log("🔧 Health Check: http://localhost:" + PORT + "/health");
  console.log("🔑 Using Service Account: clients@eastern-surface-466900-f1.iam.gserviceaccount.com");
  console.log("📊 Spreadsheet ID: " + SPREADSHEET_ID);
  console.log("📋 Sheet Name: " + SHEET_NAME);
  console.log("\n💡 No OAuth required - Service Account handles authentication automatically!");
  console.log("🎯 Everything is hardcoded - just start using the interface!");
  console.log("🌐 Ready for HTTPS deployment!");
});
