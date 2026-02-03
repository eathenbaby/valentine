/**
 * Profanity & Toxicity Filter for V4ULT
 *
 * Purpose: Flag or auto-block confessions that are toxic, contain slurs,
 * or are generally "foul" before they hit the admin's eyes.
 *
 * Uses Google Perspective API (perspectiveapi.com)
 * Requires PERSPECTIVE_API_KEY environment variable
 */

export interface ToxicityResult {
    toxic: boolean; // true if exceeds threshold
    toxicityScore: number; // 0.0-1.0
    attributes: {
        TOXICITY: number;
        PROFANITY?: number;
        IDENTITY_ATTACK?: number;
        INSULT?: number;
        THREAT?: number;
    };
}

const PERSPECTIVE_API_KEY = process.env.PERSPECTIVE_API_KEY;
const PERSPECTIVE_API_URL = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';
const TOXICITY_THRESHOLD = 0.7; // Flag if score > 70%

/**
 * Check confession text for toxicity using Google Perspective API
 */
export async function checkToxicity(text: string): Promise<ToxicityResult> {
    // If no API key, return a safe default (not flagged)
    if (!PERSPECTIVE_API_KEY) {
        console.warn('[profanity] WARNING: PERSPECTIVE_API_KEY not set. Toxicity checks disabled.');
        return {
            toxic: false,
            toxicityScore: 0,
            attributes: { TOXICITY: 0 },
        };
    }

    try {
        const requestBody = {
            comment: { text },
            requestedAttributes: {
                TOXICITY: {},
                PROFANITY: {},
                IDENTITY_ATTACK: {},
                INSULT: {},
                THREAT: {},
            },
            languages: ['en'],
        };

        const response = await fetch(`${PERSPECTIVE_API_URL}?key=${PERSPECTIVE_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            console.error(`[profanity] Perspective API error: ${response.status} ${response.statusText}`);
            // Fail open: if API fails, don't flag the confession
            return {
                toxic: false,
                toxicityScore: 0,
                attributes: { TOXICITY: 0 },
            };
        }

        const data = await response.json();

        // Extract scores from response
        const toxicityScore = data.attributeScores?.TOXICITY?.summaryScore?.value ?? 0;
        const profanityScore = data.attributeScores?.PROFANITY?.summaryScore?.value ?? 0;
        const identityAttackScore = data.attributeScores?.IDENTITY_ATTACK?.summaryScore?.value ?? 0;
        const insultScore = data.attributeScores?.INSULT?.summaryScore?.value ?? 0;
        const threatScore = data.attributeScores?.THREAT?.summaryScore?.value ?? 0;

        // Consider it toxic if any attribute is above threshold
        const maxScore = Math.max(toxicityScore, profanityScore, identityAttackScore, insultScore, threatScore);
        const toxic = maxScore > TOXICITY_THRESHOLD;

        return {
            toxic,
            toxicityScore: toxicityScore,
            attributes: {
                TOXICITY: toxicityScore,
                PROFANITY: profanityScore,
                IDENTITY_ATTACK: identityAttackScore,
                INSULT: insultScore,
                THREAT: threatScore,
            },
        };
    } catch (error) {
        console.error('[profanity] Error checking toxicity:', error);
        // Fail open: if API fails, don't flag
        return {
            toxic: false,
            toxicityScore: 0,
            attributes: { TOXICITY: 0 },
        };
    }
}

/**
 * Batch check multiple confessions
 */
export async function checkToxicityBatch(texts: string[]): Promise<ToxicityResult[]> {
    return Promise.all(texts.map(text => checkToxicity(text)));
}

/**
 * Test: Check a confession and log the result
 */
export async function testToxicityCheck(text: string): Promise<void> {
    const result = await checkToxicity(text);
    console.log(`[profanity] Test check for: "${text}"`);
    console.log(`[profanity] Toxic: ${result.toxic}, Score: ${result.toxicityScore.toFixed(3)}`);
    console.log(`[profanity] Attributes:`, result.attributes);
}
