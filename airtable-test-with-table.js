/**
 * Airtable Test Script: Test with Your Actual Table
 *
 * This script tests the API integration with your actual Airtable table
 * and shows exactly what the automation will do.
 *
 * Setup:
 * 1. Make sure you have a table with State and License Number fields
 * 2. Add at least one test record (try: State="Alabama", License Number="2143")
 * 3. Open Scripting extension and paste this code
 * 4. Update table name on line 27 if needed
 * 5. Click Run
 */

// Configuration
const API_URL = 'https://api.medicalsearch.licensy.ai/api/v1/medical/search-license-by-number/';
const API_KEY = 'ck_75ea45bff92f02dc0560c640e727f2e7';

output.markdown('# 🧪 Medical License API - Table Test\n');

// Get table
let table = base.getTable('Medical Licenses'); // Change to your table name
output.text(`📊 Using table: "${table.name}"\n`);

// Let user pick a record to test
let record = await input.recordAsync('Select a test record:', table);

if (!record) {
    output.text('❌ No record selected');
} else {
    // Get field values
    let state = record.getCellValue('State');
    let licenseNumber = record.getCellValue('License Number');

    output.markdown(`## Testing Record\n`);
    output.text(`Record ID: ${record.id}`);
    output.text(`State: ${state || '(empty)'}`);
    output.text(`License Number: ${licenseNumber || '(empty)'}`);

    if (!state || !licenseNumber) {
        output.text('\n❌ This record is missing State or License Number');
        output.text('Please select a record with both fields filled');
    } else {
        output.text('\n🔄 Calling API...\n');

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

                output.markdown(`\n## ✅ API Call Successful!\n`);

                output.markdown(`### Status Value:\n`);
                output.markdown(`# 📋 ${status}\n`);

                output.markdown(`### This is what automation will output:\n`);
                output.text(`${status}`);

                output.markdown(`\n### Full API Response Data:\n`);
                output.inspect(data);

                // Check if Status field exists
                let hasStatusField = table.fields.find(f => f.name === 'Status');

                output.markdown(`\n## 💾 Update Test\n`);

                if (hasStatusField) {
                    output.text(`✅ Status field found in table`);

                    let shouldUpdate = await input.buttonsAsync(
                        'Do you want to update this record with the Status?',
                        ['Yes - Update Now', 'No - Just Testing']
                    );

                    if (shouldUpdate === 'Yes - Update Now') {
                        await table.updateRecordAsync(record.id, {
                            'Status': status
                        });
                        output.text('✅ Record updated successfully!');
                        output.text(`The Status field now contains: "${status}"`);
                    } else {
                        output.text('ℹ️  No changes made - just a test run');
                    }
                } else {
                    output.text('⚠️  No "Status" field found in table');
                    output.text('Add a "Status" field (Single select or Single line text) to store the status');
                }

                output.markdown(`\n---\n## 📊 Summary\n`);
                output.text(`✅ API Integration: Working`);
                output.text(`✅ Status Extraction: Success`);
                output.text(`✅ Value Retrieved: "${status}"`);
                output.text(`✅ Ready for automation setup!`);

            } else {
                output.markdown(`\n## ❌ API Error\n`);
                output.text(`HTTP ${response.status}: ${response.statusText}`);

                if (response.status === 404) {
                    output.text('\nLikely cause: License number not found for this state');
                } else if (response.status === 401 || response.status === 403) {
                    output.text('\nLikely cause: API key issue');
                } else {
                    output.text('\nCheck the license number and state are correct');
                }
            }

        } catch (error) {
            output.markdown(`\n## ❌ Error Occurred\n`);
            output.text(`Error: ${error.message}`);
            output.text('\nPossible issues:');
            output.text('- Network connectivity');
            output.text('- API endpoint unavailable');
            output.text('- Airtable scripting limits');
        }
    }
}

output.markdown(`\n---\n### 🔄 Test Another Record?\nJust click "Run" again!`);
