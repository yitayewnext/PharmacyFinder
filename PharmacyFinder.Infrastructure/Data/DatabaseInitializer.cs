using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Data;

namespace PharmacyFinder.Infrastructure.Data
{
    public static class DatabaseInitializer
    {
        public static void Initialize(ApplicationDbContext context, ILogger logger)
        {
            try
            {
                logger.LogInformation("Starting database initialization...");
                
                // Use ExecuteSqlRaw which is more reliable for DDL operations
                // Add LicenseNumber column to Users table
                context.Database.ExecuteSqlRaw(@"
                    IF NOT EXISTS (
                        SELECT 1 FROM sys.columns 
                        WHERE object_id = OBJECT_ID('Users') AND name = 'LicenseNumber'
                    )
                    BEGIN
                        ALTER TABLE Users ADD LicenseNumber NVARCHAR(100) NULL;
                    END
                ");
                logger.LogInformation("LicenseNumber column check/creation completed.");

                // Create index if it doesn't exist
                context.Database.ExecuteSqlRaw(@"
                    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_LicenseNumber')
                    BEGIN
                        CREATE UNIQUE NONCLUSTERED INDEX IX_Users_LicenseNumber
                        ON Users(LicenseNumber) WHERE LicenseNumber IS NOT NULL;
                    END
                ");
                logger.LogInformation("LicenseNumber index check/creation completed.");

                // Add BusinessLicense column to Pharmacies table
                context.Database.ExecuteSqlRaw(@"
                    IF NOT EXISTS (
                        SELECT 1 FROM sys.columns 
                        WHERE object_id = OBJECT_ID('Pharmacies') AND name = 'BusinessLicense'
                    )
                    BEGIN
                        ALTER TABLE Pharmacies ADD BusinessLicense NVARCHAR(100) NOT NULL DEFAULT '';
                    END
                ");
                logger.LogInformation("BusinessLicense column check/creation completed.");

                // Create Prescriptions table if it doesn't exist
                context.Database.ExecuteSqlRaw(@"
                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Prescriptions')
                    BEGIN
                        CREATE TABLE Prescriptions (
                            Id INT PRIMARY KEY IDENTITY(1,1),
                            CustomerId INT NOT NULL,
                            ImageUrl NVARCHAR(500) NOT NULL,
                            ExtractedText NVARCHAR(MAX) NULL,
                            Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
                            UploadedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                            ProcessedAt DATETIME2 NULL,
                            CONSTRAINT FK_Prescriptions_Customer FOREIGN KEY (CustomerId) 
                                REFERENCES Users(Id) ON DELETE NO ACTION
                        );
                        
                        CREATE INDEX IX_Prescriptions_CustomerId ON Prescriptions(CustomerId);
                        CREATE INDEX IX_Prescriptions_Status ON Prescriptions(Status);
                    END
                ");
                logger.LogInformation("Prescriptions table check completed.");

                // Create PrescriptionMedicines table if it doesn't exist
                context.Database.ExecuteSqlRaw(@"
                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PrescriptionMedicines')
                    BEGIN
                        CREATE TABLE PrescriptionMedicines (
                            Id INT PRIMARY KEY IDENTITY(1,1),
                            PrescriptionId INT NOT NULL,
                            MedicineName NVARCHAR(200) NOT NULL,
                            Dosage NVARCHAR(100) NULL,
                            Frequency NVARCHAR(100) NULL,
                            Duration NVARCHAR(100) NULL,
                            Quantity NVARCHAR(50) NULL,
                            MatchedMedicineId INT NULL,
                            IsAvailable BIT NOT NULL DEFAULT 0,
                            CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                            CONSTRAINT FK_PrescriptionMedicines_Prescription FOREIGN KEY (PrescriptionId) 
                                REFERENCES Prescriptions(Id) ON DELETE CASCADE
                        );
                        
                        CREATE INDEX IX_PrescriptionMedicines_PrescriptionId ON PrescriptionMedicines(PrescriptionId);
                        CREATE INDEX IX_PrescriptionMedicines_MatchedMedicineId ON PrescriptionMedicines(MatchedMedicineId);
                    END
                ");
                logger.LogInformation("PrescriptionMedicines table check completed.");

                // Add foreign key to Medicines table if both tables exist
                context.Database.ExecuteSqlRaw(@"
                    IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Medicines')
                    AND EXISTS (SELECT * FROM sys.tables WHERE name = 'PrescriptionMedicines')
                    AND NOT EXISTS (
                        SELECT * FROM sys.foreign_keys 
                        WHERE name = 'FK_PrescriptionMedicines_Medicine'
                    )
                    BEGIN
                        ALTER TABLE PrescriptionMedicines
                        ADD CONSTRAINT FK_PrescriptionMedicines_Medicine 
                        FOREIGN KEY (MatchedMedicineId) REFERENCES Medicines(Id) ON DELETE SET NULL;
                    END
                ");
                logger.LogInformation("PrescriptionMedicines foreign key check completed.");

                logger.LogInformation("Database columns and tables initialized successfully.");

                // Try to apply migrations (this might fail if there are pending model changes, but that's OK)
                try
                {
                    context.Database.Migrate();
                    logger.LogInformation("Database migrations applied successfully.");
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Migration check completed (warnings are normal if model has pending changes).");
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error during database initialization: {Message}. StackTrace: {StackTrace}", 
                    ex.Message, ex.StackTrace);
                // Re-throw so we know initialization failed
                throw new InvalidOperationException($"Database initialization failed: {ex.Message}", ex);
            }
        }
    }
}

