# PostgreSQL Database Architecture

## Overview
The NGAT application now uses a PostgreSQL database (`audit_db`) to store all audit data and lookup tables. This mirrors the production MSSQL server architecture and provides a local development environment.

## Database Statistics
- **Total Tables**: 19 (17 lookup tables + 1 master audits table + 1 nonconformances table)
- **Total Records**: 270+ records across all tables
- **Database Size**: ~15KB data + indexes

## Table Structure

### Lookup Tables (17 tables)
These are simple reference tables with id/name pairs:

1. **audit_types** (5 records)
   - Fields: `auditTypeId`, `auditTypeName`
   - Examples: "Internal Audit", "External Audit", "Supplier Audit"

2. **int_ext** (2 records)
   - Fields: `intExtId`, `intExtName`
   - Values: "Internal", "External"

3. **functions** (10 records)
   - Fields: `functionId`, `functionName`
   - Examples: "Quality Management", "Engineering", "Manufacturing"

4. **statuses** (5 records)
   - Fields: `statusId`, `statusName`
   - Examples: "Scheduled", "In Progress", "Completed"

5. **standards** (18 records)
   - Fields: `standardId`, `standardName`
- Examples: "PEQ", "ETQ", or a standardId (e.g., 1 for AS9100 Rev D)

6. **programs** (19 records)
   - Fields: `programId`, `programName`
   - Includes special `programId = 999` for "All Programs"

7. **divisions** (4 records)
   - Fields: `divisionId`, `divisionName`
   - Examples: "Aerospace Systems", "Mission Systems"

8. **sectors** (2 records)
   - Fields: `sectorId`, `sectorName`
   - Examples: "Defense", "Commercial"

9. **sites** (10 records)
   - Fields: `siteId`, `address`, `city`, `state`, `country`, `divisionId`, `active`
   - Examples: "Plant 42 - Palmdale", "Annapolis Junction, MD", "Baltimore, MD"

10. **business_units** (9 records)
    - Fields: `businessUnitId`, `businessUnitName`

11. **operating_units** (10 records)
    - Fields: `operatingUnitId`, `operatingUnitName`

12. **roster** (20 records)
    - Fields: `myId`, `rosterName`
    - FAM (Functional Area Manager) and Auditee names

13. **auditors** (32 records)
    - Fields: `auditorId`, `auditorName`
    - All available auditors in the system

14. **safety_equipment** (10 records)
    - Fields: `safetyEquipmentId`, `safetyEquipmentName`
    - Examples: "Safety Glasses", "Hard Hat", "Steel-Toed Boots"

15. **training_requirements** (12 records)
    - Fields: `trainingRequirementId`, `trainingRequirementName`
    - Examples: "Hazardous Materials Handling", "Confined Space Entry"

16. **props** (20 records) - Policies, Regulations, Operating Procedures
    - Fields: `propId`, `prop`, `sectorId`, `divisionId`, `siteId`, `businessUnitId`, `operatingUnitId`, `programId`, `propTypeId`, `active`
    - Supports organizational hierarchy filtering (corporate/division/sector/site/etc.)
    - 3 corporate-level props (propIds 1-3) for QMA audits

### Master Tables

17. **audits** (10 records) - Main audit storage
    - Primary key: `scheduleId` (SERIAL)
    - String fields: `title`, `comment`, `scope`, `overview`, `evaluator`, `relatedItems`, `programManager`, `maLeadManager`, `stage`, `leadAuditor`, `clearance`, `processElements`
    - Date fields: `scheduleDate`, `startDate`, `reportDueDate`
    - Integer foreign keys: `auditTypeId`, `divisionId`, `sectorId`, `statusId`, `functionId`, `intExtId`, `leadAuditorId`
    - **JSONB array fields** (stored as JSON, returned as arrays):
      - `standardIds` - array of standard IDs (e.g., [12, 18])
      - `programIds` - array of program IDs (e.g., [13, 14])
      - `siteIds` - array of site IDs
      - `businessUnitIds` - array of business unit IDs
      - `operatingUnitIds` - array of operating unit IDs
      - `additionalAuditorIds` - array of auditor IDs
      - `safetyEquipmentIds` - array of safety equipment IDs
      - `trainingRequirementIds` - array of training requirement IDs
      - `famaIds` - array of FAM/Auditee MyIDs
    - Indexes on: `stage`, `divisionId`, `statusId`, `leadAuditorId`

