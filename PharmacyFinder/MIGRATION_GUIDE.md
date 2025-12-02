# Database Migration Guide: Role Column Change

## Overview
This migration changes the `Role` column in the `Users` table from `int` to `nvarchar(50)` to store role names as strings instead of numbers.

## Migration Details

### What Changes:
- **Before**: Role stored as integer (1 = Customer, 2 = PharmacyOwner, 3 = Admin)
- **After**: Role stored as string ("Customer", "PharmacyOwner", "Admin")

### Migration File:
`PharmacyFinder.Infrastructure/Migrations/20251128120000_ChangeRoleToString.cs`

## Steps to Apply Migration

### Option 1: Using Entity Framework CLI (Recommended)

1. **Open a terminal/command prompt** in the solution root directory

2. **Navigate to the API project** (or ensure you're in the solution root):
   ```bash
   cd PharmacyFinder.API
   ```

3. **Apply the migration**:
   ```bash
   dotnet ef database update --project ../PharmacyFinder.Infrastructure
   ```

   Or if you're in the solution root:
   ```bash
   dotnet ef database update --project PharmacyFinder.Infrastructure --startup-project PharmacyFinder.API
   ```

### Option 2: Using Package Manager Console (Visual Studio)

1. Open **Package Manager Console** in Visual Studio
2. Set **Default project** to `PharmacyFinder.Infrastructure`
3. Run:
   ```powershell
   Update-Database
   ```

## What the Migration Does

1. **Creates a temporary column** `RoleString` as `nvarchar(50)`
2. **Migrates existing data**:
   - `1` → `"Customer"`
   - `2` → `"PharmacyOwner"`
   - `3` → `"Admin"`
3. **Drops the old `Role` column** (int)
4. **Renames `RoleString` to `Role`**
5. **Makes the column required** with a default value

## Data Safety

- **Existing data is preserved** - All current role values are converted automatically
- **No data loss** - The migration includes data conversion logic
- **Reversible** - The `Down` method can revert the changes if needed

## Verification

After running the migration, verify the changes:

1. Check the database schema:
   ```sql
   SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
   FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'Role'
   ```
   Should show: `nvarchar(50)`

2. Check sample data:
   ```sql
   SELECT Id, Email, Role FROM Users
   ```
   Should show string values like "Customer", "PharmacyOwner", "Admin"

## Rollback (If Needed)

If you need to rollback the migration:

```bash
dotnet ef database update <PreviousMigrationName> --project PharmacyFinder.Infrastructure --startup-project PharmacyFinder.API
```

Or in Package Manager Console:
```powershell
Update-Database -Migration <PreviousMigrationName>
```

## Code Changes Summary

### Entity Changes:
- `User.Role` changed from `UserRole` enum to `string`

### Helper Class:
- `RoleHelper` class created with conversion methods:
  - `RoleToString()` - Converts enum to string
  - `StringToRole()` - Converts string to enum
  - `GetDisplayName()` - Gets formatted display name

### Service Changes:
- `AuthService` updated to convert between enum (DTOs) and string (database)
- `JwtService` works with string role (no changes needed)

## Notes

- The API still accepts and returns enum values in DTOs
- Conversion happens automatically in the service layer
- Frontend receives role names as strings (e.g., "Customer", "PharmacyOwner", "Admin")
- JSON serialization is configured to use string enums









