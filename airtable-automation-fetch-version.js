/**
 * Airtable Automation Script: Medical License Status Lookup - FETCH VERSION
 *
 * This version uses standard fetch() instead of remoteFetchAsync
 * Works in environments where remoteFetchAsync is not available.
 *
 * Required Fields:
 * - State (Single line text)
 * - License Number (Single line text)
 * - Status (Single select or Single line text)
 *
 * Setup:
 * 1. Trigger: "When record matches conditions" (State not empty, License Number not empty, Status empty)
 * 2. Action: "Run a script"
 * 3. Paste this script
 */

// Configuration
const API_URL = 'https://api.medicalsearch.licensy.ai/api/v1/medical/search-license-by-number/';
const API_KEY = 'ck_75ea45bff92f02dc0560c640e727f2e7';

// Get the table
let table = base.getTable('Licenses'); // ✏️ IMPORTANT: Change this to match your table name exactly!

console.log('Looking for records to process...');

// Find records where Status is empty but State and License Number are filled
let query = await table.selectRecordsAsync({fields: ['State', 'License Number', 'Status']});
let recordsToProcess = query.records.filter(r => {
    let state = r.getCellValue('State');
    let licenseNumber = r.getCellValue('License Number');
    let status = r.getCellValue('Status');
    return state && licenseNumber && !status;
});

console.log(`Found ${recordsToProcess.length} records with empty Status`);

if (recordsToProcess.length === 0) {
    console.log('No records need processing');
    output.set('status', 'No records to process');
} else {
    // Process the first record
    let record = recordsToProcess[0];

    console.log(`Processing record: ${record.id}`);

    let state = record.getCellValue('State');
    let licenseNumber = record.getCellValue('License Number');

    console.log(`State: ${state}, License Number: ${licenseNumber}`);

    try {
        // Build API request
        let payload = `License_Number=${encodeURIComponent(licenseNumber)}&State=${encodeURIComponent(state)}&credential_key=${API_KEY}`;

        console.log('Calling API...');

        // Try using fetch instead of remoteFetchAsync
        let response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: payload
        });

        console.log(`API Response: ${response.status}`);

        if (response.ok) {
            let data = await response.json();
            let status = data.Status || 'Unknown';

            console.log(`✅ Success! Status: ${status}`);
            console.log('Full response:', JSON.stringify(data, null, 2));

            // Update the Status field
            await table.updateRecordAsync(record.id, {
                'Status': status
            });

            console.log('✅ Record updated successfully');

            // Set output variable
            output.set('status', status);

        } else {
            console.log(`❌ API Error: ${response.status}`);
            let errorText = await response.text();
            console.log('Error details:', errorText);
            output.set('status', 'Error');
        }

    } catch (error) {
        console.log(`❌ Exception: ${error.message}`);
        console.log('Error type:', error.name);
        console.log('Error stack:', error.stack);
        output.set('status', 'Error');
    }
}
