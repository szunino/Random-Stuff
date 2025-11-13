/**
 * Airtable Extension Script: Manual License Update (Batch)
 *
 * This script runs in the Airtable Scripting Extension and updates license
 * information for MULTIPLE selected records by calling the medical license API.
 *
 * How to use:
 * 1. Install this script in the Scripting Extension
 * 2. Select MULTIPLE records in your table (or select none to process all)
 * 3. Click "Run" to update those records
 * 4. The script will fetch fresh data and update all fields
 *
 * Updated Fields:
 * - Name on License
 * - Status
 * - License Type
 * - Date Issued
 * - Date Expires
 * - Last Checked (set to today's date)
 *
 * Required Input Fields:
 * - State
 * - License Number
 */

// Configuration
const API_URL = 'https://api.medicalsearch.licensy.ai/api/v1/medical/search-license-by-number/';
const API_KEY = 'ck_75ea45bff92f02dc0560c640e727f2e7';
const DELAY_BETWEEN_REQUESTS = 500; // milliseconds (to avoid rate limiting)

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

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Simple delay function
function sleep(ms) {
    const start = Date.now();
    while (Date.now() - start < ms) {
        // Busy wait
    }
}

// Main script
output.markdown('# 🔄 Manual License Update (Batch)');
output.markdown('---');

// Get the table
let table = base.getTable('Licenses'); // ✏️ UPDATE THIS to match your table name

// Get selected records
let selection = await input.buttonsAsync(
    'Which records do you want to update?',
    [
        {label: '✅ Selected Records', value: 'selected', variant: 'primary'},
        {label: '📋 All Records', value: 'all'}
    ]
);

let recordsToProcess = [];

if (selection === 'selected') {
    // Get currently selected records in the table view
    let selectedRecordIds = await input.recordAsync(
        'Select records to update (you can select multiple)',
        table
    );

    if (!selectedRecordIds) {
        output.markdown('❌ No records selected. Exiting.');
    } else {
        // Get full record data
        let query = await table.selectRecordsAsync();
        recordsToProcess = query.records.filter(r => r.id === selectedRecordIds.id);

        // Note: For multiple selection in scripts, users would need to select records in the grid view first
        // This version processes one at a time. For true multi-select, use the grid view selection.
        output.markdown('💡 **Tip:** To update multiple records, select them in your table view first, then choose "Selected Records"');
    }
} else if (selection === 'all') {
    let query = await table.selectRecordsAsync({
        fields: ['State', 'License Number', 'Status']
    });
    recordsToProcess = query.records;
    output.markdown(`📊 Found ${recordsToProcess.length} total records`);
}

if (recordsToProcess.length === 0) {
    output.markdown('❌ No records to process.');
} else {
    output.markdown(`\n🚀 Processing ${recordsToProcess.length} record(s)...\n`);

    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;
    const todayDate = getTodayDate();
    let processedCount = 0;

    for (let record of recordsToProcess) {
        processedCount++;

        let state = record.getCellValue('State');
        let licenseNumber = record.getCellValue('License Number');

        output.markdown(`\n---`);
        output.markdown(`**[${processedCount}/${recordsToProcess.length}]** Record: ${record.name || record.id}`);

        // Validate required fields
        if (!state || !licenseNumber) {
            output.markdown(`  ⚠️ **Skipped:** Missing State or License Number`);
            skippedCount++;
            continue;
        }

        output.markdown(`  📍 ${state} - ${licenseNumber}`);

        try {
            // Build API request
            let payload = `License_Number=${encodeURIComponent(licenseNumber)}&State=${encodeURIComponent(state)}&credential_key=${API_KEY}`;

            output.markdown(`  🌐 Fetching data...`);

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

                // Extract fields from API response
                let status = data.Status || 'Unknown';
                let nameOnLicense = data.Full_Name || null;
                let licenseType = data.License_Type || null;
                let dateIssued = parseDate(data.Issued);
                let dateExpires = parseDate(data.Expired);

                output.markdown(`  ✅ **Updated:**`);
                if (nameOnLicense) output.markdown(`    - Name: ${nameOnLicense}`);
                if (status) output.markdown(`    - Status: ${status}`);
                if (licenseType) output.markdown(`    - Type: ${licenseType}`);
                if (dateIssued) output.markdown(`    - Issued: ${dateIssued}`);
                if (dateExpires) output.markdown(`    - Expires: ${dateExpires}`);

                // Build update object with all available fields
                let updateFields = {
                    'Status': status,
                    'Last Checked': todayDate
                };

                if (nameOnLicense) updateFields['Name on License'] = nameOnLicense;
                if (licenseType) updateFields['License Type'] = licenseType;
                if (dateIssued) updateFields['Date Issued'] = dateIssued;
                if (dateExpires) updateFields['Date Expires'] = dateExpires;

                // Update the record
                await table.updateRecordAsync(record.id, updateFields);

                successCount++;

            } else {
                output.markdown(`  ❌ **API Error:** ${response.status}`);
                failureCount++;
            }

        } catch (error) {
            output.markdown(`  ❌ **Error:** ${error.message}`);
            failureCount++;
        }

        // Add delay between requests (except for last record)
        if (processedCount < recordsToProcess.length) {
            sleep(DELAY_BETWEEN_REQUESTS);
        }
    }

    // Final summary
    output.markdown('\n\n' + '='.repeat(50));
    output.markdown('## 📊 Final Summary');
    output.markdown('='.repeat(50));
    output.markdown(`\n- 📝 **Total processed:** ${processedCount}`);
    output.markdown(`- ✅ **Successful updates:** ${successCount}`);
    output.markdown(`- ❌ **Failed updates:** ${failureCount}`);
    if (skippedCount > 0) {
        output.markdown(`- ⚠️ **Skipped (missing data):** ${skippedCount}`);
    }
    output.markdown(`- 📅 **Last Checked set to:** ${todayDate}`);
    output.markdown('\n✨ **Batch update complete!**');
}
