/**
 * Airtable Extension Script: Manual License Update
 *
 * This script runs in the Airtable Scripting Extension and updates license
 * information for selected records by calling the medical license API.
 *
 * How to use:
 * 1. Install this script in the Scripting Extension
 * 2. Select one or more records in your table
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
output.markdown('# 🔄 Manual License Update');
output.markdown('---');

// Get the table
let table = base.getTable('Licenses'); // ✏️ UPDATE THIS to match your table name

// Get selected records
let selectedRecords = await input.recordAsync('Select a record to update', table);

if (!selectedRecords) {
    output.markdown('❌ No record selected. Please select a record and try again.');
} else {
    // Convert single record to array for consistent processing
    let recordsToProcess = [selectedRecords];

    output.markdown(`\n📋 Processing 1 record...\n`);

    let successCount = 0;
    let failureCount = 0;
    const todayDate = getTodayDate();

    for (let record of recordsToProcess) {
        let state = record.getCellValue('State');
        let licenseNumber = record.getCellValue('License Number');

        output.markdown(`\n**Record:** ${record.name || record.id}`);
        output.markdown(`- State: ${state}`);
        output.markdown(`- License Number: ${licenseNumber}`);

        // Validate required fields
        if (!state || !licenseNumber) {
            output.markdown(`  ❌ **Error:** Missing State or License Number`);
            failureCount++;
            continue;
        }

        try {
            // Build API request
            let payload = `License_Number=${encodeURIComponent(licenseNumber)}&State=${encodeURIComponent(state)}&credential_key=${API_KEY}`;

            output.markdown(`  🌐 Calling API...`);

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

                output.markdown(`  ✅ **Success!**`);
                output.markdown(`    - Name: ${nameOnLicense || '(not provided)'}`);
                output.markdown(`    - Status: ${status}`);
                output.markdown(`    - License Type: ${licenseType || '(not provided)'}`);
                output.markdown(`    - Date Issued: ${dateIssued || '(not provided)'}`);
                output.markdown(`    - Date Expires: ${dateExpires || '(not provided)'}`);
                output.markdown(`    - Last Checked: ${todayDate}`);

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

                output.markdown(`  💾 **Record updated successfully!**`);
                successCount++;

            } else {
                let errorText = await response.text();
                output.markdown(`  ❌ **API Error:** ${response.status}`);
                output.markdown(`    ${errorText}`);
                failureCount++;
            }

        } catch (error) {
            output.markdown(`  ❌ **Error:** ${error.message}`);
            failureCount++;
        }
    }

    // Summary
    output.markdown('\n---');
    output.markdown('## 📊 Summary');
    output.markdown(`- ✅ Successful updates: **${successCount}**`);
    output.markdown(`- ❌ Failed updates: **${failureCount}**`);
    output.markdown('\n✨ *Update complete!*');
}
