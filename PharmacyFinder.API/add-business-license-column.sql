-- Add BusinessLicense column to Pharmacies table
-- This script adds the missing BusinessLicense column for pharmacy shops

USE PharmacyFinder;
GO

-- Check if column already exists, if not add it
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('Pharmacies') 
    AND name = 'BusinessLicense'
)
BEGIN
    -- Add the BusinessLicense column
    ALTER TABLE Pharmacies
    ADD BusinessLicense NVARCHAR(100) NOT NULL DEFAULT '';
    
    PRINT 'BusinessLicense column added successfully to Pharmacies table.';
END
ELSE
BEGIN
    PRINT 'BusinessLicense column already exists in Pharmacies table.';
END
GO

