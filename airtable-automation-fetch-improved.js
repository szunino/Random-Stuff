/**
 * Airtable Automation Script: Medical License Status Lookup - IMPROVED VERSION
 *
 * This version handles Single Select fields better and provides fallback options.
 * Works in environments where remoteFetchAsync is not available.
 *
 * Required Fields:
 * - State (Single line text)
 * - License Number (Single line text)
 * - Status (Single select or Single line text)
 *
 * Setup:
 * 1. Trigger: "When record matches conditions" (State not empty, License Number not empty)
 * 2. Action: "Run a script"
 * 3. Paste this script
 *
 * IMPORTANT FOR SINGLE SELECT FIELDS:
 * If your Status field is Single Select, make sure it has these options:
 * - Active
 * - Inactive
 * - Expired
 * - Unknown
 * - Error
 */

// Configuration
const API_URL = 'https://api.medicalsearch.licensy.ai/api/v1/medical/search-license-by-number/';
const API_KEY = 'ck_75ea45bff92f02dc0560c640e727f2e7';

// Helper function to parse dates from API format (M/D/YYYY) to Airtable format (YYYY-MM-DD)
function parseDate(dateString) {
    if (!dateString) return null;
    try {
        let parts = dateString.split('/');
        if (parts.length === 3) {
            let month = parts[0].padStart(2, '0');
            let day = parts[1].padStart(2, '0');
            let year = parts[2];
            return `${year}-${month}-${day}`;
        }
    } catch (e) {
        console.log(`⚠️ Could not parse date: ${dateString}`);
    }
    return null;
}

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

        // Use fetch instead of remoteFetchAsync
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

            console.log(`✅ Success! Status from API: ${status}`);
            console.log('Full response:', JSON.stringify(data, null, 2));

            // Check if Status field is Single Select
            let statusField = table.fields.find(f => f.name === 'Status');

            if (statusField && statusField.type === 'singleSelect') {
                console.log('Status field is Single Select');

                // Get valid options
                let validOptions = statusField.options.choices.map(c => c.name);
                console.log('Valid options:', validOptions.join(', '));

                // Check if status value is valid
                if (!validOptions.includes(status)) {
                    console.log(`⚠️ Warning: "${status}" is not a valid option`);

                    // Try to find a matching option (case-insensitive)
                    let matchingOption = validOptions.find(
                        opt => opt.toLowerCase() === status.toLowerCase()
                    );

                    if (matchingOption) {
                        console.log(`✅ Found matching option: "${matchingOption}"`);
                        status = matchingOption;
                    } else {
                        console.log('❌ No matching option found, using "Unknown"');
                        // Check if "Unknown" exists
                        if (validOptions.includes('Unknown')) {
                            status = 'Unknown';
                        } else if (validOptions.length > 0) {
                            // Use the first available option as fallback
                            status = validOptions[0];
                            console.log(`Using fallback option: "${status}"`);
                        } else {
                            console.log('❌ ERROR: No valid options available!');
                            output.set('status', 'Config Error');
                            return;
                        }
                    }
                }
            }

            console.log(`Writing Status: "${status}"`);

            // Parse dates from API response
            let dateIssued = parseDate(data.Issued);
            let dateExpires = parseDate(data.Expired);
            let licenseType = data.License_Type || null;
            let nameOnLicense = data.Full_Name || null;

            // Log additional fields
            if (nameOnLicense) console.log(`Name on License: ${nameOnLicense}`);
            if (licenseType) console.log(`License Type: ${licenseType}`);
            if (dateIssued) console.log(`Date Issued: ${dateIssued}`);
            if (dateExpires) console.log(`Date Expires: ${dateExpires}`);

            try {
                // Build update object with all fields
                let updateFields = {
                    'Status': status
                };

                if (nameOnLicense) updateFields['Name on License'] = nameOnLicense;
                if (licenseType) updateFields['License Type'] = licenseType;
                if (dateIssued) updateFields['Date Issued'] = dateIssued;
                if (dateExpires) updateFields['Date Expires'] = dateExpires;

                // Update the record with all available fields
                await table.updateRecordAsync(record.id, updateFields);

                console.log('✅ Record updated successfully');

                // Set output variable
                output.set('status', status);

            } catch (updateError) {
                console.log(`❌ Update Error: ${updateError.message}`);

                // Provide specific guidance based on error
                if (updateError.message.includes('INVALID_VALUE_FOR_COLUMN') ||
                    updateError.message.includes('invalid') ||
                    updateError.message.includes('choice')) {
                    console.log('');
                    console.log('💡 SOLUTION: Your Status field is Single Select');
                    console.log(`You need to add "${status}" as an option in your Status field:`);
                    console.log('1. Go to your table');
                    console.log('2. Click on the Status field');
                    console.log('3. Click "Customize field type"');
                    console.log('4. Add these options: Active, Inactive, Expired, Unknown, Error');
                } else if (updateError.message.includes('permissions')) {
                    console.log('');
                    console.log('💡 SOLUTION: Permission issue');
                    console.log('Check that the automation has permission to edit this table');
                }

                output.set('status', 'Update Error');
            }

        } else {
            console.log(`❌ API Error: ${response.status}`);
            let errorText = await response.text();
            console.log('Error details:', errorText);
            output.set('status', 'API Error');
        }

    } catch (error) {
        console.log(`❌ Exception: ${error.message}`);
        console.log('Error type:', error.name);
        output.set('status', 'Error');
    }
}
