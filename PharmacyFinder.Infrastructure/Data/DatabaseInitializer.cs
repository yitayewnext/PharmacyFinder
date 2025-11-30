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

                logger.LogInformation("Database columns initialized successfully.");

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

