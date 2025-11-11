# Airtable Environment Compatibility Guide

## Understanding HTTP Functions in Airtable

Airtable automations use different HTTP functions depending on the environment and version:

| Function | Availability | Used In |
|----------|-------------|---------|
| `remoteFetchAsync` | Older automation environments | Most existing scripts |
| `fetch()` | Newer automation environments | Modern web standard |

**The Problem:** Some Airtable bases have `remoteFetchAsync`, some have `fetch()`, and some have both!

## 🔍 Step 1: Run the Diagnostic

Before using any automation script, run the diagnostic to check your environment:

1. Create a new Airtable automation
2. Add a "Run a script" action
3. Copy and paste the contents of `airtable-diagnostic-check.js`
4. Run the automation
5. Check the console output

### Understanding the Results

```
✅ remoteFetchAsync is AVAILABLE
❌ fetch is NOT available
→ Use: Standard scripts (airtable-automation-license-status.js)
```

```
❌ remoteFetchAsync is NOT available
✅ fetch is AVAILABLE
→ Use: Fetch version (airtable-automation-fetch-version.js)
```

```
✅ remoteFetchAsync is AVAILABLE
✅ fetch is AVAILABLE
→ Use: Either version will work (fetch version recommended)
```

## 📋 Script Compatibility Chart

| Script | Requires | Works With |
|--------|----------|------------|
| `airtable-diagnostic-check.js` | Nothing | All environments |
| `airtable-automation-fetch-version.js` | `fetch()` | ✅ Modern environments |
| `airtable-automation-simple-trigger.js` | `remoteFetchAsync` | ⚠️ Legacy environments |
| `airtable-automation-license-status.js` | `remoteFetchAsync` | ⚠️ Legacy environments |
| `airtable-automation-daily-batch.js` | `remoteFetchAsync` | ⚠️ Legacy environments |

**Recommendation:** If your diagnostic shows `fetch()` is available, use `airtable-automation-fetch-version.js`

## 🛠️ Common Error Messages

### Error: "remoteFetchAsync is not defined"

**What it means:** Your environment doesn't have the older `remoteFetchAsync` function.

**Solution:**
1. ✅ Use `airtable-automation-fetch-version.js` instead
2. ✅ This uses standard `fetch()` which works in your environment

### Error: "fetch is not a function"

**What it means:** Your environment uses the older API.

**Solution:**
1. ✅ Use `airtable-automation-license-status.js` or `airtable-automation-simple-trigger.js`
2. ✅ These use `remoteFetchAsync` which works in your environment

### Both functions unavailable

**What it means:** HTTP requests may not be supported in this context.

**Solutions:**
1. Try using the Scripting Extension instead of Automations
2. Use Airtable's built-in webhook integrations
3. Consider using Make.com or Zapier for external API calls

## 🎯 Quick Decision Tree

```
Start here
    |
    v
Have you run the diagnostic?
    |
    ├─ No  → Run airtable-diagnostic-check.js first!
    |
    └─ Yes → What did it recommend?
            |
            ├─ Use remoteFetchAsync scripts
            |   └─ Use: airtable-automation-simple-trigger.js
            |        (easiest, no input config needed)
            |
            └─ Use fetch() version
                └─ Use: airtable-automation-fetch-version.js
                     (modern, works in all new environments)
```

## 💡 Key Differences Between Scripts

### airtable-automation-fetch-version.js (Recommended for Modern Environments)

**Pros:**
- ✅ Uses modern `fetch()` API
- ✅ No input configuration needed
- ✅ Works in new Airtable environments
- ✅ More future-proof

**Cons:**
- ❌ Won't work if only `remoteFetchAsync` is available

**When to use:** Your diagnostic shows `fetch` is available

### airtable-automation-simple-trigger.js

**Pros:**
- ✅ No input configuration needed
- ✅ Works in older Airtable environments
- ✅ Simple setup

**Cons:**
- ❌ Requires `remoteFetchAsync`
- ❌ May not work in newer environments

**When to use:** Your diagnostic shows `remoteFetchAsync` is available

### airtable-automation-license-status.js

**Pros:**
- ✅ Can get specific record ID from trigger
- ✅ More precise record targeting

**Cons:**
- ❌ Requires input configuration setup
- ❌ Requires `remoteFetchAsync`
- ❌ Slightly more complex setup

**When to use:** You need input configuration AND have `remoteFetchAsync`

## 🔧 Migration Guide

### If you're getting remoteFetchAsync errors:

**Old script:** `airtable-automation-license-status.js` or `airtable-automation-simple-trigger.js`

**New script:** `airtable-automation-fetch-version.js`

**Changes needed:**
1. Replace the entire script content
2. Update table name on line 23 (same as before)
3. Remove any input configuration (not needed)
4. Test the automation

**No code changes needed!** Just swap the script files.

## 📞 Still Having Issues?

1. **Check your Airtable plan:** Some features may be limited on free plans
2. **Try the Scripting Extension:** Run `airtable-test-extension.js` to test API calls
3. **Verify network access:** Ensure your Airtable base can reach external APIs
4. **Check automation limits:** You may have hit your automation run limit

## 🎓 Additional Resources

- **TESTING.md** - How to test the API before setting up automations
- **AUTOMATION-FIX.md** - Technical details about the API differences
- **README.md** - Complete setup guide for all scripts

---

**Last Updated:** January 2025
**Airtable API:** Supports both `remoteFetchAsync` and `fetch()` depending on environment
