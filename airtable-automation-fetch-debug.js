/**
 * Airtable Automation Script: Medical License Status Lookup - DEBUG VERSION
 *
 * This version has EXTENSIVE debugging to help identify why Status isn't being written.
 * Use this to diagnose issues, then switch back to the regular version once fixed.
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
 */

// Configuration
const API_URL = 'https://api.medicalsearch.licensy.ai/api/v1/medical/search-license-by-number/';
const API_KEY = 'ck_75ea45bff92f02dc0560c640e727f2e7';

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

console.log('=== DEBUG MODE ENABLED ===');
console.log('Starting script execution...');

// Get the table
let table = base.getTable('Licenses'); // ✏️ IMPORTANT: Change this to match your table name exactly!
console.log(`✅ Table found: ${table.name}`);

// Check table fields
console.log('\n📋 Available fields in table:');
for (let field of table.fields) {
    console.log(`  - ${field.name} (${field.type})`);
}

// Check for Status field specifically
let statusField = table.fields.find(f => f.name === 'Status');
if (statusField) {
    console.log(`\n✅ Status field found: ${statusField.name} (${statusField.type})`);

    // If it's a Single Select field, show the options
    if (statusField.type === 'singleSelect' && statusField.options) {
        console.log('📝 Single Select options:');
        for (let option of statusField.options.choices) {
            console.log(`  - "${option.name}"`);
        }
    }
} else {
    console.log('\n❌ WARNING: Status field not found!');
    console.log('Available field names:', table.fields.map(f => f.name).join(', '));
}

console.log('\n🔍 Looking for records to process...');

// Find records where Status is empty but State and License Number are filled
let query = await table.selectRecordsAsync({fields: ['State', 'License Number', 'Status']});
console.log(`📊 Total records in query: ${query.records.length}`);

let recordsToProcess = query.records.filter(r => {
    let state = r.getCellValue('State');
    let licenseNumber = r.getCellValue('License Number');
    let status = r.getCellValue('Status');

    console.log(`\nChecking record ${r.id}:`);
    console.log(`  State: ${state ? `"${state}"` : '(empty)'}`);
    console.log(`  License Number: ${licenseNumber ? `"${licenseNumber}"` : '(empty)'}`);
    console.log(`  Status: ${status ? `"${status}"` : '(empty)'}`);

    return state && licenseNumber && !status;
});

console.log(`\n✅ Found ${recordsToProcess.length} records with empty Status`);

if (recordsToProcess.length === 0) {
    console.log('⚠️ No records need processing');
    output.set('status', 'No records to process');
} else {
    // Process the first record
    let record = recordsToProcess[0];

    console.log(`\n🎯 Processing record: ${record.id}`);

    let state = record.getCellValue('State');
    let licenseNumber = record.getCellValue('License Number');

    console.log(`📝 Input values:`);
    console.log(`  State: "${state}"`);
    console.log(`  License Number: "${licenseNumber}"`);

    try {
        // Build API request
        let payload = `License_Number=${encodeURIComponent(licenseNumber)}&State=${encodeURIComponent(state)}&credential_key=${API_KEY}`;

        console.log('\n🌐 Calling API...');
        console.log(`URL: ${API_URL}`);

        // Use fetch instead of remoteFetchAsync
        let response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: payload
        });

        console.log(`\n📡 API Response Status: ${response.status}`);
        console.log(`Response OK: ${response.ok}`);

        if (response.ok) {
            let data = await response.json();

            console.log('\n📦 Full API Response:');
            console.log(JSON.stringify(data, null, 2));

            // Check what fields are in the response
            console.log('\n🔑 Response fields:');
            for (let key in data) {
                console.log(`  - ${key}: ${data[key]}`);
            }

            let status = data.Status || 'Unknown';

            console.log(`\n✅ Extracted Status: "${status}"`);
            console.log(`Status type: ${typeof status}`);
            console.log(`Status length: ${status.length}`);

            // Check if this value is valid for Single Select field
            if (statusField && statusField.type === 'singleSelect') {
                let validOptions = statusField.options.choices.map(c => c.name);
                console.log(`\n🔍 Checking if "${status}" matches any Single Select options...`);
                console.log(`Valid options: ${validOptions.join(', ')}`);

                if (validOptions.includes(status)) {
                    console.log('✅ Status value matches a Single Select option');
                } else {
                    console.log('❌ WARNING: Status value does NOT match any Single Select option');
                    console.log('You may need to add this option to your Status field or modify the value');
                }
            }

            console.log('\n💾 Attempting to update record...');
            console.log(`Record ID: ${record.id}`);
            console.log(`Fields to update:`);
            console.log(`  - Status: "${status}"`);

            const todayDate = getTodayDate();
            console.log(`  - Last Checked: "${todayDate}"`);

            try {
                // Build update object with all fields
                let updateFields = {
                    'Status': status,
                    'Last Checked': todayDate
                };

                // Update the record with all fields
                await table.updateRecordAsync(record.id, updateFields);

                console.log('✅✅✅ Record updated successfully!');

                // Verify the update
                let updatedQuery = await table.selectRecordsAsync({fields: ['Status']});
                let updatedRecord = updatedQuery.records.find(r => r.id === record.id);
                let newStatus = updatedRecord.getCellValue('Status');
                console.log(`\n🔍 Verification - Current Status value: ${newStatus ? `"${newStatus}"` : '(still empty)'}`);

                if (newStatus) {
                    console.log('✅ SUCCESS! Status was written to the cell!');
                } else {
                    console.log('❌ PROBLEM: Status field is still empty after update!');
                }

                // Set output variable
                output.set('status', status);

            } catch (updateError) {
                console.log('\n❌❌❌ ERROR during update:');
                console.log(`Error message: ${updateError.message}`);
                console.log(`Error type: ${updateError.name}`);
                console.log(`Error stack: ${updateError.stack}`);

                // Try to provide helpful suggestions
                if (updateError.message.includes('invalid') || updateError.message.includes('choice')) {
                    console.log('\n💡 SUGGESTION: Your Status field might be a Single Select with specific options.');
                    console.log('Make sure the API value matches one of your field options exactly.');
                }

                output.set('status', 'Update Error');
            }

        } else {
            console.log(`\n❌ API Error: ${response.status}`);
            let errorText = await response.text();
            console.log('Error details:', errorText);
            output.set('status', 'API Error');
        }

    } catch (error) {
        console.log(`\n❌❌❌ Exception: ${error.message}`);
        console.log(`Error type: ${error.name}`);
        console.log(`Error stack: ${error.stack}`);
        output.set('status', 'Error');
    }
}

console.log('\n=== DEBUG MODE COMPLETE ===');
