-- Fix missing columns in PharmacyFinder database
-- Run this script in SQL Server Management Studio

USE PharmacyFinder;
GO

-- Add LicenseNumber to Users table if it doesn't exist
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('Users') 
    AND name = 'LicenseNumber'
)
BEGIN
    ALTER TABLE Users
    ADD LicenseNumber NVARCHAR(100) NULL;
    
    CREATE UNIQUE NONCLUSTERED INDEX IX_Users_LicenseNumber
    ON Users(LicenseNumber)
    WHERE LicenseNumber IS NOT NULL;
    
    PRINT 'LicenseNumber column added to Users table.';
END
ELSE
BEGIN
    PRINT 'LicenseNumber column already exists in Users table.';
END
GO

-- Add BusinessLicense to Pharmacies table if it doesn't exist
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('Pharmacies') 
    AND name = 'BusinessLicense'
)
BEGIN
    ALTER TABLE Pharmacies
    ADD BusinessLicense NVARCHAR(100) NOT NULL DEFAULT '';
    
    PRINT 'BusinessLicense column added to Pharmacies table.';
END
ELSE
BEGIN
    PRINT 'BusinessLicense column already exists in Pharmacies table.';
END
GO

PRINT 'Database columns fixed successfully!';
GO

