/**
 * Utility functions for generating slugs and abbreviations
 */

/**
 * Generate a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a slug for a player from their name
 * @param firstName - Player's first name
 * @param lastName - Player's last name
 * @returns A slug like "john-doe"
 */
export function generatePlayerSlug(firstName: string, lastName: string): string {
  const fullName = `${firstName} ${lastName}`.trim();
  return generateSlug(fullName);
}

/**
 * Generate a slug for a team from its name
 * @param teamName - Team name
 * @returns A slug like "new-york-yankees"
 */
export function generateTeamSlug(teamName: string): string {
  return generateSlug(teamName);
}

/**
 * Generate a slug for a season from its name and year
 * @param name - Season name (e.g., "Fall")
 * @param year - Season year
 * @returns A slug like "fall-2025"
 */
export function generateSeasonSlug(name: string, year: number): string {
  const slugText = `${name} ${year}`.trim();
  return generateSlug(slugText);
}

/**
 * Generate a team abbreviation from team name
 * Attempts to create a 2-4 character abbreviation intelligently
 * @param teamName - Full team name
 * @returns A suggested abbreviation (2-4 characters)
 */
export function generateTeamAbbreviation(teamName: string): string {
  const trimmed = teamName.trim();
  if (!trimmed) return '';

  // Split by spaces and common separators
  const words = trimmed.split(/[\s-]+/).filter(w => w.length > 0);

  if (words.length === 0) return '';

  // If single word, take first 2-4 characters (prefer 3-4)
  if (words.length === 1) {
    const word = words[0];
    if (word.length <= 4) {
      return word.toUpperCase();
    }
    // For longer words, try to take meaningful parts
    // Take first 3-4 chars, preferring 4 if it looks good
    return word.substring(0, 4).toUpperCase();
  }

  // Multiple words: take first letter of each word
  const abbreviation = words
    .map(word => word[0].toUpperCase())
    .join('');

  // If abbreviation is too long (more than 4 chars), take first 4
  if (abbreviation.length > 4) {
    return abbreviation.substring(0, 4);
  }

  // If abbreviation is too short (1 char), take first 2 letters of first word
  if (abbreviation.length === 1 && words[0].length >= 2) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return abbreviation;
}

/**
 * Check if a slug might be a duplicate by checking against existing slugs
 * If duplicate found, append a number to make it unique
 * @param baseSlug - The base slug to check
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique slug
 */
export function ensureUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}

