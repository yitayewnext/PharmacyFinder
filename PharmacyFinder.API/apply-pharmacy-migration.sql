-- Migration: AddPharmacyTable
-- Run this script in SQL Server Management Studio or your SQL client

-- Alter Users table ApprovalStatus column
ALTER TABLE [Users]
ALTER COLUMN [ApprovalStatus] nvarchar(50) NOT NULL;
GO

-- Create Pharmacies table
CREATE TABLE [Pharmacies] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(200) NOT NULL,
    [Address] nvarchar(500) NOT NULL,
    [City] nvarchar(100) NOT NULL,
    [State] nvarchar(50) NOT NULL,
    [ZipCode] nvarchar(20) NOT NULL,
    [PhoneNumber] nvarchar(20) NOT NULL,
    [Email] nvarchar(255) NOT NULL,
    [LicenseNumber] nvarchar(100) NOT NULL,
    [Latitude] float NOT NULL,
    [Longitude] float NOT NULL,
    [OperatingHours] nvarchar(max) NOT NULL,
    [ApprovalStatus] nvarchar(50) NOT NULL DEFAULT 'Pending',
    [OwnerId] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [ApprovedAt] datetime2 NULL,
    [ApprovedBy] int NULL,
    [IsActive] bit NOT NULL,
    CONSTRAINT [PK_Pharmacies] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Pharmacies_Users_OwnerId] FOREIGN KEY ([OwnerId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO

-- Create indexes
CREATE UNIQUE INDEX [IX_Pharmacies_LicenseNumber] ON [Pharmacies] ([LicenseNumber]);
GO

CREATE INDEX [IX_Pharmacies_OwnerId] ON [Pharmacies] ([OwnerId]);
GO



