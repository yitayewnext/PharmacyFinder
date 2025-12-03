using Microsoft.EntityFrameworkCore;
using PharmacyFinder.Core.Entities;

namespace PharmacyFinder.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Pharmacy> Pharmacies => Set<Pharmacy>();
        public DbSet<Medicine> Medicines => Set<Medicine>();
        public DbSet<Prescription> Prescriptions => Set<Prescription>();
        public DbSet<PrescriptionMedicine> PrescriptionMedicines => Set<PrescriptionMedicine>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Email).IsUnique();
                entity.Property(u => u.Email).IsRequired().HasMaxLength(255);
                entity.Property(u => u.FirstName).IsRequired().HasMaxLength(100);
                entity.Property(u => u.LastName).IsRequired().HasMaxLength(100);
                entity.Property(u => u.PasswordHash).IsRequired();
                entity.Property(u => u.Role).IsRequired().HasMaxLength(50); // Store as string
                entity.Property(u => u.ApprovalStatus).IsRequired().HasMaxLength(50).HasDefaultValue("Pending"); // Store as string
                entity.Property(u => u.LicenseNumber).HasMaxLength(100); // Health ministry license for pharmacy owners
                entity.HasIndex(u => u.LicenseNumber).IsUnique().HasFilter("[LicenseNumber] IS NOT NULL"); // Unique index for license numbers
            });

            modelBuilder.Entity<Pharmacy>(entity =>
            {
                entity.HasIndex(p => p.LicenseNumber); // Removed IsUnique() to allow multiple pharmacies per owner with same license
                entity.Property(p => p.Name).IsRequired().HasMaxLength(200);
                entity.Property(p => p.Address).IsRequired().HasMaxLength(500);
                entity.Property(p => p.City).IsRequired().HasMaxLength(100);
                entity.Property(p => p.State).IsRequired().HasMaxLength(50);
                entity.Property(p => p.ZipCode).IsRequired().HasMaxLength(20);
                entity.Property(p => p.PhoneNumber).IsRequired().HasMaxLength(20);
                entity.Property(p => p.Email).IsRequired().HasMaxLength(255);
                entity.Property(p => p.LicenseNumber).IsRequired().HasMaxLength(100);
                entity.Property(p => p.OperatingHours).HasColumnType("nvarchar(max)");
                entity.Property(p => p.ApprovalStatus).IsRequired().HasMaxLength(50).HasDefaultValue("Pending");
                
                // Foreign key relationship
                entity.HasOne(p => p.Owner)
                    .WithMany()
                    .HasForeignKey(p => p.OwnerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Medicine>(entity =>
            {
                entity.Property(m => m.Name).IsRequired().HasMaxLength(100);
                entity.Property(m => m.Description).HasMaxLength(500);
                entity.Property(m => m.Manufacturer).HasMaxLength(100);
                entity.Property(m => m.Category).HasMaxLength(50);
                entity.Property(m => m.Price).HasColumnType("decimal(18,2)");

                entity.HasOne(m => m.Pharmacy)
                    .WithMany()
                    .HasForeignKey(m => m.PharmacyId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Prescription>(entity =>
            {
                entity.Property(p => p.ImageUrl).IsRequired().HasMaxLength(500);
                entity.Property(p => p.Status).IsRequired().HasMaxLength(50).HasDefaultValue("Pending");

                entity.HasOne(p => p.Customer)
                    .WithMany()
                    .HasForeignKey(p => p.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<PrescriptionMedicine>(entity =>
            {
                entity.Property(pm => pm.MedicineName).IsRequired().HasMaxLength(200);
                entity.Property(pm => pm.Dosage).HasMaxLength(100);
                entity.Property(pm => pm.Frequency).HasMaxLength(100);
                entity.Property(pm => pm.Duration).HasMaxLength(100);
                entity.Property(pm => pm.Quantity).HasMaxLength(50);

                entity.HasOne(pm => pm.Prescription)
                    .WithMany(p => p.Medicines)
                    .HasForeignKey(pm => pm.PrescriptionId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(pm => pm.MatchedMedicine)
                    .WithMany()
                    .HasForeignKey(pm => pm.MatchedMedicineId)
                    .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}