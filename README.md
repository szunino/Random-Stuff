# Airtable Medical License Lookup Script

This script integrates with the Licensy Medical Search API to look up medical licenses directly from your Airtable base.

## Overview

The script queries the [Licensy Medical Search API](https://api.medicalsearch.licensy.ai/) using State and License Number fields from your Airtable records and retrieves detailed medical license information.

## Features

- ✅ Look up single or multiple medical licenses
- ✅ Process all records or just selected ones
- ✅ Automatic error handling and retry logic
- ✅ Optional storage of API responses in Airtable
- ✅ Rate limiting protection
- ✅ Detailed progress reporting

## Setup Instructions

### 1. Prepare Your Airtable Base

Create a table with at least these fields:

| Field Name | Field Type | Required |
|------------|------------|----------|
| State | Single line text | Yes |
| License Number | Single line text | Yes |
| API Response | Long text | Optional |

**Note:** The "API Response" field is optional but recommended for storing the full API response data.

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

If your field names differ from the defaults, update the `FIELD_NAMES` object (lines 22-26):

```javascript
const FIELD_NAMES = {
    state: 'Your State Field Name',
    licenseNumber: 'Your License Number Field Name',
    apiResponse: 'Your Response Field Name' // Optional
};
```

### 4. Run the Script

1. Click the "Run" button in the script editor
2. Choose which records to process:
   - **Selected Records**: Process specific records you've selected
   - **All Records**: Process every record in the table
   - **Single Record**: Process just one record
3. The script will display progress and results in real-time
4. Optionally save the API responses back to your table

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

The API returns detailed information about medical licenses. Example response:

```json
{
  "license_number": "12345",
  "state": "CA",
  "status": "Active",
  "name": "John Doe",
  "profession": "Medical Doctor",
  "issue_date": "2015-01-15",
  "expiration_date": "2025-01-15",
  // ... additional fields
}
```

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

Modify the update object (lines 85-90) to include more fields:

```javascript
updates.push({
    id: record.id,
    fields: {
        [FIELD_NAMES.apiResponse]: JSON.stringify(result.data, null, 2),
        'Status': result.data.status,
        'Expiration Date': result.data.expiration_date
    }
});
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
