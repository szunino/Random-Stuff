/**
 * Airtable Automation Script: Medical License Status Lookup
 *
 * This script is designed to run in Airtable automations.
 * It queries the Licensy Medical Search API and returns ONLY the Status value.
 *
 * Automation Triggers:
 * - When License Number and State fields are filled
 * - Daily scheduled run
 *
 * Required Fields:
 * - State (Single line text)
 * - License Number (Single line text)
 * - Status (Single select or Single line text) - Auto-populated by this script
 *
 * Setup Instructions:
 * 1. Create an automation in Airtable
 * 2. Trigger: "When record matches conditions" (State is not empty AND License Number is not empty)
 *    OR "At a scheduled time" (daily)
 * 3. Action: "Run a script"
 * 4. Paste this script
 * 5. Configure input variable: recordId (from trigger)
 */

// Configuration
const API_URL = 'https://api.medicalsearch.licensy.ai/api/v1/medical/search-license-by-number/';
const API_KEY = 'ck_75ea45bff92f02dc0560c640e727f2e7';

// Get input configuration from automation
let inputConfig = input.config();
let recordId = inputConfig.recordId;

// Get the table
let table = base.getTable('Medical Licenses'); // Change to your table name

// Query the record
let query = await table.selectRecordsAsync({fields: ['State', 'License Number', 'Status']});
let record = query.records.find(r => r.id === recordId);

if (!record) {
    output.text('Record not found');
    query.unload();
} else {
    let state = record.getCellValue('State');
    let licenseNumber = record.getCellValue('License Number');

    // Validate required fields
    if (!state || !licenseNumber) {
        output.text('Missing required fields');
        query.unload();
    } else {
        try {
            // Build API request
            let payload = `License_Number=${encodeURIComponent(licenseNumber)}&State=${encodeURIComponent(state)}&credential_key=${API_KEY}`;

            // Call API
            let response = await remoteFetchAsync(API_URL, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: payload
            });

            if (response.ok) {
                let data = await response.json();
                let status = data.Status || 'Unknown';

                // Output ONLY the status value
                output.text(status);

                // Update the Status field in Airtable
                await table.updateRecordAsync(record.id, {
                    'Status': status
                });

            } else {
                output.text('API Error');
            }

        } catch (error) {
            output.text('Error');
        }

        query.unload();
    }
}
