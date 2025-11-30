-- Add LicenseNumber column to Users table
-- This script adds the missing LicenseNumber column for pharmacy owners

USE PharmacyFinder;
GO

-- Check if column already exists, if not add it
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('Users') 
    AND name = 'LicenseNumber'
)
BEGIN
    -- Add the LicenseNumber column
    ALTER TABLE Users
    ADD LicenseNumber NVARCHAR(100) NULL;
    
    -- Create unique index on LicenseNumber (filtered to allow NULLs)
    CREATE UNIQUE NONCLUSTERED INDEX IX_Users_LicenseNumber
    ON Users(LicenseNumber)
    WHERE LicenseNumber IS NOT NULL;
    
    PRINT 'LicenseNumber column added successfully to Users table.';
END
ELSE
BEGIN
    PRINT 'LicenseNumber column already exists in Users table.';
END
GO