18. **nonconformances** (12 records) - Audit findings/questions
    - Primary key: `ncId` (SERIAL)
    - Fields: `scheduleId` (FK to audits), `type` (PEQ/ETQ or standardId), `question`, `section`, `subsection`, `response`, `auditorComment`, `files` (JSONB array), `status`, `severity`, `assigned`, `isSelected`
    - Index on: `scheduleId`

## Data Flow Architecture

```
┌─────────────────┐
│  React Frontend │
│  (Port 5173)    │
└────────┬────────┘
         │ HTTP GET/POST
         │ fetch('http://localhost:3001/api/...')
         ↓
┌─────────────────┐
│  Express Server │
│  (Port 3001)    │
│  - server.js    │
│  - 21 endpoints │
└────────┬────────┘
         │ SQL Query
         │ pool.query('SELECT...')
         ↓
┌─────────────────┐
│  PostgreSQL DB  │
│  (Port 5432)    │
│  - audit_db     │
│  - 19 tables    │
└─────────────────┘
```

## API Endpoints

### Lookup Table Endpoints (15 GET endpoints)
All follow the same pattern:
```
GET /api/audit-types       → 5 records
GET /api/int-ext           → 2 records
GET /api/functions         → 10 records
GET /api/statuses          → 5 records
GET /api/standards         → 18 records
GET /api/programs          → 19 records
GET /api/divisions         → 4 records
GET /api/sectors           → 2 records
GET /api/sites             → 10 records
GET /api/business-units    → 9 records
GET /api/operating-units   → 10 records
GET /api/roster            → 20 records
GET /api/auditors          → 32 records
GET /api/safety-equipment  → 10 records
GET /api/training-requirements → 12 records
GET /api/props             → 20 records
```

### Master Data Endpoints

**Audits** (2 endpoints):
```
GET  /api/audits           → Returns all 10 audits with full data
POST /api/audits           → Insert new or update existing audit
  - Supports both INSERT (new audit) and UPDATE (existing)
  - Uses transaction with ROLLBACK on error
  - Returns scheduleId for new audits
```

**Nonconformances** (3 endpoints):
```
GET  /api/nonconformances/:scheduleId  → Returns NCs for specific audit
GET  /api/nonconformances              → Returns all NCs
POST /api/save-nonconformances         → Saves NCs with transaction
  - DELETE all for scheduleId
  - INSERT all new records
  - COMMIT or ROLLBACK
```

## Critical Technical Details

### 1. Column Name Conversion (PostgreSQL → JavaScript)
PostgreSQL returns all column names in **lowercase** by default. The server explicitly converts to **camelCase**:

```javascript
// PostgreSQL returns: ncid, scheduleid, auditorcomment
// Server converts to: ncId, scheduleId, auditorComment

const data = result.rows.map(row => ({
    ncId: row.ncid,                     // Explicit mapping
    scheduleId: row.scheduleid,
    auditorComment: row.auditorcomment,
    // ... etc for all fields
}));
```

**Why this matters**: React components use camelCase (`programId`, `scheduleId`). Without conversion, fields would be undefined in the UI.

### 2. JSONB Array Storage
PostgreSQL stores JavaScript arrays as JSONB (binary JSON format):

```javascript
// JavaScript array → PostgreSQL JSONB
const programIds = [13, 14, 15];
await pool.query(
    'INSERT INTO audits (programIds) VALUES ($1)',
    [JSON.stringify(programIds)]  // Stored as JSONB: [13,14,15]
);

// PostgreSQL JSONB → JavaScript array
const result = await pool.query('SELECT programIds FROM audits');
const programs = result.rows[0].programids; // Already parsed! → [13, 14, 15]
```

