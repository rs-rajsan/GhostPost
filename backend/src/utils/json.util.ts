import logger from './logger';

/**
 * Robustly extracts the JSON substring from a string.
 */
export function extractJsonString(text: string): string {
    // Strip common markdown markers
    let cleaned = text.replace(/```json\n?|\n?```/g, '').trim();

    // Find the first '{' and last '}'
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
        return cleaned.substring(firstBrace, lastBrace + 1);
    }

    return cleaned;
}

/**
 * Robustly extracts and parses JSON from a string that might contain other text.
 */
export function extractAndParseJson<T>(text: string): T {
    try {
        const cleaned = extractJsonString(text);
        return JSON.parse(cleaned) as T;
    } catch (error: any) {
        logger.error({ text, error: error.message }, 'Failed to robustly parse JSON from AI response');
        throw error;
    }
}
