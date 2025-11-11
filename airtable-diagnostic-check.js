/**
 * Airtable Environment Diagnostic Script
 *
 * This script checks what HTTP functions are available in your environment.
 * Run this to determine which version of the script you should use.
 *
 * Use in: Scripting extension OR Automation
 */

console.log('=== Airtable Environment Diagnostic ===\n');

// Check for remoteFetchAsync
console.log('1. Checking for remoteFetchAsync...');
if (typeof remoteFetchAsync !== 'undefined') {
    console.log('✅ remoteFetchAsync is AVAILABLE');
} else {
    console.log('❌ remoteFetchAsync is NOT available');
}

// Check for fetch
console.log('\n2. Checking for fetch...');
if (typeof fetch !== 'undefined') {
    console.log('✅ fetch is AVAILABLE');
} else {
    console.log('❌ fetch is NOT available');
}

// Check environment type
console.log('\n3. Environment Information:');
console.log('- typeof base:', typeof base);
console.log('- typeof input:', typeof input);
console.log('- typeof output:', typeof output);

// Check input methods
console.log('\n4. Input object methods:');
if (typeof input !== 'undefined') {
    console.log('- input.config:', typeof input.config);
    console.log('- input.textAsync:', typeof input.textAsync);
    console.log('- input.buttonsAsync:', typeof input.buttonsAsync);
}

// Check output methods
console.log('\n5. Output object methods:');
if (typeof output !== 'undefined') {
    console.log('- output.text:', typeof output.text);
    console.log('- output.markdown:', typeof output.markdown);
    console.log('- output.set:', typeof output.set);
}

console.log('\n=== Diagnostic Complete ===');

// Recommendation
console.log('\n📋 RECOMMENDATION:');
if (typeof remoteFetchAsync !== 'undefined') {
    console.log('✅ Use scripts with remoteFetchAsync');
} else if (typeof fetch !== 'undefined') {
    console.log('✅ Use airtable-automation-fetch-version.js');
} else {
    console.log('❌ HTTP requests may not be supported in this environment');
    console.log('   Consider using:');
    console.log('   - Scripting Extension instead of Automations');
    console.log('   - Webhook/external service integration');
}
