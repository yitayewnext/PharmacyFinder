using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using PharmacyFinder.Application.Interfaces;
using PharmacyFinder.Core.DTOs;
using PharmacyFinder.Core.Entities;
using PharmacyFinder.Infrastructure.Data;
using System.Text.RegularExpressions;

namespace PharmacyFinder.Application.Services
{
    public class PrescriptionService : IPrescriptionService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMedicineService _medicineService;

        public PrescriptionService(ApplicationDbContext context, IMedicineService medicineService)
        {
            _context = context;
            _medicineService = medicineService;
        }

        public async Task<PrescriptionDto> UploadPrescriptionAsync(int customerId, IFormFile imageFile, string uploadPath, string? extractedText = null)
        {
            // Validate file
            if (imageFile == null || imageFile.Length == 0)
            {
                throw new ArgumentException("No file uploaded");
            }

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".pdf" };
            var fileExtension = Path.GetExtension(imageFile.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
            {
                throw new ArgumentException("Invalid file type. Only images (jpg, png, gif) and PDF files are allowed.");
            }

            // Create upload directory if it doesn't exist
            if (!Directory.Exists(uploadPath))
            {
                Directory.CreateDirectory(uploadPath);
            }

            // Generate unique file name
            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadPath, fileName);
            var relativeUrl = $"/uploads/prescriptions/{fileName}";

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await imageFile.CopyToAsync(stream);
            }

            // Create prescription record
            var prescription = new Prescription
            {
                CustomerId = customerId,
                ImageUrl = relativeUrl,
                ExtractedText = extractedText,
                Status = string.IsNullOrWhiteSpace(extractedText) ? "Pending" : "Pending",
                UploadedAt = DateTime.UtcNow
            };

            _context.Prescriptions.Add(prescription);
            await _context.SaveChangesAsync();

            return await MapToDtoAsync(prescription);
        }

        public async Task<PrescriptionDto> GetPrescriptionByIdAsync(int prescriptionId, int userId)
        {
            var prescription = await _context.Prescriptions
                .Include(p => p.Customer)
                .Include(p => p.Medicines)
                    .ThenInclude(pm => pm.MatchedMedicine)
                        .ThenInclude(m => m!.Pharmacy)
                .FirstOrDefaultAsync(p => p.Id == prescriptionId);

            if (prescription == null)
            {
                throw new ArgumentException("Prescription not found");
            }

            // Check if user has access (customer or admin)
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new UnauthorizedAccessException("User not found");
            }

            var isCustomer = prescription.CustomerId == userId;
            var isAdmin = user.Role?.Equals("Admin", StringComparison.OrdinalIgnoreCase) == true;

            if (!isCustomer && !isAdmin)
            {
                throw new UnauthorizedAccessException("You do not have access to this prescription");
            }

            // Use MapToDtoAsync to include medicines
            return await MapToDtoAsync(prescription);
        }

        public async Task<List<PrescriptionDto>> GetCustomerPrescriptionsAsync(int customerId)
        {
            var prescriptions = await _context.Prescriptions
                .Where(p => p.CustomerId == customerId)
                .Include(p => p.Medicines)
                    .ThenInclude(pm => pm.MatchedMedicine)
                        .ThenInclude(m => m!.Pharmacy)
                .OrderByDescending(p => p.UploadedAt)
                .ToListAsync();

            var result = new List<PrescriptionDto>();
            foreach (var prescription in prescriptions)
            {
                result.Add(await MapToDtoAsync(prescription));
            }
            return result;
        }

        public async Task<ExtractMedicinesResponse> ExtractMedicinesFromTextAsync(string extractedText)
        {
            if (string.IsNullOrWhiteSpace(extractedText))
            {
                return new ExtractMedicinesResponse
                {
                    ExtractedText = string.Empty,
                    Medicines = new List<ExtractedMedicineDto>()
                };
            }

            // Enhanced medicine extraction using multiple regex patterns
            var medicines = new List<ExtractedMedicineDto>();
            var processedLines = new HashSet<string>(); // Avoid duplicates

            // Split by lines and process
            var lines = extractedText.Split(new[] { '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(l => l.Trim())
                .Where(l => !string.IsNullOrWhiteSpace(l))
                .ToArray();
            
            // Common prescription header keywords to skip
            var skipKeywords = new[] { "PRESCRIPTION", "DOCTOR", "PHYSICIAN", "PATIENT", "DATE", "REFILL", 
                "SIGNATURE", "LICENSE", "ADDRESS", "PHONE", "FAX", "EMAIL", "RX#", "RX NUMBER", "M.E.H.T." };
            
            for (int i = 0; i < lines.Length; i++)
            {
                var trimmedLine = lines[i];
                var nextLine = i + 1 < lines.Length ? lines[i + 1] : string.Empty;
                
                // Skip empty lines or lines that are too short (likely not medicine names)
                if (trimmedLine.Length < 3)
                {
                    continue;
                }
                
                // Skip lines containing header keywords
                if (skipKeywords.Any(keyword => trimmedLine.Contains(keyword, StringComparison.OrdinalIgnoreCase)))
                {
                    continue;
                }

                // Skip lines that start with metadata labels (Dose, Route, Frequency, Duration, etc.)
                if (Regex.IsMatch(trimmedLine, @"^(?:Dose|Route|Frequency|Duration|Quantity|Time|Date|Signature):", RegexOptions.IgnoreCase))
                {
                    continue;
                }

                // Skip lines that are mostly numbers or special characters
                if (Regex.IsMatch(trimmedLine, @"^[\d\s\-/\\]+$"))
                {
                    continue;
                }

                // Pattern 1: Medicine name followed by "Dose:", "Route:", etc. on same line (e.g., "REGULAR PARACETAMOL. Dose: 1g")
                var pattern1 = Regex.Match(trimmedLine, @"^([A-Z][A-Z\s\-]+)(?:\.|,)\s*(?:Dose|Route|Frequency|Duration)", RegexOptions.IgnoreCase);
                
                // Pattern 2: Medicine name ending with period, and next line starts with "Dose:", "Route:", etc. (e.g., "REGULAR PARACETAMOL." followed by "Dose: 1g")
                // Require at least 8 characters to avoid matching single words like "REGULAR" alone
                var pattern2a = Regex.Match(trimmedLine, @"^([A-Z][A-Z\s\-]{7,})\.?\s*$", RegexOptions.IgnoreCase);
                bool nextLineHasDose = !string.IsNullOrWhiteSpace(nextLine) && 
                    Regex.IsMatch(nextLine, @"^(?:Dose|Route|Frequency|Duration):", RegexOptions.IgnoreCase);
                
                // Pattern 2b: Medicine name at start of line, capture until period, colon, or dosage info (e.g., "REGULAR PARACETAMOL.", "Amoxicillin")
                var pattern2b = Regex.Match(trimmedLine, @"^([A-Z][A-Z\s\-]{3,})(?:\.|,|:|\s+Dose|\s+Route|\s+Frequency|\s+Duration)", RegexOptions.IgnoreCase);
                
                // Pattern 3: Medicine name followed by dosage (e.g., "Paracetamol 500mg")
                var pattern3 = Regex.Match(trimmedLine, @"^([A-Z][a-zA-Z\s\-]+?)\s+(\d+\s*(?:mg|ml|g|%|mcg|units?|tablets?|capsules?|tabs?|caps?))", RegexOptions.IgnoreCase);
                
                // Pattern 4: Medicine with quantity (e.g., "Aspirin 100 tablets")
                var pattern4 = Regex.Match(trimmedLine, @"^([A-Z][a-zA-Z\s\-]+?)\s+(\d+)\s*(?:tablets?|capsules?|tabs?|caps?|pills?)", RegexOptions.IgnoreCase);

                string? medicineName = null;
                string? dosage = null;
                string? quantity = null;

                if (pattern1.Success)
                {
                    // Pattern 1: Medicine name before "Dose:", "Route:", etc. on same line (e.g., "REGULAR PARACETAMOL. Dose: 1g")
                    medicineName = pattern1.Groups[1].Value.Trim();
                    // Extract dosage after "Dose:"
                    var doseMatch = Regex.Match(trimmedLine, @"Dose:\s*(\d+\s*(?:mg|ml|g|%|mcg|units?))", RegexOptions.IgnoreCase);
                    if (doseMatch.Success)
                    {
                        dosage = doseMatch.Groups[1].Value.Trim();
                    }
                }
                else if (pattern2a.Success && nextLineHasDose)
                {
                    // Pattern 2a: Medicine name ending with period, next line has "Dose:" (e.g., "REGULAR PARACETAMOL." followed by "Dose: 1g")
                    medicineName = pattern2a.Groups[1].Value.Trim();
                    
                    // Extract dosage from next line
                    var doseMatch = Regex.Match(nextLine, @"Dose:\s*(\d+\s*(?:mg|ml|g|%|mcg|units?))", RegexOptions.IgnoreCase);
                    if (doseMatch.Success)
                    {
                        dosage = doseMatch.Groups[1].Value.Trim();
                    }
                    
                    // Extract frequency from next line if available
                    var frequencyMatch = Regex.Match(nextLine, @"Frequency:\s*([^,]+)", RegexOptions.IgnoreCase);
                    if (frequencyMatch.Success)
                    {
                        // Will be set later in the code
                    }
                    
                    // Skip next line since we've processed it
                    i++;
                }
                else if (pattern2b.Success)
                {
                    // Pattern 2b: Medicine name at start of line (e.g., "REGULAR PARACETAMOL.")
                    medicineName = pattern2b.Groups[1].Value.Trim();
                    
                    // Try to extract dosage from the rest of the line
                    var dosageMatch = Regex.Match(trimmedLine, @"(?:Dose:|\s)(\d+\s*(?:mg|ml|g|%|mcg|units?))", RegexOptions.IgnoreCase);
                    if (dosageMatch.Success)
                    {
                        dosage = dosageMatch.Groups[1].Value.Trim();
                    }
                }
                else if (pattern3.Success)
                {
                    // Pattern 3: Medicine name followed by dosage (e.g., "Paracetamol 500mg")
                    medicineName = pattern3.Groups[1].Value.Trim();
                    dosage = pattern3.Groups[2].Value.Trim();
                }
                else if (pattern4.Success)
                {
                    // Pattern 4: Medicine with quantity (e.g., "Aspirin 100 tablets")
                    medicineName = pattern4.Groups[1].Value.Trim();
                    quantity = pattern4.Groups[2].Value.Trim() + " " + 
                        Regex.Match(trimmedLine, @"(?:tablets?|capsules?|tabs?|caps?|pills?)", RegexOptions.IgnoreCase).Value;
                }

                // If we found a medicine name, extract additional information
                if (!string.IsNullOrWhiteSpace(medicineName) && medicineName.Length >= 3)
                {
                    // Clean up medicine name (remove common suffixes/prefixes)
                    medicineName = Regex.Replace(medicineName, @"\s+", " ").Trim();
                    
                    // Skip if it looks like a common word, not a medicine
                    var commonWords = new[] { "take", "apply", "use", "with", "after", "before", "food", "meal", "water", "frequency", "dose", "route", "duration", "quantity", "time", "date", "signature" };
                    if (commonWords.Any(word => medicineName.Equals(word, StringComparison.OrdinalIgnoreCase)))
                    {
                        continue;
                    }

                    // Avoid duplicates
                    var key = medicineName.ToLowerInvariant();
                    if (processedLines.Contains(key))
                    {
                        continue;
                    }
                    processedLines.Add(key);

                    // Extract frequency from current line or next line if we're processing a multi-line medicine
                    string? frequency = null;
                    var frequencyMatch = Regex.Match(trimmedLine, 
                        @"(?:Frequency:|take|apply|use|given)\s+([^,\n]+)", 
                        RegexOptions.IgnoreCase);
                    if (frequencyMatch.Success)
                    {
                        frequency = frequencyMatch.Groups[1].Value.Trim();
                    }
                    else if (i < lines.Length - 1)
                    {
                        // Try next line for frequency
                        var nextLineFreqMatch = Regex.Match(lines[i + 1], 
                            @"Frequency:\s*([^,\n]+)", 
                            RegexOptions.IgnoreCase);
                        if (nextLineFreqMatch.Success)
                        {
                            frequency = nextLineFreqMatch.Groups[1].Value.Trim();
                        }
                    }
                    
                    // Extract duration (e.g., "for 7 days", "for 2 weeks")
                    var durationMatch = Regex.Match(trimmedLine, 
                        @"(?:for|duration|continue|take)\s+(\d+\s*(?:day|week|month|d|w|m)s?)", 
                        RegexOptions.IgnoreCase);

                    // Extract quantity if not already extracted
                    if (string.IsNullOrWhiteSpace(quantity))
                    {
                        var qtyMatch = Regex.Match(trimmedLine, @"(\d+)\s*(?:tablets?|capsules?|tabs?|caps?|pills?|units?)", RegexOptions.IgnoreCase);
                        if (qtyMatch.Success)
                        {
                            quantity = qtyMatch.Value;
                        }
                    }

                    var medicine = new ExtractedMedicineDto
                    {
                        MedicineName = medicineName,
                        Dosage = dosage,
                        Frequency = frequency,
                        Duration = durationMatch.Success ? durationMatch.Groups[1].Value.Trim() : null,
                        Quantity = quantity
                    };

                    medicines.Add(medicine);
                }
            }

            return new ExtractMedicinesResponse
            {
                ExtractedText = extractedText,
                Medicines = medicines
            };
        }

        public async Task<PrescriptionDto> ProcessPrescriptionAsync(int prescriptionId, int userId)
        {
            var prescription = await _context.Prescriptions
                .Include(p => p.Medicines)
                    .ThenInclude(pm => pm.MatchedMedicine)
                        .ThenInclude(m => m!.Pharmacy)
                .FirstOrDefaultAsync(p => p.Id == prescriptionId);

            if (prescription == null)
            {
                throw new ArgumentException("Prescription not found");
            }

            // Check if user has access
            var user = await _context.Users.FindAsync(userId);
            if (user == null || (prescription.CustomerId != userId && user.Role?.Equals("Admin", StringComparison.OrdinalIgnoreCase) != true))
            {
                throw new UnauthorizedAccessException("You do not have access to process this prescription");
            }

            if (prescription.Status == "Processed")
            {
                return await MapToDtoAsync(prescription);
            }

            // Extract medicines from text (if available)
            if (!string.IsNullOrWhiteSpace(prescription.ExtractedText))
            {
                var extractionResult = await ExtractMedicinesFromTextAsync(prescription.ExtractedText);
                
                // Clear existing prescription medicines
                var existingMedicines = await _context.PrescriptionMedicines
                    .Where(pm => pm.PrescriptionId == prescriptionId)
                    .ToListAsync();
                _context.PrescriptionMedicines.RemoveRange(existingMedicines);

                // Add extracted medicines and try to match with available medicines
                foreach (var extractedMedicine in extractionResult.Medicines)
                {
                    // Search for matching medicines - try multiple search strategies
                    var extractedNameLower = extractedMedicine.MedicineName.ToLower().Trim();
                    var extractedWords = extractedNameLower.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                        .Where(w => w.Length > 2 && !new[] { "the", "and", "or", "for", "with", "regular", "tablet", "capsule", "mg", "ml", "g" }.Contains(w))
                        .OrderByDescending(w => w.Length)
                        .ToList();
                    
                    // Try searching with the full name first
                    var availableMedicines = await _medicineService.SearchMedicinesAsync(extractedMedicine.MedicineName);
                    
                    // If no results, try searching with the most significant word (usually the actual medicine name)
                    if (!availableMedicines.Any() && extractedWords.Any())
                    {
                        availableMedicines = await _medicineService.SearchMedicinesAsync(extractedWords.First());
                    }
                    
                    // If still no results, try all significant words
                    if (!availableMedicines.Any())
                    {
                        foreach (var word in extractedWords.Skip(1))
                        {
                            var wordResults = await _medicineService.SearchMedicinesAsync(word);
                            if (wordResults.Any())
                            {
                                availableMedicines = wordResults;
                                break;
                            }
                        }
                    }
                    
                    // Try to find best match: exact name match first, then partial match (both directions)
                    var matchedMedicine = availableMedicines
                        .FirstOrDefault(m => m.Name.Equals(extractedMedicine.MedicineName, StringComparison.OrdinalIgnoreCase))
                        ?? availableMedicines
                        .FirstOrDefault(m => extractedNameLower.Contains(m.Name.ToLower()) || m.Name.ToLower().Contains(extractedNameLower))
                        ?? availableMedicines
                        .FirstOrDefault(m => extractedWords.Any(word => m.Name.ToLower().Contains(word) || m.Name.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries).Any(mw => mw == word)))
                        ?? availableMedicines
                        .FirstOrDefault(m => m.Name.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries)
                            .Any(mWord => extractedWords.Contains(mWord)))
                        ?? availableMedicines.FirstOrDefault();

                    var prescriptionMedicine = new PrescriptionMedicine
                    {
                        PrescriptionId = prescriptionId,
                        MedicineName = extractedMedicine.MedicineName,
                        Dosage = extractedMedicine.Dosage,
                        Frequency = extractedMedicine.Frequency,
                        Duration = extractedMedicine.Duration,
                        Quantity = extractedMedicine.Quantity,
                        MatchedMedicineId = matchedMedicine?.Id,
                        IsAvailable = matchedMedicine != null,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.PrescriptionMedicines.Add(prescriptionMedicine);
                }
            }

            prescription.Status = "Processed";
            prescription.ProcessedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();

            return await GetPrescriptionByIdAsync(prescriptionId, userId);
        }

        private async Task<PrescriptionDto> MapToDtoAsync(Prescription prescription)
        {
            // Check if medicines are already loaded (via Include)
            var medicines = prescription.Medicines?.Any() == true
                ? prescription.Medicines
                : await _context.PrescriptionMedicines
                    .Include(pm => pm.MatchedMedicine)
                        .ThenInclude(m => m!.Pharmacy)
                    .Where(pm => pm.PrescriptionId == prescription.Id)
                    .ToListAsync();

            // Map medicines and ensure matched medicine is loaded
            var medicineDtos = new List<PrescriptionMedicineDto>();
            foreach (var pm in medicines)
            {
                // If matchedMedicineId exists but matchedMedicine is not loaded, load it with pharmacy
                if (pm.MatchedMedicineId.HasValue && pm.MatchedMedicine == null)
                {
                    await _context.Entry(pm)
                        .Reference(p => p.MatchedMedicine)
                        .LoadAsync();
                    if (pm.MatchedMedicine != null)
                    {
                        await _context.Entry(pm.MatchedMedicine)
                            .Reference(m => m.Pharmacy)
                            .LoadAsync();
                    }
                }
                medicineDtos.Add(MapMedicineToDto(pm));
            }

            return new PrescriptionDto
            {
                Id = prescription.Id,
                CustomerId = prescription.CustomerId,
                ImageUrl = prescription.ImageUrl,
                ExtractedText = prescription.ExtractedText,
                Status = prescription.Status,
                UploadedAt = prescription.UploadedAt,
                ProcessedAt = prescription.ProcessedAt,
                Medicines = medicineDtos
            };
        }

        private PrescriptionMedicineDto MapMedicineToDto(PrescriptionMedicine pm)
        {
            return new PrescriptionMedicineDto
            {
                Id = pm.Id,
                PrescriptionId = pm.PrescriptionId,
                MedicineName = pm.MedicineName,
                Dosage = pm.Dosage,
                Frequency = pm.Frequency,
                Duration = pm.Duration,
                Quantity = pm.Quantity,
                MatchedMedicineId = pm.MatchedMedicineId,
                MatchedMedicine = pm.MatchedMedicine != null ? new MedicineDto
                {
                    Id = pm.MatchedMedicine.Id,
                    Name = pm.MatchedMedicine.Name,
                    Description = pm.MatchedMedicine.Description,
                    Manufacturer = pm.MatchedMedicine.Manufacturer,
                    Price = pm.MatchedMedicine.Price,
                    Quantity = pm.MatchedMedicine.Quantity,
                    ExpiryDate = pm.MatchedMedicine.ExpiryDate,
                    IsPrescriptionRequired = pm.MatchedMedicine.IsPrescriptionRequired,
                    Category = pm.MatchedMedicine.Category,
                    PharmacyId = pm.MatchedMedicine.PharmacyId,
                    CreatedAt = pm.MatchedMedicine.CreatedAt,
                    UpdatedAt = pm.MatchedMedicine.UpdatedAt,
                    // Add pharmacy information if available
                    PharmacyName = pm.MatchedMedicine.Pharmacy?.Name ?? string.Empty,
                    PharmacyAddress = pm.MatchedMedicine.Pharmacy != null 
                        ? $"{pm.MatchedMedicine.Pharmacy.Address}, {pm.MatchedMedicine.Pharmacy.City}, {pm.MatchedMedicine.Pharmacy.State}"
                        : string.Empty,
                    PharmacyPhoneNumber = pm.MatchedMedicine.Pharmacy?.PhoneNumber ?? string.Empty
                } : null,
                IsAvailable = pm.IsAvailable,
                CreatedAt = pm.CreatedAt
            };
        }

        private PrescriptionDto MapToDto(Prescription prescription)
        {
            return new PrescriptionDto
            {
                Id = prescription.Id,
                CustomerId = prescription.CustomerId,
                ImageUrl = prescription.ImageUrl,
                ExtractedText = prescription.ExtractedText,
                Status = prescription.Status,
                UploadedAt = prescription.UploadedAt,
                ProcessedAt = prescription.ProcessedAt
            };
        }
    }
}

