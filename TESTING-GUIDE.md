# NGAT Application Testing Guide

## Prerequisites
1. PostgreSQL server running: `brew services start postgresql@15`
2. Express API server running: `node server.js` (or check with `ps aux | grep "node server.js"`)
3. React dev server running: `npm run dev`

## Quick Verification Tests

### 1. Database Connection Test
```bash
# Check PostgreSQL is running
brew services list | grep postgresql
# Should show: postgresql@15 started

# Check database exists and has data
psql audit_db -c "SELECT COUNT(*) FROM audits;"
# Should return: 10

psql audit_db -c "SELECT COUNT(*) FROM programs;"
# Should return: 19

psql audit_db -c "SELECT COUNT(*) FROM nonconformances;"
# Should return: 12
```

### 2. API Endpoint Tests
```bash
# Test lookup endpoint
curl -s http://localhost:3001/api/programs | python3 -m json.tool | head -10
# Should show programs array with programId, programName

# Test audits endpoint
curl -s http://localhost:3001/api/audits | python3 -m json.tool | head -20
# Should show audits array with scheduleId, title, programIds (as array)

# Test nonconformances endpoint
curl -s http://localhost:3001/api/nonconformances/8176 | python3 -m json.tool | head -15
# Should show 6 nonconformances for schedule 8176
```

### 3. Field Name Verification
```bash
# Verify camelCase conversion is working
curl -s http://localhost:3001/api/divisions | grep -o '"division[^"]*"'
# Should show: "divisionId" and "divisionName" (camelCase)
# Should NOT show: "divisionid" or "divisionname" (lowercase)
```

## Frontend Testing Workflow

### Test 1: Home Page
1. Navigate to `http://localhost:5173/`
2. **Expected**: Home page loads with upcoming audits list
3. **Verify**: Audit dates and auditor names display correctly
4. **What's happening**: Home.jsx loads audits from `/api/audits` and formats for display

### Test 2: Audit View
1. Click "Audit View" in navbar or navigate to `http://localhost:5173/audit`
2. **Expected**: Detailed audit display with all fields
3. **Verify**: 
   - Audit selector dropdown shows 10 audits
   - Program names display (not IDs)
   - Division names display (not IDs)
   - Standards display as comma-separated names
   - Findings section shows NC/OBS/OFI items
4. **What's happening**: Audit.jsx loads audits + 12 lookup tables from API, uses helper functions to convert IDs to names

### Test 3: Entry Page - Schedule
1. Navigate to `http://localhost:5173/entry?type=schedule`
2. **Expected**: Schedule entry form loads with all dropdowns populated
3. **Verify**:
   - Programs dropdown shows 19 options
   - Divisions dropdown shows 4 options
   - Sites multi-select shows 10 options
   - Auditors dropdown shows 32 options
   - DataGrid shows 10 existing audits
4. **What's happening**: Schedule.jsx loads 12 lookup tables via Promise.all() from API

### Test 4: Entry Page - Planning
1. Navigate to `http://localhost:5173/entry?type=planning&audit=8176`
2. **Expected**: Planning form auto-populates from selected audit
3. **Verify**:
   - Title shows "AS9100 QMS Audit"
   - Comment auto-populates
   - Scope auto-populates
   - Safety Clearance radio shows selection
   - Safety Equipment multi-select shows selected items
   - Training Requirements multi-select shows selected items
   - FAM/Auditees multi-select shows selected people
4. **What's happening**: Planning.jsx loads 15 lookup tables (including safety/training/roster) and auto-populates from audit data

### Test 5: Entry Page - Results
1. Navigate to `http://localhost:5173/entry?type=results&audit=8176`
2. **Expected**: Results form loads with questions populated
3. **Verify**:
   - Overview field auto-populates
   - Standards/Programs auto-populate
   - PEQ Section shows 2 questions with pre-filled responses
   - ETQ Section shows 2 questions with pre-filled responses
   - AS9100 sections 4.1-4.3 show with questions
   - All questions show existing responses from database
4. **What's happening**: 
   - Results.jsx loads 13 lookup tables from API
   - Separate fetch for nonconformances from `/api/nonconformances/8176`
   - Auto-population useEffect triggers when nonconformances state updates

