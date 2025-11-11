/**
 * Airtable Automation Script: Medical License Status Lookup - STANDALONE TEST VERSION
 *
 * This version doesn't require input variables - it processes ALL records with empty Status.
 * Use this to test if the API integration works before setting up the full automation.
 *
 * Required Fields:
 * - State (Single line text)
 * - License Number (Single line text)
 * - Status (Single select or Single line text)
 *
 * To use:
 * 1. Create automation with ANY trigger (even manual)
 * 2. Add "Run a script" action
 * 3. Paste this script
 * 4. Run to test - it will process records where Status is empty
 */

// Configuration
const API_URL = 'https://api.medicalsearch.licensy.ai/api/v1/medical/search-license-by-number/';
const API_KEY = 'ck_75ea45bff92f02dc0560c640e727f2e7';

// Get the table
let table = base.getTable('Medical Licenses'); // Change to your table name

// Get all records where Status is empty
let query = await table.selectRecordsAsync({fields: ['State', 'License Number', 'Status']});
let recordsToProcess = query.records.filter(r => {
    let status = r.getCellValue('Status');
    return !status; // Only records with empty Status
});

console.log(`Found ${recordsToProcess.length} records with empty Status to process`);

// Process only the first record as a test
if (recordsToProcess.length === 0) {
    console.log('No records to process - all records already have a Status');
    output.set('status', 'No records to process');
} else {
    let record = recordsToProcess[0]; // Just process the first one for testing

    console.log(`Processing record: ${record.id}`);

    let state = record.getCellValue('State');
    let licenseNumber = record.getCellValue('License Number');

    console.log(`State: ${state}`);
    console.log(`License Number: ${licenseNumber}`);

    if (!state || !licenseNumber) {
        console.log('Missing required fields');
        output.set('status', 'Error: Missing fields');
    } else {
        try {
            // Build API request
            let payload = `License_Number=${encodeURIComponent(licenseNumber)}&State=${encodeURIComponent(state)}&credential_key=${API_KEY}`;

            console.log('Calling API...');

            // Call API using Airtable's remoteFetchAsync function
            // @ts-ignore - remoteFetchAsync is provided by Airtable automation environment
            let response = await remoteFetchAsync(API_URL, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: payload
            });

            console.log(`API Response Status: ${response.status}`);

            if (response.ok) {
                let data = await response.json();
                let status = data.Status || 'Unknown';

                console.log(`✅ Success! Status: ${status}`);
                console.log('Full response:', JSON.stringify(data, null, 2));

                // Update the Status field in Airtable
                await table.updateRecordAsync(record.id, {
                    'Status': status
                });

                console.log('Record updated successfully');

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
            console.log('Error stack:', error.stack);
            output.set('status', 'Error');
        }
    }
}
