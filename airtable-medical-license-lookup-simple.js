/**
 * Simple Airtable Medical License Lookup Script
 *
 * Minimal version - processes all records in the current table
 * Required fields: State, License Number
 * Optional field: Status (to store the license status)
 */

// Configuration
const API_URL = 'https://api.medicalsearch.licensy.ai/api/v1/medical/search-license-by-number/';
const API_KEY = 'ck_75ea45bff92f02dc0560c640e727f2e7';

// Get table and records
let table = base.getTable('Medical Licenses'); // Update table name here
let query = await table.selectRecordsAsync();
let records = query.records;

// Check if Status field exists
let hasStatusField = table.fields.find(f => f.name === 'Status');

output.markdown(`# Processing ${records.length} records...\n`);

// Process each record
let updates = [];

for (let record of records) {
    let state = record.getCellValue('State');
    let licenseNumber = record.getCellValue('License Number');

    if (!state || !licenseNumber) {
        output.text(`⚠️  Skipping record: Missing data`);
        continue;
    }

    output.text(`\n🔍 ${licenseNumber} (${state})`);

    try {
        // Build request payload
        let payload = `License_Number=${encodeURIComponent(licenseNumber)}&State=${encodeURIComponent(state)}&credential_key=${API_KEY}`;

        // Make API request
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
            let licenseStatus = data.Status || 'Unknown';

            output.text(`✅ Success - Status: ${licenseStatus}`);
            output.inspect(data);

            // Store for batch update if Status field exists
            if (hasStatusField) {
                updates.push({
                    id: record.id,
                    fields: { 'Status': licenseStatus }
                });
            }
        } else {
            output.text(`❌ Error: ${response.status} ${response.statusText}`);
        }

    } catch (error) {
        output.text(`❌ Error: ${error.message}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
}

// Update Status field if we have updates
if (updates.length > 0) {
    output.text(`\n📝 Updating ${updates.length} records with Status...`);

    // Airtable limits updates to 50 records at a time
    while (updates.length > 0) {
        let batch = updates.slice(0, 50);
        await table.updateRecordsAsync(batch);
        updates = updates.slice(50);
    }

    output.text('✅ Status fields updated!');
}

query.unload();
output.text('\n✅ Complete!');
