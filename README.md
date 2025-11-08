# Airtable Medical License Lookup Script

This script integrates with the Licensy Medical Search API to look up medical licenses directly from your Airtable base.

## 🧪 First Time? Test the API First!

**New users:** Start with the testing scripts to verify everything works!

| Script | Purpose |
|--------|---------|
| `airtable-test-extension.js` | Quick test - no table needed |
| `airtable-test-with-table.js` | Test with your actual table |

👉 **[See TESTING.md for complete testing guide](TESTING.md)**

## Quick Start - Which Script Should I Use?

| Your Need | Script to Use | Type |
|-----------|---------------|------|
| 🧪 Test the API first | `airtable-test-extension.js` or `airtable-test-with-table.js` | Testing |
| 🔄 Auto-update when I add new records | `airtable-automation-license-status.js` | Automation |
| 📅 Daily automatic updates for all records | `airtable-automation-daily-batch.js` | Automation |
| 👆 Manually look up specific records | `airtable-medical-license-lookup.js` | Manual/Interactive |
| 🔍 Quick batch lookup of all records | `airtable-medical-license-lookup-simple.js` | Manual/Batch |

**💡 Recommended:** Test first, then use the automation scripts for hands-free operation!

## Overview

The script queries the [Licensy Medical Search API](https://api.medicalsearch.licensy.ai/) using State and License Number fields from your Airtable records and returns the license **Status** (Active/Inactive) along with other detailed medical license information.

## Features

- ✅ **Extracts license Status** (Active/Inactive) from API response
- ✅ Look up single or multiple medical licenses
- ✅ Process all records or just selected ones
- ✅ Automatic error handling and retry logic
- ✅ Stores Status in Airtable automatically
- ✅ Optional storage of full API responses in Airtable
- ✅ Rate limiting protection
- ✅ Detailed progress reporting

## Setup Instructions

### 1. Prepare Your Airtable Base

Create a table with at least these fields:

| Field Name | Field Type | Required | Description |
|------------|------------|----------|-------------|
| State | Single line text | Yes | State where license was issued |
| License Number | Single line text | Yes | Medical license number |
| Status | Single select or Single line text | Recommended | Stores "Active" or "Inactive" status |
| API Response | Long text | Optional | Stores full API response data |

**Important Notes:**
- The **Status** field is highly recommended - this is where the license status will be stored
- For the Status field, use "Single select" with options: Active, Inactive, Unknown (or just use Single line text)
- The "API Response" field is optional but useful for storing complete API response data

### 2. Install the Script

1. In your Airtable base, click on "Extensions" (puzzle piece icon)
2. Click "+ Add an extension"
3. Choose "Scripting"
4. Copy the contents of `airtable-medical-license-lookup.js` and paste it into the script editor
5. Update the table name on line 33:
   ```javascript
   let table = base.getTable('Medical Licenses'); // Change to your table name
   ```

### 3. Configure Field Names (if different)

If your field names differ from the defaults, update the `FIELD_NAMES` object (lines 30-35):

```javascript
const FIELD_NAMES = {
    state: 'Your State Field Name',
    licenseNumber: 'Your License Number Field Name',
    status: 'Your Status Field Name', // Where license status will be stored
    apiResponse: 'Your Response Field Name' // Optional
};
```

### 4. Run the Script

1. Click the "Run" button in the script editor
2. Choose which records to process:
   - **Selected Records**: Process specific records you've selected
   - **All Records**: Process every record in the table
   - **Single Record**: Process just one record
3. The script will display progress and results in real-time, showing the **Status** for each license
4. When prompted, choose "Yes" to save the Status (and optionally full API responses) back to your table

## Automation Setup (Recommended)

For automatic license status updates, use the automation scripts instead of manual execution.

### Available Files

| File | Use Case | Output |
|------|----------|--------|
| `airtable-automation-license-status.js` | Triggered when State & License Number are filled | Just the Status value (e.g., "Active") |
| `airtable-automation-daily-batch.js` | Daily scheduled run for all records | Summary: "Updated X records" |
| `airtable-medical-license-lookup.js` | Manual interactive script | Full details with user prompts |
| `airtable-medical-license-lookup-simple.js` | Manual batch processing | All records with full output |

### Option 1: Automatic Status Update (Per Record)

**Triggers when State AND License Number fields are populated**

1. In your Airtable base, click "Automations" (lightning bolt icon)
2. Click "Create automation"
3. **Configure Trigger:**
   - Choose "When record matches conditions"
   - Table: Your table name
   - Conditions:
     - "State" is not empty
     - AND "License Number" is not empty
     - AND "Status" is empty (optional, to avoid re-running)
4. **Add Action:**
   - Click "+ Add action"
   - Choose "Run script"
   - Copy contents of `airtable-automation-license-status.js`
   - Update table name on line 30
5. **Configure Input:**
   - Click "Choose field" for `recordId`
   - Select "Record ID" from the trigger
6. **Test & Turn On:**
   - Click "Test" to verify it works
   - Toggle automation ON

**Output:** The script outputs only the Status value (e.g., "Active", "Inactive", "Expired")

### Option 2: Daily Batch Update

**Runs once per day to update all records**

1. In your Airtable base, click "Automations"
2. Click "Create automation"
3. **Configure Trigger:**
   - Choose "At a scheduled time"
   - Frequency: Daily
   - Time: Choose preferred time (e.g., 2:00 AM)
4. **Add Action:**
   - Click "+ Add action"
   - Choose "Run script"
   - Copy contents of `airtable-automation-daily-batch.js`
   - Update table name on line 23
5. **Test & Turn On:**
   - Click "Test" to verify
   - Toggle automation ON

**Output:** Summary message like "Updated 47 records"

### Automation Best Practices

- ✅ Use Option 1 for real-time updates when adding new licenses
- ✅ Use Option 2 for periodic status refresh of existing licenses
- ✅ You can use both automations together
- ✅ Set Status field to empty if you want to re-run the lookup
- ⚠️ Automations run automatically - no user confirmation needed

## API Configuration

The script is pre-configured with:

- **API Endpoint**: `https://api.medicalsearch.licensy.ai/api/v1/medical/search-license-by-number/`
- **API Key**: `ck_75ea45bff92f02dc0560c640e727f2e7`
- **Content Type**: `application/x-www-form-urlencoded`

### Changing the API Key

To use a different API key, update line 17:

```javascript
apiKey: 'your_new_api_key_here',
```

## Example Usage

### Example 1: Look up a single license

1. Select a record in your table
2. Run the script
3. Choose "Single Record"
4. Select the record you want to look up
5. View the results in the script output

### Example 2: Batch process all records

1. Run the script
2. Choose "All Records"
3. The script will process each record and display results
4. Choose "Yes" when prompted to save responses to your table

## API Response Format

The API returns detailed information about medical licenses. Example response for License Number "2143" in "Alabama":

```json
{
  "Full_Name": "Davis, Russell William",
  "License_Type": "DO",
  "License_Number": "2143",
  "Status": "Inactive",
  "Issued": "1/22/2020",
  "Expired": "12/31/2022",
  "State": "Alabama"
}
```

**The script automatically extracts the `Status` field and stores it in your Airtable Status field.**

## Error Handling

The script includes comprehensive error handling:

- ✅ Skips records with missing State or License Number
- ✅ Displays HTTP error codes and messages
- ✅ Catches and reports network exceptions
- ✅ Includes rate limiting delays (500ms between requests)

## Troubleshooting

### "Field not found" error
- Verify your field names match those in the `FIELD_NAMES` configuration
- Check that fields exist in your table

### "Table not found" error
- Update the table name on line 33 to match your table's name exactly

### API returns errors
- Verify the license number and state are valid
- Check that the API key is correct and active
- Ensure your network allows requests to the Licensy API

### Rate limiting
- The script includes a 500ms delay between requests
- For large batches, consider processing in smaller groups

## Advanced Customization

### Modify the delay between requests

Change line 92 to adjust the delay (in milliseconds):

```javascript
await sleep(1000); // 1 second delay
```

### Add additional fields to store

The script automatically stores the Status field. To store additional fields like Full Name or Expiration Date, modify the update logic (around lines 114-131) to include more fields:

```javascript
// Add additional fields if they exist in your table
if (table.fields.find(f => f.name === 'Full Name')) {
    updateFields['Full Name'] = result.data.Full_Name;
}
if (table.fields.find(f => f.name === 'Expired')) {
    updateFields['Expired'] = result.data.Expired;
}
```

## Security Notes

⚠️ **Important**: This script contains an API key. If you're sharing this base:

1. Store the API key in a secure location
2. Use Airtable's environment variables if available
3. Restrict base access to authorized users only
4. Consider rotating the API key periodically

## License

This script is provided as-is for use with the Licensy Medical Search API.

## Support

For API-related questions, contact Licensy support.
For script issues, please check the troubleshooting section or modify as needed.

---

**Last Updated**: November 2025
**API Version**: v1
**Airtable Scripting API**: Compatible with current version