### Test 6: Save Functionality
1. In Results page (schedule 8176), modify a response
2. Change "Supplier quality agreements..." to "UPDATED: Supplier quality agreements..."
3. Click "Submit Audit"
4. **Expected**: Alert shows "Nonconformances saved successfully"
5. **Verify in database**:
   ```bash
   psql audit_db -c "SELECT response FROM nonconformances WHERE scheduleId = 8176 AND type = 'PEQ' LIMIT 1;"
   ```
   Should show updated text starting with "UPDATED:"
6. **Refresh page** - verify change persists

## Debugging Common Issues

### Issue: "Loading..." shows indefinitely
**Cause**: API server not running or endpoint not responding  
**Fix**:
```bash
# Check server is running
ps aux | grep "node server.js"

# If not running, start it
cd "/Users/walterosborne/NGAT Test/my-app"
node server.js > server.log 2>&1 &

# Check logs for errors
cat server.log
```

### Issue: Dropdowns are empty
**Cause**: API endpoint returning empty array or wrong field names  
**Fix**:
```bash
# Test endpoint directly
curl -s http://localhost:3001/api/programs

# Should return array of objects with programId and programName
# If empty, check database:
psql audit_db -c "SELECT COUNT(*) FROM programs;"

# If database empty, re-run migration:
psql audit_db < migrate-all-data.sql
```

### Issue: Console shows "undefined" for field names
**Cause**: Server not converting PostgreSQL lowercase to camelCase  
**Fix**:
1. Test API response format:
   ```bash
   curl -s http://localhost:3001/api/programs | grep -o '"program[^"]*"'
   ```
   Should show: `"programId"` and `"programName"` (camelCase)
   
2. If showing lowercase (`"programid"`), check server.js has explicit mapping:
   ```javascript
   const data = result.rows.map(row => ({
       programId: row.programid,          // Explicit conversion
       programName: row.programname
   }));
   ```

### Issue: Arrays showing as strings
**Cause**: JSONB not being parsed correctly  
**Fix**:
```bash
# Test array parsing
curl -s http://localhost:3001/api/audits | python3 -c "import sys, json; data = json.load(sys.stdin); print(type(data[0]['programIds']))"

# Should show: <class 'list'>
# If shows <class 'str'>, check server.js doesn't have JSON.parse() - PostgreSQL auto-parses
```

### Issue: Changes not saving to database
**Cause**: Transaction failing or rollback occurring  
**Fix**:
1. Check server logs for errors:
   ```bash
   cat server.log | grep -i error
   ```
2. Test POST endpoint directly:
   ```bash
   curl -X POST http://localhost:3001/api/save-nonconformances \
     -H "Content-Type: application/json" \
     -d '{"scheduleId":8176,"nonconformances":[]}'
   
   # Should return: {"success":true}
   ```

### Issue: Page shows old data after database update
**Cause**: apiData.js caching old results  
**Fix**:
Clear browser cache or clear apiData cache:
```javascript
// In browser console
import { clearCache } from './assets/data/apiData';
clearCache();
// Then refresh page
```

## Performance Monitoring

### API Response Times
```bash
# Test endpoint speed
time curl -s http://localhost:3001/api/audits > /dev/null

# Should be < 100ms for local PostgreSQL
```

### Database Query Performance
```sql
-- Check slow queries (if any)
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public';
```

## Data Integrity Checks

### Verify Foreign Key Relationships
```sql
-- Check all audits have valid auditTypeId
SELECT a.scheduleId, a.title, a.auditTypeId, at.auditTypeName
FROM audits a
LEFT JOIN audit_types at ON a.auditTypeId = at.auditTypeId
WHERE at.auditTypeId IS NULL;
-- Should return 0 rows

-- Check all audits have valid divisionId
SELECT a.scheduleId, a.title, a.divisionId, d.divisionName
FROM audits a
LEFT JOIN divisions d ON a.divisionId = d.divisionId
WHERE d.divisionId IS NULL;
-- Should return 0 rows
```

### Verify JSONB Array References
```sql
-- Check if all programIds in audits reference valid programs
SELECT a.scheduleId, 
       a.title, 
       a.programIds,
       (SELECT array_agg(p.programName) 
        FROM programs p 
        WHERE p.programId = ANY(
          SELECT jsonb_array_elements_text(a.programIds::jsonb)::int
        )) as program_names
FROM audits a
WHERE a.programIds IS NOT NULL;
-- Should show audit with resolved program names
```

## Complete Test Cycle

### Full Workflow Test
1. **Start servers**:
   ```bash
   # Terminal 1: API Server
   cd "/Users/walterosborne/NGAT Test/my-app"
   node server.js
   
   # Terminal 2: React Dev Server
   npm run dev
   ```

