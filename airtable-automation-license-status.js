/**
 * Airtable Automation Script: Medical License Status Lookup
 *
 * This script is designed to run in Airtable automations.
 * It queries the Licensy Medical Search API and updates the Status field.
 *
 * Automation Triggers:
 * - When License Number and State fields are filled
 *
 * Required Fields:
 * - State (Single line text)
 * - License Number (Single line text)
 * - Status (Single select or Single line text) - Auto-populated by this script
 *
 * Output Variables (accessible in subsequent automation steps):
 * - status: The license status value (e.g., "Active", "Inactive", "Error")
 *
 * Setup Instructions:
 * 1. Create an automation in Airtable
 * 2. Trigger: "When record matches conditions" (State is not empty AND License Number is not empty)
 * 3. Action: "Run a script"
 * 4. Paste this script
 * 5. Configure input variable: recordId (from trigger step)
 * 6. (Optional) Add subsequent steps that use the "status" output variable
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
    console.log('Record not found');
    query.unload();
} else {
    let state = record.getCellValue('State');
    let licenseNumber = record.getCellValue('License Number');

    // Validate required fields
    if (!state || !licenseNumber) {
        console.log('Missing required fields');
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

                // Log the status value
                console.log(`Status: ${status}`);

                // Update the Status field in Airtable
                await table.updateRecordAsync(record.id, {
                    'Status': status
                });

                // Set output variable for use in subsequent automation steps
                output.set('status', status);

            } else {
                console.log(`API Error: ${response.status}`);
                output.set('status', 'Error');
            }

        } catch (error) {
            console.log(`Error: ${error.message}`);
            output.set('status', 'Error');
        }

        query.unload();
    }
}