**Key insight**: PostgreSQL automatically parses JSONB back to JavaScript objects/arrays. No `JSON.parse()` needed in server.

### 3. Transaction-Based Saves
All save operations use transactions for data integrity:

```javascript
try {
    await pool.query('BEGIN');
    await pool.query('DELETE FROM nonconformances WHERE scheduleId = $1', [scheduleId]);
    // Insert all new records...
    await pool.query('COMMIT');
} catch (err) {
    await pool.query('ROLLBACK');
    throw err;
}
```

**Why**: Ensures all-or-nothing saves. If any INSERT fails, entire operation reverts.

### 4. Connection Pooling
Server uses connection pool for performance:

```javascript
const pool = new Pool({
    user: 'walterosborne',
    host: 'localhost',
    database: 'audit_db',
    password: 'postgres',
    port: 5432
});
```

**Benefits**: Reuses database connections instead of creating new ones for each request.

## Frontend Integration

### API Data Utility (`apiData.js`)
Centralized data fetcher with caching:

```javascript
const cache = {};

async function fetchData(endpoint) {
    if (cache[endpoint]) return cache[endpoint]; // Return cached
    const response = await fetch(`http://localhost:3001/api/${endpoint}`);
    const data = await response.json();
    cache[endpoint] = data;
    return data;
}

export async function getPrograms() {
    return await fetchData('programs');
}
// ... 16 more getters
```

### Component Loading Pattern
All components now use the same async loading pattern:

```javascript
import { getPrograms, getDivisions, getAudits } from './assets/data/apiData';

function MyComponent() {
    const [programs, setPrograms] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [programsData, divisionsData] = await Promise.all([
                    getPrograms(),
                    getDivisions()
                ]);
                setPrograms(programsData);
                setDivisions(divisionsData);
                setLoading(false);
            } catch (error) {
                console.error('Error loading data:', error);
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) return <div>Loading...</div>;
    
    // Rest of component...
}
```

**Key features**:
- Uses `Promise.all()` to fetch multiple datasets in parallel
- Loading state prevents rendering errors while data fetches
- Error handling with fallback empty states

## Updated Components

All components now use API instead of static imports:

1. **Home.jsx** - Loads audits for upcoming audit list
2. **Entry.jsx** - Loads audits to pass to child components
3. **Audit.jsx** - Loads audits + 12 lookup tables
4. **Schedule.jsx** - Loads 12 lookup tables
5. **Planning.jsx** - Loads 15 lookup tables (includes safety/training/roster)
6. **Results.jsx** - Loads 13 lookup tables + nonconformances
7. **Nonconformaties.jsx** - Loads 12 lookup tables

## Migration Files

### `migrate-all-data.sql` (442 lines)
Complete database initialization script:
- Creates all 17 lookup tables
- Creates audits master table
- Inserts all 270+ records
- Creates 4 performance indexes
- Resets all sequences to max ID
- Includes verification SELECT statements

**To reset database completely**:
```bash
psql audit_db < migrate-all-data.sql
```

### `db-setup.sql` (47 lines)
Original setup - only nonconformances table. **Use `migrate-all-data.sql` instead** for full setup.

## Database Access

### Direct PostgreSQL Queries
```bash
# Connect to database
psql audit_db

# View all tables
\dt

# Count records in each table
SELECT COUNT(*) FROM audits;
SELECT COUNT(*) FROM programs;
SELECT COUNT(*) FROM nonconformances;

# View specific audit with all data
SELECT scheduleId, title, programIds, findings 
FROM audits 
WHERE scheduleId = 8176;

# View nonconformances for an audit
SELECT ncId, type, question, response 
FROM nonconformances 
WHERE scheduleId = 8176;
```

### API Testing
```bash
# Test lookup endpoint
curl http://localhost:3001/api/programs | python3 -m json.tool

