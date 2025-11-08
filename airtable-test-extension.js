/**
 * Airtable Test Extension: Medical License Status Lookup
 *
 * This is a simple test script you can run in Airtable's Scripting extension
 * to verify the API integration works before setting up automations.
 *
 * How to use:
 * 1. Open your Airtable base
 * 2. Click Extensions (puzzle icon) → Add extension → Scripting
 * 3. Copy/paste this entire script
 * 4. Click "Run"
 * 5. Enter a State and License Number when prompted
 * 6. See the Status value returned
 *
 * No table setup required - this is just for testing!
 */

// Configuration
const API_URL = 'https://api.medicalsearch.licensy.ai/api/v1/medical/search-license-by-number/';
const API_KEY = 'ck_75ea45bff92f02dc0560c640e727f2e7';

output.markdown('# 🧪 Medical License API Test Tool\n');
output.text('This tool lets you test the API before setting up automations.\n');

// Get input from user
let state = await input.textAsync('Enter State (e.g., Alabama):');
let licenseNumber = await input.textAsync('Enter License Number (e.g., 2143):');

if (!state || !licenseNumber) {
    output.text('❌ Please provide both State and License Number');
} else {
    output.markdown(`\n## Testing Lookup\n- **State:** ${state}\n- **License Number:** ${licenseNumber}\n`);
    output.text('Calling API...\n');

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

            // Display results
            output.markdown(`\n## ✅ Success!\n`);
            output.markdown(`### Status Value (what will be stored):\n`);
            output.markdown(`# ${status}\n`);

            output.markdown(`\n### Full API Response:\n`);
            output.inspect(data);

            output.markdown(`\n---\n### 📋 Summary\n`);
            output.text(`✅ API is working correctly`);
            output.text(`✅ Status extracted: "${status}"`);
            output.text(`✅ This value will be written to your Status field in automations`);

        } else {
            output.markdown(`\n## ❌ API Error\n`);
            output.text(`HTTP Status: ${response.status} ${response.statusText}`);
            output.text(`\nThis could mean:`);
            output.text(`- Invalid state or license number`);
            output.text(`- API key issue`);
            output.text(`- Network connectivity problem`);
        }

    } catch (error) {
        output.markdown(`\n## ❌ Error\n`);
        output.text(`Error message: ${error.message}`);
        output.text(`\nPlease check:`);
        output.text(`- Your internet connection`);
        output.text(`- The API endpoint is accessible`);
        output.text(`- The input values are correct`);
    }
}

output.markdown(`\n---\n### 🔄 Want to test again?\nJust click the "Run" button again!`);
