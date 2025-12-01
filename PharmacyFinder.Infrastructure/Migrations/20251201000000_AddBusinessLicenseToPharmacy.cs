using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PharmacyFinder.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessLicenseToPharmacy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1 FROM sys.columns 
                    WHERE object_id = OBJECT_ID('Pharmacies') AND name = 'BusinessLicense'
                )
                BEGIN
                    ALTER TABLE Pharmacies ADD BusinessLicense NVARCHAR(100) NOT NULL DEFAULT '';
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BusinessLicense",
                table: "Pharmacies");
        }
    }
}

