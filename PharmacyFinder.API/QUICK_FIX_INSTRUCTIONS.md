# Quick Fix: Add Missing LicenseNumber Column

## The Problem
The database is missing the `LicenseNumber` column in the `Users` table, causing errors during login and registration.

## Solution: Run SQL Script

### Option 1: Using SQL Server Management Studio (Recommended)

1. **Open SQL Server Management Studio (SSMS)**
   - If you don't have it, download from: https://aka.ms/ssmsfullsetup

2. **Connect to your database:**
   - Server name: `localhost\MSSQLSERVER01`
   - Authentication: Windows Authentication
   - Click "Connect"

3. **Open the SQL script:**
   - File → Open → File
   - Navigate to: `PharmacyFinder.API\fix-database-columns.sql`
   - Or copy the SQL below

4. **Execute the script:**
   - Press F5 or click "Execute"
   - You should see success messages

### Option 2: Using Azure Data Studio

1. Open Azure Data Studio
2. Connect to `localhost\MSSQLSERVER01`
3. Open `fix-database-columns.sql`
4. Run the script

### Option 3: Using Command Line (if sqlcmd works)

```bash
sqlcmd -S localhost\MSSQLSERVER01 -d PharmacyFinder -E -i PharmacyFinder.API/fix-database-columns.sql
```

## SQL Script Content

If you can't open the file, copy and paste this into SSMS:

```sql
USE PharmacyFinder;
GO

-- Add LicenseNumber to Users table
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('Users') AND name = 'LicenseNumber'
)
BEGIN
    ALTER TABLE Users ADD LicenseNumber NVARCHAR(100) NULL;
    CREATE UNIQUE NONCLUSTERED INDEX IX_Users_LicenseNumber
    ON Users(LicenseNumber) WHERE LicenseNumber IS NOT NULL;
    PRINT 'LicenseNumber column added to Users table.';
END
ELSE
BEGIN
    PRINT 'LicenseNumber column already exists in Users table.';
END
GO

-- Add BusinessLicense to Pharmacies table
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('Pharmacies') AND name = 'BusinessLicense'
)
BEGIN
    ALTER TABLE Pharmacies ADD BusinessLicense NVARCHAR(100) NOT NULL DEFAULT '';
    PRINT 'BusinessLicense column added to Pharmacies table.';
END
ELSE
BEGIN
    PRINT 'BusinessLicense column already exists in Pharmacies table.';
END
GO

PRINT 'Database columns fixed successfully!';
GO
```

## After Running the Script

1. **Restart your API** (stop and start `dotnet run`)
2. **Try logging in again** - the error should be gone
3. **Try registering a pharmacy owner** - it should work now

## Verification

To verify the columns were added, run this query in SSMS:

```sql
USE PharmacyFinder;
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE COLUMN_NAME IN ('LicenseNumber', 'BusinessLicense')
ORDER BY TABLE_NAME, COLUMN_NAME;
```

You should see:
- `Users.LicenseNumber` (nullable)
- `Pharmacies.BusinessLicense` (not null)

