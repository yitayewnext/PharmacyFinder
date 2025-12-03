/**
 * Utility functions for intelligent medicine search and matching
 */

export class MedicineSearchUtil {
  /**
   * Search for medicines using fuzzy matching
   */
  static fuzzySearch(medicines: any[], query: string): any[] {
    if (!query || !query.trim()) {
      return medicines;
    }

    const searchQuery = query.toLowerCase().trim();
    const searchTerms = searchQuery.split(/\s+/);

    return medicines
      .map(medicine => ({
        medicine,
        score: this.calculateSimilarityScore(medicine, searchQuery, searchTerms)
      }))
      .filter(item => item.score > 0.3) // Minimum similarity threshold
      .sort((a, b) => b.score - a.score)
      .map(item => item.medicine);
  }

  /**
   * Calculate similarity score between medicine and search query
   */
  private static calculateSimilarityScore(medicine: any, query: string, searchTerms: string[]): number {
    const name = (medicine.name || '').toLowerCase();
    const manufacturer = (medicine.manufacturer || '').toLowerCase();
    const category = (medicine.category || '').toLowerCase();

    let score = 0;

    // Exact match gets highest score
    if (name === query || name.includes(query) || query.includes(name)) {
      score += 10;
    }

    // Check each search term
    for (const term of searchTerms) {
      if (name.includes(term)) {
        score += 5;
      }
      if (manufacturer.includes(term)) {
        score += 2;
      }
      if (category.includes(term)) {
        score += 1;
      }
    }

    // Levenshtein distance similarity for fuzzy matching
    const nameSimilarity = this.levenshteinSimilarity(name, query);
    score += nameSimilarity * 3;

    return score;
  }

  /**
   * Calculate Levenshtein similarity (0-1)
   */
  private static levenshteinSimilarity(str1: string, str2: string): number {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;
    
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - (distance / maxLen);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = [];

    for (let i = 0; i <= m; i++) {
      dp[i] = [i];
    }

    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,      // deletion
            dp[i][j - 1] + 1,      // insertion
            dp[i - 1][j - 1] + 1   // substitution
          );
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Normalize medicine name for better matching
   */
  static normalizeMedicineName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ')  // Remove special characters
      .replace(/\s+/g, ' ')       // Normalize whitespace
      .trim();
  }

  /**
   * Extract medicine name variants (common name, brand name, etc.)
   */
  static extractMedicineVariants(name: string): string[] {
    const variants: string[] = [];
    const normalized = this.normalizeMedicineName(name);
    
    variants.push(normalized);
    
    // Extract potential brand names (words in quotes or parentheses)
    const quotedMatch = name.match(/"([^"]+)"/);
    if (quotedMatch) {
      variants.push(this.normalizeMedicineName(quotedMatch[1]));
    }

    const parenMatch = name.match(/\(([^)]+)\)/);
    if (parenMatch) {
      variants.push(this.normalizeMedicineName(parenMatch[1]));
    }

    // Extract words separately
    const words = normalized.split(/\s+/).filter(w => w.length > 2);
    if (words.length > 1) {
      variants.push(...words);
    }

    return [...new Set(variants)]; // Remove duplicates
  }
}

