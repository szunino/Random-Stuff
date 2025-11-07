/**
 * Airtable Script: Medical License Lookup
 *
 * This script queries the Licensy Medical Search API using State and License Number
 * fields from your Airtable base and returns the license Status.
 *
 * Required Fields in your table:
 * - State (Single line text)
 * - License Number (Single line text)
 * - Status (Single select or Single line text) - Stores license status (Active/Inactive)
 * - API Response (Long text) - Optional field to store the full response
 *
 * Instructions:
 * 1. Copy this script into Airtable's Scripting app
 * 2. Update the FIELD_NAMES object if your field names differ
 * 3. Run the script and select records to look up
 */

// Configuration
const API_CONFIG = {
    url: 'https://api.medicalsearch.licensy.ai/api/v1/medical/search-license-by-number/',
    apiKey: 'ck_75ea45bff92f02dc0560c640e727f2e7',
    headers: {
        'accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
};

// Field names in your Airtable base
const FIELD_NAMES = {
    state: 'State',
    licenseNumber: 'License Number',
    status: 'Status', // Field to store license status (Active/Inactive)
    apiResponse: 'API Response' // Optional: field to store the full API response
};

// Main function
async function main() {
    // Get the current table
    let table = base.getTable('Medical Licenses'); // Change this to your table name

    // Let user choose to process all records or selected records
    let processChoice = await input.buttonsAsync(
        'Which records would you like to process?',
        [
            {label: 'Selected Records', value: 'selected'},
            {label: 'All Records', value: 'all'},
            {label: 'Single Record', value: 'single'}
        ]
    );

    let records;

    if (processChoice === 'selected') {
        // Get selected records
        let selectedRecords = await input.recordAsync('Select records to process', table);
        if (!selectedRecords) {
            output.text('No records selected. Exiting.');
            return;
        }
        // For selected records mode, we need to query them
        let query = await table.selectRecordsAsync();
        records = query.records.filter(r => r.id === selectedRecords.id);
        query.unload();
    } else if (processChoice === 'single') {
        // Process a single record
        let record = await input.recordAsync('Select a record to process', table);
        if (!record) {
            output.text('No record selected. Exiting.');
            return;
        }
        let query = await table.selectRecordsAsync();
        records = query.records.filter(r => r.id === record.id);
        query.unload();
    } else {
        // Get all records
        let query = await table.selectRecordsAsync();
        records = query.records;
        query.unload();
    }

    output.markdown(`# Processing ${records.length} record(s)...\n`);

    let successCount = 0;
    let errorCount = 0;
    let updates = [];

    // Process each record
    for (let record of records) {
        let state = record.getCellValue(FIELD_NAMES.state);
        let licenseNumber = record.getCellValue(FIELD_NAMES.licenseNumber);

        // Skip if required fields are missing
        if (!state || !licenseNumber) {
            output.text(`⚠️  Skipping record ${record.id}: Missing State or License Number`);
            errorCount++;
            continue;
        }

        output.text(`\n🔍 Looking up: ${licenseNumber} (${state})`);

        try {
            // Make API request
            let result = await lookupLicense(state, licenseNumber);

            if (result.success) {
                // Extract status from response
                let licenseStatus = result.data.Status || 'Unknown';

                output.markdown(`✅ **Success!** Status: **${licenseStatus}**`);
                output.inspect(result.data);

                // Prepare update for Status and API Response fields
                let updateFields = {};

                // Add Status if field exists
                if (table.fields.find(f => f.name === FIELD_NAMES.status)) {
                    updateFields[FIELD_NAMES.status] = licenseStatus;
                }

                // Add API Response if field exists
                if (table.fields.find(f => f.name === FIELD_NAMES.apiResponse)) {
                    updateFields[FIELD_NAMES.apiResponse] = JSON.stringify(result.data, null, 2);
                }

                // Only add to updates if we have fields to update
                if (Object.keys(updateFields).length > 0) {
                    updates.push({
                        id: record.id,
                        fields: updateFields
                    });
                }

                successCount++;
            } else {
                output.text(`❌ Error: ${result.error}`);
                errorCount++;
            }

        } catch (error) {
            output.text(`❌ Exception: ${error.message}`);
            errorCount++;
        }

        // Add a small delay to avoid rate limiting
        await sleep(500);
    }

    // Update records if we have Status or API Response fields to update
    if (updates.length > 0) {
        let shouldUpdate = await input.buttonsAsync(
            `Update ${updates.length} record(s) with Status and API responses?`,
            ['Yes', 'No']
        );

        if (shouldUpdate === 'Yes') {
            output.text('\n📝 Updating records...');

            // Airtable limits updates to 50 records at a time
            while (updates.length > 0) {
                let batch = updates.slice(0, 50);
                await table.updateRecordsAsync(batch);
                updates = updates.slice(50);
            }

            output.text('✅ Records updated!');
        }
    }

    // Summary
    output.markdown(`\n---\n## Summary\n- ✅ Successful: ${successCount}\n- ❌ Failed: ${errorCount}\n- 📊 Total: ${records.length}`);
}

/**
 * Look up a medical license using the API
 */
async function lookupLicense(state, licenseNumber) {
    try {
        // Prepare form-urlencoded payload
        let payload = `License_Number=${encodeURIComponent(licenseNumber)}&State=${encodeURIComponent(state)}&credential_key=${API_CONFIG.apiKey}`;

        // Make API request using Airtable's remoteFetchAsync
        let response = await remoteFetchAsync(API_CONFIG.url, {
            method: 'POST',
            headers: API_CONFIG.headers,
            body: payload
        });

        // Check if response is OK
        if (!response.ok) {
            return {
                success: false,
                error: `HTTP ${response.status}: ${response.statusText}`
            };
        }

        // Parse JSON response
        let data = await response.json();

        return {
            success: true,
            data: data
        };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Sleep helper function
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the main function
await main();
