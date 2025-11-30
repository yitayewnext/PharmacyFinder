using Isopoh.Cryptography.Argon2;
using Isopoh.Cryptography.SecureArray;
using PharmacyFinder.Core.Interfaces;
using System.Security.Cryptography;
using System.Text;

namespace PharmacyFinder.Infrastructure.Security
{
    public class Argon2PasswordHasher : IPasswordHasher
    {
        public string Hash(string password)
        {
            var salt = GenerateSalt();

            var config = new Argon2Config
            {
                Type = Argon2Type.DataIndependentAddressing, // Argon2id equivalent
                TimeCost = 4,
                MemoryCost = 65536,
                Lanes = 8,
                Threads = 8,
                Salt = salt,
                Password = Encoding.UTF8.GetBytes(password)
            };

            using var argon2 = new Argon2(config);
            using var hashResult = argon2.Hash();
            
            // Access the buffer directly from the SecureArray
            var hashBytes = new byte[hashResult.Buffer.Length];
            hashResult.Buffer.CopyTo(hashBytes, 0);

            // store as base64(salt):base64(hash)
            return Convert.ToBase64String(salt) + ":" + Convert.ToBase64String(hashBytes);
        }

        public bool Verify(string password, string passwordHash)
        {
            try
            {
                var parts = passwordHash.Split(':');
                var salt = Convert.FromBase64String(parts[0]);
                var storedHash = Convert.FromBase64String(parts[1]);

                var config = new Argon2Config
                {
                    Type = Argon2Type.DataIndependentAddressing,
                    TimeCost = 4,
                    MemoryCost = 65536,
                    Lanes = 8,
                    Threads = 8,
                    Salt = salt,
                    Password = Encoding.UTF8.GetBytes(password)
                };

                using var argon2 = new Argon2(config);
                using var hashResult = argon2.Hash();
                
                // Access the buffer directly from the SecureArray
                var computedHash = new byte[hashResult.Buffer.Length];
                hashResult.Buffer.CopyTo(computedHash, 0);

                return storedHash.SequenceEqual(computedHash);
            }
            catch
            {
                return false;
            }
        }

        private byte[] GenerateSalt()
        {
            var salt = new byte[16];
            RandomNumberGenerator.Fill(salt); // modern RNG
            return salt;
        }
    }
}