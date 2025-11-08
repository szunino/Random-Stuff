# Testing Guide for Airtable Medical License Lookup

This guide will help you test the API integration before setting up automations.

## Quick Start - Two Testing Options

### Option 1: Test WITHOUT a Table (Fastest)
Use `airtable-test-extension.js` - no table setup required!

**Steps:**
1. Open your Airtable base
2. Click **Extensions** (puzzle piece icon) → **Add an extension** → **Scripting**
3. Copy the contents of `airtable-test-extension.js`
4. Paste into the script editor
5. Click **Run**
6. Enter test values when prompted:
   - State: `Alabama`
   - License Number: `2143`
7. See the Status value returned!

**What you'll see:**
- The API response
- The Status value extracted (e.g., "Inactive")
- Confirmation that the integration works

---

### Option 2: Test WITH Your Table (Recommended)
Use `airtable-test-with-table.js` - tests with your actual data!

**Steps:**

1. **Prepare your table:**
   - Create a table (or use existing)
   - Add fields: `State`, `License Number`, `Status` (optional)
   - Add a test record: State = "Alabama", License Number = "2143"

2. **Run the test:**
   - Open **Scripting** extension
   - Copy contents of `airtable-test-with-table.js`
   - Update table name on line 27 if needed
   - Click **Run**

3. **Select your test record:**
   - Choose the record you want to test
   - Script will show current values

4. **View results:**
   - See the API response
   - See the Status value
   - Optionally update the record

5. **Verify:**
   - Check if Status field gets updated correctly
   - Confirm the value matches API response

---

## Test Scenarios

### ✅ Scenario 1: Valid License (Expected: Success)
- **State:** Alabama
- **License Number:** 2143
- **Expected Status:** Inactive
- **Expected Result:** API returns full data, Status = "Inactive"

### ✅ Scenario 2: Different State/License
- **State:** [Your state]
- **License Number:** [Your license number]
- **Expected Result:** API returns data if valid, error if not found

### ❌ Scenario 3: Invalid License (Expected: Error)
- **State:** Alabama
- **License Number:** 99999999
- **Expected Result:** API returns error or no data

### ❌ Scenario 4: Empty Fields (Expected: Skip)
- **State:** (empty)
- **License Number:** (empty)
- **Expected Result:** Script skips record with warning

---

## Expected Output Examples

### Successful API Call
```
✅ Success!

Status Value (what will be stored):
Inactive

Full API Response:
{
  "Full_Name": "Davis, Russell William",
  "License_Type": "DO",
  "License_Number": "2143",
  "Status": "Inactive",
  "Issued": "1/22/2020",
  "Expired": "12/31/2022",
  "State": "Alabama"
}
```

### What Automation Will Output
The automation scripts output ONLY:
```
Inactive
```

---

## Troubleshooting

### Issue: "Field not found"
**Solution:** Make sure your table has fields named exactly:
- `State`
- `License Number`
- `Status` (optional)

If your field names are different, update the script where it references field names.

### Issue: "API Error 404"
**Solution:** The license number doesn't exist in that state. Try:
- State: "Alabama"
- License Number: "2143"

### Issue: "API Error 401/403"
**Solution:** API key issue. Verify the API key is correct in the script.

### Issue: "No records found"
**Solution:** Add a test record to your table with State and License Number filled in.

### Issue: Script won't run
**Solution:**
- Make sure you're using the Scripting extension (not Automations)
- Copy the entire script file
- Check for any syntax errors

---

## After Testing Successfully

Once you've verified the API works:

### Next Steps:

1. **Add Status Field** (if you haven't):
   - Type: Single select
   - Options: Active, Inactive, Expired, Unknown
   - (Or use Single line text)

2. **Set Up Automation Option 1** (Real-time):
   - Use `airtable-automation-license-status.js`
   - Trigger: When State & License Number are filled
   - See README.md for detailed steps

3. **Set Up Automation Option 2** (Daily):
   - Use `airtable-automation-daily-batch.js`
   - Trigger: Scheduled daily
   - See README.md for detailed steps

4. **Or Use Manual Scripts**:
   - `airtable-medical-license-lookup.js` - Interactive
   - `airtable-medical-license-lookup-simple.js` - Batch

---

## Testing Checklist

Before setting up automations, verify:

- [ ] API call succeeds with test data (Alabama, 2143)
- [ ] Status value is extracted correctly ("Inactive")
- [ ] Status field exists in your table
- [ ] Status field gets updated when you click "Update"
- [ ] Error handling works (test with invalid license number)
- [ ] All your real data has State and License Number filled
- [ ] You understand the automation trigger conditions

---

## Test Data Reference

Use these for testing:

| State | License Number | Expected Status | Expected Name |
|-------|----------------|-----------------|---------------|
| Alabama | 2143 | Inactive | Davis, Russell William |

Add your own test data here as you discover valid licenses:

| State | License Number | Expected Status | Notes |
|-------|----------------|-----------------|-------|
|       |                |                 |       |

---

## Support

If tests fail:
1. Check the troubleshooting section above
2. Verify your internet connection
3. Confirm the API endpoint is accessible
4. Try the Alabama/2143 example first
5. Check the README.md for additional details

---

**Ready to go?** Once testing succeeds, proceed to automation setup in README.md!
