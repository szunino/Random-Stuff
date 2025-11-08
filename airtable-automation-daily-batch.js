/**
 * Airtable Automation Script: Daily Medical License Status Batch Update
 *
 * This script processes multiple records and updates their Status fields.
 * Designed for daily scheduled automations.
 *
 * Required Fields:
 * - State (Single line text)
 * - License Number (Single line text)
 * - Status (Single select or Single line text)
 *
 * Output Variables (accessible in subsequent automation steps):
 * - recordsUpdated: Number of records updated (e.g., 47)
 * - summary: Summary message (e.g., "Updated 47 records")
 *
 * Setup Instructions:
 * 1. Create an automation in Airtable
 * 2. Trigger: "At a scheduled time" (daily)
 * 3. Action: "Run a script"
 * 4. Paste this script
 * 5. Update table name on line 26 if needed
 * 6. (Optional) Add subsequent steps that use output variables
 */

// Configuration
const API_URL = 'https://api.medicalsearch.licensy.ai/api/v1/medical/search-license-by-number/';
const API_KEY = 'ck_75ea45bff92f02dc0560c640e727f2e7';

// Get the table
let table = base.getTable('Medical Licenses'); // Change to your table name

// Get all records with State and License Number
let query = await table.selectRecordsAsync({fields: ['State', 'License Number', 'Status']});
let records = query.records;

let statusResults = [];
let updates = [];

// Process each record
for (let record of records) {
    let state = record.getCellValue('State');
    let licenseNumber = record.getCellValue('License Number');

    // Skip records without required fields
    if (!state || !licenseNumber) {
        continue;
    }

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

            // Collect status for output
            statusResults.push(status);

            // Prepare update
            updates.push({
                id: record.id,
                fields: { 'Status': status }
            });
        }

    } catch (error) {
        // Silent fail, continue processing
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
}

// Batch update records (50 at a time per Airtable limit)
while (updates.length > 0) {
    let batch = updates.slice(0, 50);
    await table.updateRecordsAsync(batch);
    updates = updates.slice(50);
}

query.unload();

// Log summary
console.log(`Updated ${statusResults.length} records`);

// Set output variable for use in subsequent automation steps
output.set('recordsUpdated', statusResults.length);
output.set('summary', `Updated ${statusResults.length} records`);
