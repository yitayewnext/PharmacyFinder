using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PharmacyFinder.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ChangeRoleToString : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add a temporary column for the string role
            migrationBuilder.AddColumn<string>(
                name: "RoleString",
                table: "Users",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            // Migrate existing data: convert int to string
            migrationBuilder.Sql(@"
                UPDATE Users 
                SET RoleString = CASE 
                    WHEN Role = 1 THEN 'Customer'
                    WHEN Role = 2 THEN 'PharmacyOwner'
                    WHEN Role = 3 THEN 'Admin'
                    ELSE 'Customer'
                END
            ");

            // Drop the old int column
            migrationBuilder.DropColumn(
                name: "Role",
                table: "Users");

            // Rename the temporary column to Role
            migrationBuilder.RenameColumn(
                name: "RoleString",
                table: "Users",
                newName: "Role");

            // Make it required (with default for any null values)
            migrationBuilder.AlterColumn<string>(
                name: "Role",
                table: "Users",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Customer",
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Add a temporary int column
            migrationBuilder.AddColumn<int>(
                name: "RoleInt",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 1);

            // Migrate data back: convert string to int
            migrationBuilder.Sql(@"
                UPDATE Users 
                SET RoleInt = CASE 
                    WHEN Role = 'Customer' THEN 1
                    WHEN Role = 'PharmacyOwner' THEN 2
                    WHEN Role = 'Admin' THEN 3
                    ELSE 1
                END
            ");

            // Drop the string column
            migrationBuilder.DropColumn(
                name: "Role",
                table: "Users");

            // Rename the temporary column to Role
            migrationBuilder.RenameColumn(
                name: "RoleInt",
                table: "Users",
                newName: "Role");
        }
    }
}