# Test audits endpoint
curl http://localhost:3001/api/audits | python3 -m json.tool

# Test specific audit's nonconformances
curl http://localhost:3001/api/nonconformances/8176 | python3 -m json.tool
```

## Server Management

### Start Server
```bash
cd "/Users/walterosborne/NGAT Test/my-app"
node server.js
```

### Start Server in Background
```bash
node server.js > server.log 2>&1 &
```

### Check Server Status
```bash
# Check if running
ps aux | grep "node server.js"

# View logs
cat server.log

# Kill server
pkill -f "node server.js"
```

### PostgreSQL Service
```bash
# Start PostgreSQL
brew services start postgresql@15

# Stop PostgreSQL
brew services stop postgresql@15

# Check status
brew services list | grep postgresql
```

## Data Synchronization

### Current State
- All data originally in `/src/assets/data/*.js` files
- Now migrated to PostgreSQL tables
- Static files **still exist** but are **not used** by components anymore
- Components fetch from API endpoints instead

### Updating Data

**Option 1: Direct SQL**
```bash
psql audit_db -c "UPDATE programs SET programName = 'New Name' WHERE programId = 1;"
```

**Option 2: API POST**
```javascript
fetch('http://localhost:3001/api/audits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(auditData)
});
```

**Option 3: Update Migration Script**
Edit `migrate-all-data.sql` and re-run (WARNING: drops all data):
```bash
psql audit_db < migrate-all-data.sql
```

## Example Audit Record

```json
{
  "scheduleId": 8176,
  "title": "AS9100 QMS Audit",
  "auditTypeId": 1,
  "scheduleDate": "2026-03-15",
  "divisionId": 1,
  "statusId": 3,
  "stage": "Conduct Audit",
  "standardIds": [12, 18],
  "programIds": [13, 14],
  "siteIds": [1, 2],
  "leadAuditorId": 1,
  "leadAuditor": "Smith, John",
  "findings": [
    {
      "findingId": 1,
      "findingType": "NC",
      "findingText": "Non-conformance in calibration records",
      "auditorComment": "Missing calibration certificates for 3 gauges"
    },
    {
      "findingId": 2,
      "findingType": "OBS",
      "findingText": "Observation - documentation could be improved",
      "auditorComment": ""
    }
  ]
}
```

## Key Differences: PostgreSQL vs MSSQL

| Feature | PostgreSQL (Dev) | MSSQL (Production) |
|---------|------------------|---------------------|
| Data Type for Arrays | JSONB | VARCHAR (JSON string) or separate junction tables |
| Auto-increment | SERIAL | IDENTITY |
| String concat | `\|\|` | `+` |
| Case sensitivity | Lowercase by default | Preserves case |
| Boolean type | BOOLEAN | BIT |
| Date type | DATE/TIMESTAMP | DATETIME |

**Note**: The server's camelCase conversion pattern will work the same for both databases, making migration to production MSSQL straightforward.

## Troubleshooting

### Server won't connect to database
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Check database exists
psql postgres -c "\l" | grep audit_db

# Check connection credentials in server.js
```

### No data showing in UI
1. Check server is running: `ps aux | grep "node server.js"`
2. Check server logs: `cat server.log`
3. Open browser console - check for fetch errors
4. Test API directly: `curl http://localhost:3001/api/programs`

### Wrong field names (undefined)
- Verify server converts all fields to camelCase
- Check API response: `curl http://localhost:3001/api/audits | grep -i programid`
- Should see: `"programId"` (camelCase) not `"programid"` (lowercase)

### Data not persisting after save
1. Check POST endpoint response for errors
2. Verify transaction committed: Check server logs for "COMMIT"
3. Query database directly: `psql audit_db -c "SELECT COUNT(*) FROM nonconformances;"`

## Performance Considerations

### Current Setup (Development)
- Connection pool size: Default (10 connections)
- No query optimization needed for <300 records
- In-memory caching via `apiData.js` reduces API calls

### Production Recommendations
- Increase pool size based on concurrent users
- Add indexes on frequently queried foreign keys
- Consider materialized views for complex joins
- Implement API rate limiting
- Add authentication/authorization
- Use environment variables for credentials
- Enable SSL/TLS for database connections

## Next Steps for Production Migration

1. **Environment Configuration**
   - Move credentials to `.env` file
   - Use `process.env.DB_HOST`, `DB_USER`, etc.

2. **MSSQL Adaptation**
   - Replace `pg` with `mssql` package
   - Update Pool configuration for MSSQL
   - Adjust SQL syntax (SERIAL → IDENTITY, JSONB → VARCHAR)
   - May need to normalize arrays into junction tables

3. **Security**
   - Add JWT authentication to API
   - Implement role-based access control
   - Enable HTTPS for production
   - Sanitize all SQL inputs (use parameterized queries - already done)

4. **Monitoring**
   - Add logging framework (Winston, Bunyan)
   - Set up error tracking (Sentry)
   - Database query performance monitoring
   - API response time tracking

## Database Schema Diagram

```
audits (Master Table)
├── scheduleId (PK)
├── auditTypeId → audit_types.auditTypeId
├── divisionId → divisions.divisionId
├── sectorId → sectors.sectorId
├── statusId → statuses.statusId
├── functionId → functions.functionId
├── intExtId → int_ext.intExtId
├── leadAuditorId → auditors.auditorId
├── standardIds (JSONB array → standards.standardId)
├── programIds (JSONB array → programs.programId)
├── siteIds (JSONB array → sites.siteId)
├── businessUnitIds (JSONB array → business_units.businessUnitId)
├── operatingUnitIds (JSONB array → operating_units.operatingUnitId)
├── additionalAuditorIds (JSONB array → auditors.auditorId)
├── safetyEquipmentIds (JSONB array → safety_equipment.safetyEquipmentId)
├── trainingRequirementIds (JSONB array → training_requirements.trainingRequirementId)
├── famaIds (JSONB array → roster.myId)
└── findings (JSONB array of objects)

nonconformances
├── ncId (PK)
├── scheduleId → audits.scheduleId
└── files (JSONB array)

props
├── propId (PK)
├── sectorId → sectors.sectorId (nullable)
├── divisionId → divisions.divisionId (nullable)
├── siteId → sites.siteId (nullable)
├── businessUnitId → business_units.businessUnitId (nullable)
├── operatingUnitId → operating_units.operatingUnitId (nullable)
└── programId → programs.programId (nullable)
```

## Cache Management

The `apiData.js` utility caches all API responses to reduce server load:

```javascript
// First call - fetches from server
const programs1 = await getPrograms(); // HTTP request

// Second call - returns cached data
const programs2 = await getPrograms(); // No HTTP request

// Clear cache if data changed
import { clearCache } from './assets/data/apiData';
clearCache();
```

**When to clear cache**:
- After POST operations that modify data
- When switching between different audit contexts
- Manual refresh requested by user

Currently cache persists for entire browser session. Consider adding:
- Time-based expiration (cache for 5 minutes)
- Selective cache clearing (only clear modified tables)
- Cache invalidation on POST success

## Summary

The application has successfully migrated from static file-based data storage to a full PostgreSQL database with:
- ✅ 19 tables with proper schemas and relationships
- ✅ 270+ records migrated from JavaScript files
- ✅ 21 RESTful API endpoints
- ✅ Automatic camelCase conversion for JavaScript compatibility
- ✅ JSONB support for complex array/object fields
- ✅ Transaction-based saves for data integrity
- ✅ Connection pooling for performance
- ✅ All 7 React components updated to use async API loading
- ✅ Loading states to handle async data fetching
- ✅ Centralized API utility with caching

The architecture now mirrors a production environment with MSSQL, making future migration straightforward.
