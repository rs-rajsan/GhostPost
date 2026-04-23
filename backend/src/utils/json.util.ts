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
 * Includes "fuzzy" parsing logic and a "greedy extractor" fallback.
 */
export function extractAndParseJson<T>(text: string): T {
    const cleaned = extractJsonString(text);
    
    // Attempt 1: Standard JSON Parse
    try {
        return JSON.parse(cleaned) as T;
    } catch (error: any) {
        // Attempt 2: Escape raw newlines (common AI mistake)
        try {
            const fixed = cleaned.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
            return JSON.parse(fixed) as T;
        } catch (secondError) {
            // Attempt 3: "Greedy Extractor" - manually find the content via regex
            // This is the "unbreakable" fallback
            logger.warn('JSON parsing failed. Switching to Greedy Field Extraction.');
            
            const result: any = {};
            
            // Extract enhancedPost (The most important field)
            // We look for the "enhancedPost" key and take everything until the end or the next structural key
            const postMatch = cleaned.match(/"enhancedPost"\s*:\s*"(.*)"/s);
            if (postMatch) {
                // Clean up the greedy match by removing the trailing JSON structural parts if present
                let post = postMatch[1];
                const lastQuote = post.lastIndexOf('"');
                if (lastQuote !== -1) {
                    post = post.substring(0, lastQuote);
                }
                result.enhancedPost = post.replace(/\\n/g, '\n').replace(/\\"/g, '"');
            }

            // Extract Title
            const titleMatch = cleaned.match(/"title"\s*:\s*"(.*?)"/);
            if (titleMatch) result.title = titleMatch[1];

            // Extract Hashtags (Greedy array match)
            const hashtagsMatch = cleaned.match(/"hashtags"\s*:\s*\[(.*?)\]/);
            if (hashtagsMatch) {
                result.hashtags = hashtagsMatch[1]
                    .split(',')
                    .map(h => h.trim().replace(/"/g, ''))
                    .filter(h => h.length > 0);
            }

            // Extract Confidence Score
            const confidenceMatch = cleaned.match(/"confidenceScore"\s*:\s*(\d+)/);
            if (confidenceMatch) result.confidenceScore = parseInt(confidenceMatch[1], 10);

            // Fallback defaults for missing non-critical fields
            result.hookScore = result.hookScore || 8;
            result.confidenceScore = result.confidenceScore || 75;
            result.hookTip = result.hookTip || "Optimize your hook for better engagement.";
            result.hashtags = result.hashtags || ["#AgentAISchool"];

            if (result.enhancedPost) {
                logger.info('Successfully recovered content via Greedy Extraction');
                return result as T;
            }

            // Attempt 4: Last Resort - If there's NO structure, treat the entire response as the article
            logger.warn('Greedy extraction failed. Treating raw response as content.');
            const rawContent: any = {
                title: "Generated Content",
                enhancedPost: cleaned || text,
                hookScore: 7,
                confidenceScore: 60,
                hookTip: "Content was recovered from raw output. Structure may vary.",
                hashtags: ["#AgentAISchool"]
            };
            
            return rawContent as T;
        }
    }
}
