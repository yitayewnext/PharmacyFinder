using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PharmacyFinder.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AllowMultiplePharmaciesPerOwner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Pharmacies_LicenseNumber",
                table: "Pharmacies");

            migrationBuilder.CreateIndex(
                name: "IX_Pharmacies_LicenseNumber",
                table: "Pharmacies",
                column: "LicenseNumber");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Pharmacies_LicenseNumber",
                table: "Pharmacies");

            migrationBuilder.CreateIndex(
                name: "IX_Pharmacies_LicenseNumber",
                table: "Pharmacies",
                column: "LicenseNumber",
                unique: true);
        }
    }
}
