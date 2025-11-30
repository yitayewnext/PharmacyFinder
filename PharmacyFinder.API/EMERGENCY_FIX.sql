-- EMERGENCY FIX: Run this SQL script to add missing columns
-- Copy and paste this entire script into SQL Server Management Studio and execute it

USE PharmacyFinder;
GO

-- Step 1: Add LicenseNumber to Users table
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('Users') AND name = 'LicenseNumber'
)
BEGIN
    ALTER TABLE Users ADD LicenseNumber NVARCHAR(100) NULL;
    PRINT 'SUCCESS: LicenseNumber column added to Users table.';
END
ELSE
BEGIN
    PRINT 'INFO: LicenseNumber column already exists in Users table.';
END
GO

-- Step 2: Create index for LicenseNumber
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_LicenseNumber')
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX IX_Users_LicenseNumber
    ON Users(LicenseNumber) WHERE LicenseNumber IS NOT NULL;
    PRINT 'SUCCESS: Index IX_Users_LicenseNumber created.';
END
ELSE
BEGIN
    PRINT 'INFO: Index IX_Users_LicenseNumber already exists.';
END
GO

-- Step 3: Add BusinessLicense to Pharmacies table
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('Pharmacies') AND name = 'BusinessLicense'
)
BEGIN
    ALTER TABLE Pharmacies ADD BusinessLicense NVARCHAR(100) NOT NULL DEFAULT '';
    PRINT 'SUCCESS: BusinessLicense column added to Pharmacies table.';
END
ELSE
BEGIN
    PRINT 'INFO: BusinessLicense column already exists in Pharmacies table.';
END
GO

-- Verification: Check if columns exist
SELECT 
    'Users' AS TableName,
    'LicenseNumber' AS ColumnName,
    CASE WHEN EXISTS (
        SELECT 1 FROM sys.columns 
        WHERE object_id = OBJECT_ID('Users') AND name = 'LicenseNumber'
    ) THEN 'EXISTS' ELSE 'MISSING' END AS Status
UNION ALL
SELECT 
    'Pharmacies' AS TableName,
    'BusinessLicense' AS ColumnName,
    CASE WHEN EXISTS (
        SELECT 1 FROM sys.columns 
        WHERE object_id = OBJECT_ID('Pharmacies') AND name = 'BusinessLicense'
    ) THEN 'EXISTS' ELSE 'MISSING' END AS Status;
GO

PRINT '========================================';
PRINT 'EMERGENCY FIX COMPLETED!';
PRINT 'Please restart your API and try again.';
PRINT '========================================';
GO

