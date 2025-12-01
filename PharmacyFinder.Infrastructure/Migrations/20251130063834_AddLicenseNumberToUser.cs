using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PharmacyFinder.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLicenseNumberToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1 FROM sys.columns 
                    WHERE object_id = OBJECT_ID('Users') AND name = 'LicenseNumber'
                )
                BEGIN
                    ALTER TABLE Users ADD LicenseNumber NVARCHAR(100) NULL;
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_LicenseNumber')
                BEGIN
                    CREATE UNIQUE NONCLUSTERED INDEX IX_Users_LicenseNumber
                    ON Users(LicenseNumber) WHERE LicenseNumber IS NOT NULL;
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_LicenseNumber",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LicenseNumber",
                table: "Users");
        }
    }
}
