# Google Sheets CRUD with Service Account

A simple HTML interface for performing CRUD operations on Google Sheets using Service Account authentication.

## Features

- ✅ **Create** new client records
- ✅ **Read** data with table display
- ✅ **Update** existing records
- ✅ **Delete** specific rows
- ✅ **Clear** entire sheet
- ✅ **No OAuth required** - Service Account handles authentication
- ✅ **Everything hardcoded** - no manual configuration needed

## Configuration

**Hardcoded Settings:**
- **Spreadsheet ID:** `1vDJ10oYn7tP9Et1l8poKoYZMXfVCdbe7PNuNZ0WSQhM`
- **Sheet Name:** `Clients`
- **Service Account:** `clients@eastern-surface-466900-f1.iam.gserviceaccount.com`

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Share your Google Sheet:**
   - Open your Google Sheet
   - Click "Share" button
   - Add email: `clients@eastern-surface-466900-f1.iam.gserviceaccount.com`
   - Give "Editor" permissions

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open the interface:**
   ```
   http://localhost:3000
   ```

## Sheet Structure

The interface expects these columns in your Google Sheet:

| Column | Field | Description |
|--------|-------|-------------|
| A | Client ID | Unique identifier (e.g., C001) |
| B | Company Name | Business name (e.g., Dental Care) |
| C | Twilio Number | Phone number (e.g., 14155550101) |
| D | Contact Email | Business email (e.g., info@company.com) |
| E | CRM Connected | CRM type (Google Sheets, HubSpot, Airtable, Pipedrive, Google Calendar) |
| F | Calendar ID | Calendar identifier (e.g., company@gmail.com) |
| G | Status | Active/Inactive |
| H | Services | Service offerings (e.g., Checkup – 500 SEK; Cleaning – 700 SEK) |
| I | Opening Hours | Business hours (e.g., Mon–Fri: 09–18) |
| J | Booking Rules | Booking policies (e.g., 24h cancellation notice) |
| K | CRM API Key / OAuth Token | API credentials for the connected CRM |

## Usage

1. **Create Record:** Fill in the form and click "Create Record"
2. **Read Data:** Click "Read All Data" to see all records in a table
3. **Update Record:** Enter row number and fill in fields to update
4. **Delete Record:** Enter row number and click "Delete Row"
5. **Clear Sheet:** Click "Clear Entire Sheet" to remove all data

## API Endpoints

- `POST /api/sheets/create` - Create new record
- `POST /api/sheets/read` - Read data
- `POST /api/sheets/update` - Update record
- `POST /api/sheets/delete` - Delete row
- `POST /api/sheets/clear` - Clear sheet
- `GET /health` - Health check

## Security

- Uses Service Account authentication (no user login required)
- Service Account has Editor access to the specific Google Sheet
- No OAuth flow or manual token management needed

## Troubleshooting

**Common Issues:**

1. **403 Forbidden:** Make sure the service account email has Editor access to your Google Sheet
2. **404 Not Found:** Verify the Spreadsheet ID is correct
3. **400 Bad Request:** Check that your sheet has the expected column structure

**Service Account Email:** `clients@eastern-surface-466900-f1.iam.gserviceaccount.com`

Make sure this email has Editor permissions on your Google Sheet!
