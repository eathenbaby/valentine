/**
 * Name Validation for V4ULT
 *
 * Purpose: Ensure names are real-sounding and not "foul" or fake
 * (numbers, symbols, repeating chars, etc.)
 *
 * Entropy Checks:
 * - Min length: 2 characters (reject "A")
 * - Max repeating: 2 consecutive identical chars (reject "aaaaaaa")
 * - Allowed: Letters (A-Z, a-z), spaces, apostrophes, hyphens
 * - Regex: Must look like a real name (e.g., "John Doe", "Mary-Jane", "O'Connor")
 */

export interface ValidationResult {
    valid: boolean;
    reason?: string;
    validationScore?: number; // 0-100 trust score
}

const NAME_REGEX = /^[a-zA-Z\s'-]{2,100}$/;
const REPEATING_CHAR_LIMIT = 2; // Max 2 consecutive identical chars allowed
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;

/**
 * Check if a name has too many repeating characters
 * e.g., "aaaa" would fail, "aa" would pass
 */
function checkRepeatingCharacters(name: string): boolean {
    const repeatingPattern = new RegExp(`(.)\\1{${REPEATING_CHAR_LIMIT},}`, 'i');
    return !repeatingPattern.test(name);
}

/**
 * Calculate an entropy/trust score for a name
 * Higher score = more likely to be real
 */
function calculateValidationScore(name: string): number {
    let score = 100;

    // Deduct points for suspicious patterns
    if (name.length < 4) score -= 20; // Very short names get dinged
    if (name.length > 50) score -= 10; // Very long names suspicious
    if (!/\s/.test(name) && name.length < 10) score -= 15; // Single word under 10 chars
    if (/\d/.test(name)) score -= 30; // Numbers always bad
    if (!NAME_REGEX.test(name)) score -= 50; // Doesn't match pattern

    // Bonus for good patterns
    if (/\s/.test(name)) score += 10; // Has space (likely first + last name)
    if (/['-]/.test(name)) score += 5; // Has apostrophe or hyphen (common in names)

    return Math.max(0, Math.min(100, score)); // Clamp to 0-100
}

/**
 * Main validation function
 * Returns { valid, reason, validationScore }
 */
export function validateName(name: string): ValidationResult {
    if (!name || typeof name !== 'string') {
        return { valid: false, reason: 'Name is required' };
    }

    const trimmed = name.trim();

    // Length check
    if (trimmed.length < MIN_NAME_LENGTH) {
        return {
            valid: false,
            reason: `Name must be at least ${MIN_NAME_LENGTH} characters`,
        };
    }

    if (trimmed.length > MAX_NAME_LENGTH) {
        return {
            valid: false,
            reason: `Name must be less than ${MAX_NAME_LENGTH} characters`,
        };
    }

    // Regex check (allowed chars: letters, spaces, apostrophes, hyphens)
    if (!NAME_REGEX.test(trimmed)) {
        return {
            valid: false,
            reason: 'Name contains invalid characters. Use only letters, spaces, apostrophes, and hyphens.',
        };
    }

    // Repeating character check
    if (!checkRepeatingCharacters(trimmed)) {
        return {
            valid: false,
            reason: 'Name contains too many repeating characters',
        };
    }

    // All checks passed
    const validationScore = calculateValidationScore(trimmed);

    return {
        valid: true,
        validationScore,
    };
}

/**
 * Batch validate multiple names (for testing/admin purposes)
 */
export function validateNames(names: string[]): Record<string, ValidationResult> {
    return names.reduce((acc, name) => {
        acc[name] = validateName(name);
        return acc;
    }, {} as Record<string, ValidationResult>);
}

/**
 * Test cases (for reference during development)
 */
export const TEST_CASES = {
    valid: [
        'John Doe',
        'Mary-Jane Watson',
        "O'Connor",
        'Aishwarya Rai',
        'Jean-Pierre',
    ],
    invalid: [
        'A', // Too short
        'aaaaaaa', // Too many repeating
        'John123', // Contains numbers
        'John@Doe', // Invalid char
        'J0hn', // Numbers
    ],
};
