/**
 * Airtable Automation Script: Medical License Status Lookup - BATCH VERSION
 *
 * This version processes ALL records with empty Status fields in a single run.
 * Use this to backfill existing records or process multiple records at once.
 *
 * Works with standard fetch() API for modern Airtable environments.
 *
 * Required Fields:
 * - State (Single line text)
 * - License Number (Single line text)
 * - Status (Single line text or Single select)
 *
 * Setup:
 * 1. Trigger: Manual button click or scheduled time
 * 2. Action: "Run a script"
 * 3. Paste this script
 * 4. Update table name below
 */

// Configuration
const API_URL = 'https://api.medicalsearch.licensy.ai/api/v1/medical/search-license-by-number/';
const API_KEY = 'ck_75ea45bff92f02dc0560c640e727f2e7';
const MAX_RECORDS_PER_RUN = 50; // Safety limit

// Simple sleep function for Airtable (setTimeout not available)
function sleep(ms) {
    const start = Date.now();
    while (Date.now() - start < ms) {
        // Busy wait
    }
}

// Get the table
let table = base.getTable('Licenses'); // ✏️ UPDATE THIS to match your table name

console.log('🚀 Starting batch processing...');
console.log(`Table: ${table.name}`);

// Find records where Status is empty but State and License Number are filled
let query = await table.selectRecordsAsync({fields: ['State', 'License Number', 'Status']});
let recordsToProcess = query.records.filter(r => {
    let state = r.getCellValue('State');
    let licenseNumber = r.getCellValue('License Number');
    let status = r.getCellValue('Status');
    return state && licenseNumber && !status;
});

console.log(`\n📊 Found ${recordsToProcess.length} records with empty Status`);

if (recordsToProcess.length === 0) {
    console.log('✅ All records already have Status filled!');
    output.set('summary', 'No records to process');
    output.set('recordsProcessed', 0);
    output.set('recordsSuccessful', 0);
    output.set('recordsFailed', 0);
} else {
    // Limit number of records to process
    if (recordsToProcess.length > MAX_RECORDS_PER_RUN) {
        console.log(`⚠️ Limiting to first ${MAX_RECORDS_PER_RUN} records for safety`);
        recordsToProcess = recordsToProcess.slice(0, MAX_RECORDS_PER_RUN);
    }

    let successCount = 0;
    let failureCount = 0;
    let processedCount = 0;

    // Process each record
    for (let record of recordsToProcess) {
        processedCount++;

        let state = record.getCellValue('State');
        let licenseNumber = record.getCellValue('License Number');

        console.log(`\n[${processedCount}/${recordsToProcess.length}] Processing: ${state} - ${licenseNumber}`);

        try {
            // Build API request
            let payload = `License_Number=${encodeURIComponent(licenseNumber)}&State=${encodeURIComponent(state)}&credential_key=${API_KEY}`;

            // Call API using fetch
            let response = await fetch(API_URL, {
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

                console.log(`  ✅ Status: ${status}`);

                // Update the Status field
                await table.updateRecordAsync(record.id, {
                    'Status': status
                });

                successCount++;

            } else {
                console.log(`  ❌ API Error: ${response.status}`);
                failureCount++;
            }

        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
            failureCount++;
        }

        // Add delay between requests to avoid rate limiting (500ms)
        if (processedCount < recordsToProcess.length) {
            sleep(500);
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 BATCH PROCESSING COMPLETE');
    console.log('='.repeat(50));
    console.log(`Total processed: ${processedCount}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log('='.repeat(50));

    // Set output variables
    output.set('summary', `Processed ${processedCount} records: ${successCount} successful, ${failureCount} failed`);
    output.set('recordsProcessed', processedCount);
    output.set('recordsSuccessful', successCount);
    output.set('recordsFailed', failureCount);
}
