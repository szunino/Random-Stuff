# Troubleshooting: Status Not Being Written to Cell

If your automation runs successfully but the Status field remains empty, follow this guide to diagnose and fix the issue.

## Quick Diagnosis

Run the **DEBUG version** first to see exactly what's happening:

1. Replace your current script with `airtable-automation-fetch-debug.js`
2. Run the automation
3. Check the automation run history for detailed logs
4. Look for specific error messages or warnings

## Common Causes & Solutions

### 1. ❌ Single Select Field Options Don't Match

**Problem:** Your Status field is set to "Single Select" but the API value doesn't match any of the predefined options.

**Example:**
- API returns: `"Active"`
- Your Single Select options: `"ACTIVE"`, `"INACTIVE"` (wrong case)
- Result: Update fails silently

**Solution A - Add the correct options:**
1. Go to your Airtable table
2. Click on the Status field header
3. Click "Customize field type"
4. Add these options (exact spelling):
   - `Active`
   - `Inactive`
   - `Expired`
   - `Unknown`
   - `Error`

**Solution B - Change field type:**
1. Click on the Status field header
2. Click "Customize field type"
3. Change from "Single select" to "Single line text"
4. This accepts any text value

**Solution C - Use the improved script:**
- Use `airtable-automation-fetch-improved.js`
- This version automatically handles case mismatches

---

### 2. ❌ Field Name Doesn't Match

**Problem:** The field in your table isn't named exactly "Status"

**How to check:**
```javascript
console.log(table.fields.map(f => f.name).join(', '));
```

**Solution:**
Update line 23 in the script to use the correct field name:

```javascript
// If your field is named "License Status"
let query = await table.selectRecordsAsync({
    fields: ['State', 'License Number', 'License Status']
});

// And update line 78 to:
await table.updateRecordAsync(record.id, {
    'License Status': status
});
```

---

### 3. ❌ Table Name Doesn't Match

**Problem:** Line 23 has the wrong table name

**Solution:**
```javascript
let table = base.getTable('Your Actual Table Name');
```

**How to check:** Look at the bottom of your Airtable base - the table name is shown on each tab.

---

### 4. ❌ Permissions Issue

**Problem:** The automation doesn't have permission to edit the table

**Solution:**
1. Check that you're the owner of the base or have edit permissions
2. Try creating a new automation from scratch
3. Make sure the table isn't locked or restricted

---

### 5. ❌ API Returns Status in Different Format

**Problem:** The API might return the status field with a different key

**How to check:**
Look at the debug logs for "Full API Response" - check what fields are actually returned.

**Example issue:**
```json
{
  "status": "Active",     // lowercase 's'
  "license_number": "123"
}
```

**Solution:**
Update line 72 in the script:
```javascript
// If API uses lowercase 'status'
let status = data.status || data.Status || 'Unknown';
```

---

### 6. ❌ Record Already Has a Status

**Problem:** The automation only processes records where Status is empty

**How to check:**
Look at your record - does the Status field already have a value (even if it's old)?

**Solution:**
Either:
1. Manually clear the Status field to re-trigger the automation
2. Modify the trigger conditions to allow re-running:
   - Remove the "Status is empty" condition
   - Add a "Last Modified" condition instead

---

### 7. ❌ Automation Runs But Finds No Records

**Problem:** The filter conditions don't match any records

**Debug logs will show:** `Found 0 records with empty Status`

**Solution:**
Check your records have:
- State field filled
- License Number field filled
- Status field EMPTY

---

## Step-by-Step Debugging Process

### Step 1: Use the Debug Version

Replace your script with `airtable-automation-fetch-debug.js`

### Step 2: Check the Logs

Go to:
1. Your automation
2. Click "Run history"
3. Click the most recent run
4. Click on the "Run script" action
5. Look at the console output

### Step 3: Look for These Key Messages

**✅ Good signs:**
```
✅ Table found: Medical Licenses
✅ Status field found: Status (singleSelect)
📝 Single Select options:
  - "Active"
  - "Inactive"
✅ Found 1 records with empty Status
✅ Success! Status: Active
✅✅✅ Record updated successfully!
✅ SUCCESS! Status was written to the cell!
```

**❌ Bad signs and what they mean:**
```
❌ WARNING: Status field not found!
→ Field name is wrong, check line 23

❌ WARNING: Status value does NOT match any Single Select option
→ Add the option to your field or use the improved version

❌❌❌ ERROR during update:
→ Check the error message for specific guidance

❌ PROBLEM: Status field is still empty after update!
→ Permission issue or field type mismatch
```

### Step 4: Apply the Solution

Based on the logs, apply one of the solutions above.

### Step 5: Switch to Production Version

Once working, switch back to:
- `airtable-automation-fetch-version.js` (regular version), or
- `airtable-automation-fetch-improved.js` (handles Single Select better)

---

## Still Not Working?

### Check these advanced issues:

1. **Base permissions:**
   - Are you a base owner or collaborator with edit access?
   - Is the table shared with correct permissions?

2. **Field configuration:**
   - Is the field set to "Read-only"?
   - Is there a field validation rule blocking the update?

3. **Automation limits:**
   - Have you exceeded your automation run limit?
   - Check your workspace settings

4. **API response:**
   - Is the API actually returning a Status field?
   - Check the "Full API Response" in the debug logs

5. **Network issues:**
   - Is the API call completing successfully?
   - Check for `API Response: 200` in the logs

---

## Quick Reference: Script Versions

| Script | Use Case |
|--------|----------|
| `airtable-automation-fetch-debug.js` | **Use this first** - Extensive logging to diagnose issues |
| `airtable-automation-fetch-improved.js` | Handles Single Select fields better, use after diagnosing |
| `airtable-automation-fetch-version.js` | Standard version, use once everything works |

---

## Example: Typical Single Select Fix

**Scenario:** Debug logs show:
```
❌ WARNING: Status value does NOT match any Single Select option
```

**Steps:**
1. Go to your table in Airtable
2. Click the "Status" field header
3. Click "Customize field type"
4. Under "Choices", add:
   - Active (with a green color)
   - Inactive (with a red color)
   - Expired (with an orange color)
   - Unknown (with a gray color)
5. Click "Save"
6. Clear the Status field on your test record
7. Run the automation again
8. ✅ Should work now!

---

## Need More Help?

1. Run the debug version and save the complete console output
2. Check if the API is returning data correctly
3. Verify all field names match exactly (case-sensitive!)
4. Try changing Status from Single Select to Single Line Text temporarily

---

**Last Updated:** January 2025
**Related Files:**
- `airtable-automation-fetch-debug.js`
- `airtable-automation-fetch-improved.js`
- `ENVIRONMENT-COMPATIBILITY.md`