2. **Navigate to Schedule Entry**:
   - Go to `http://localhost:5173/entry?type=schedule`
   - Verify all dropdowns populated
   - Select audit 8176 from grid
   - Verify form auto-populates

3. **Navigate to Planning Entry**:
   - URL should update to `?type=planning&audit=8176`
   - Verify all fields auto-populate:
     - Title: "AS9100 QMS Audit"
     - Comment: Contains audit details
     - Scope: Contains process elements
     - Safety Clearance: Pre-selected
     - Safety Equipment: Pre-selected items
     - Training: Pre-selected items
     - FAM/Auditees: Pre-selected people

4. **Navigate to Results Entry**:
   - URL should update to `?type=results&audit=8176`
   - Verify Overview auto-populates
   - Verify PEQ section shows 2 questions with responses
   - Verify ETQ section shows 2 questions with responses
   - Verify AS9100 sections 4.1-4.3 show with questions

5. **Test Save**:
   - Modify a response in Results
   - Click "Submit Audit"
   - Verify success alert
   - Refresh page
   - Verify change persists (loaded from database)

6. **Verify Database Updated**:
   ```bash
   psql audit_db -c "SELECT COUNT(*) FROM nonconformances WHERE scheduleId = 8176;"
   # Should show 6 (2 PEQ + 2 ETQ + 2 AS9100)
   ```

## Expected Component Behavior

### Loading Sequence
1. Component mounts → `loading = true`
2. `useEffect` fires → API calls start
3. `Promise.all()` waits for all data
4. State updated → `setPrograms()`, `setDivisions()`, etc.
5. `loading = false` → Component renders with data

**Timing**: Should take 50-200ms total for all API calls

### Error Handling
If API call fails:
- Console shows error message
- Component sets empty arrays as fallback
- `loading = false` → Component renders (may be empty)

## Browser Console Verification

Open browser DevTools (F12) and check:

### Network Tab
- Should see multiple requests to `http://localhost:3001/api/...`
- All should return 200 OK status
- Response preview should show camelCase field names

### Console Tab
- Should see no error messages
- If you see "Error loading lookup data:", API server may be down

### React DevTools (if installed)
- Check component state after loading
- `programs` state should be array of 19 items
- `audits` state should be array of 10 items
- `loading` state should be `false`

## Migration Verification Checklist

- [ ] PostgreSQL service running
- [ ] Database `audit_db` exists with 19 tables
- [ ] All tables have data (270+ total records)
- [ ] Express server running on port 3001
- [ ] All 21 API endpoints respond with 200 OK
- [ ] API responses use camelCase field names
- [ ] JSONB arrays parse to JavaScript arrays
- [ ] Home.jsx loads and shows upcoming audits
- [ ] Audit.jsx loads and shows audit details
- [ ] Entry/Schedule loads with populated dropdowns
- [ ] Entry/Planning loads with auto-population working
- [ ] Entry/Results loads with questions populated
- [ ] Save functionality persists changes to database
- [ ] Refresh page loads saved data correctly
- [ ] No console errors in browser

## Success Criteria

✅ All components load without "Loading..." stuck indefinitely  
✅ All dropdowns show options (not empty)  
✅ Audit grid shows 10 audits  
✅ Auto-population works across Schedule → Planning → Results  
✅ Save operation updates database  
✅ Data persists after page refresh  
✅ No JavaScript errors in browser console  
✅ API endpoints return camelCase field names  
✅ Arrays stored as JSONB in database parse correctly  

## Rollback Plan (If Needed)

If the database migration causes issues, you can revert to static files:

1. **Stop using API**: Comment out useEffect in components
2. **Restore static imports**: 
   ```javascript
   import { programs } from './assets/data/programs';
   ```
3. **Keep database**: Data still in PostgreSQL for future use

However, the migration is designed to be non-destructive - **static data files still exist** in `/src/assets/data/` folder, so old code would still work if reverted.

## Next Steps After Verification

1. **Add error boundaries** to handle API failures gracefully
2. **Add retry logic** for failed API calls
3. **Add loading spinners** instead of text
4. **Add data refresh button** to clear cache
5. **Add optimistic updates** for better UX during saves
6. **Add form validation** before POST requests
7. **Add success/error toasts** instead of alerts
8. **Set up environment variables** for API URL configuration
