import logger from './logger';

/**
 * Robustly extracts the JSON substring from a string.
 */
export function extractJsonString(text: string): string {
    // Strip common markdown markers
    let cleaned = text.replace(/```json\n?|\n?```/g, '').trim();

    // Find the first structural character ({ or [) and the last structural character (} or ])
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');

    const start = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;
    const end = (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) ? lastBrace : lastBracket;

    if (start !== -1 && end !== -1) {
        return cleaned.substring(start, end + 1);
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
/**
 * Parses structured text format into a JSON object.
 * Format: [FIELD]: value
 */
export function parseStructuredText(text: string): any {
    // Defensive Check: If the LLM somehow returns JSON despite instructions, use it directly.
    try {
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed === 'object' && (parsed.enhancedPost || parsed.title)) {
            return {
                title: parsed.title || '',
                hook: parsed.hook || '',
                enhancedPost: parsed.enhancedPost || parsed.content || '',
                hookScore: parsed.hookScore || 9,
                hookTip: parsed.hookTip || '',
                hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
                visualSuggestion: parsed.visualSuggestion || ''
            };
        }
    } catch (e) {
        // Not JSON, proceed to parse as structured text
    }

    const result: any = {
        title: '',
        hook: '',
        enhancedPost: '',
        hookScore: 9,
        hookTip: '',
        hashtags: [],
        visualSuggestion: ''
    };

    const lines = text.split('\n');
    let currentField = '';

    for (const line of lines) {
        if (line.startsWith('[TITLE]:')) {
            result.title = line.replace('[TITLE]:', '').trim();
            currentField = 'title';
        } else if (line.startsWith('[HOOK]:')) {
            result.hook = line.replace('[HOOK]:', '').trim();
            currentField = 'hook';
        } else if (line.startsWith('[CONTENT]:')) {
            currentField = 'enhancedPost';
            const val = line.replace('[CONTENT]:', '').trim();
            if (val) result.enhancedPost += val + '\n';
        } else if (line.startsWith('[HASHTAGS]:')) {
            result.hashtags = line.replace('[HASHTAGS]:', '')
                .split(',')
                .map(h => h.trim())
                .filter(h => h.length > 0);
            currentField = 'hashtags';
        } else if (line.startsWith('[VISUAL]:')) {
            result.visualSuggestion = line.replace('[VISUAL]:', '').trim();
            currentField = 'visualSuggestion';
        } else if (line.startsWith('[TIP]:')) {
            result.hookTip = line.replace('[TIP]:', '').trim();
            currentField = 'hookTip';
        } else if (currentField === 'enhancedPost') {
            result.enhancedPost += line + '\n';
        } else if (currentField === 'hook' && line.trim()) {
            result.hook += ' ' + line.trim();
        }
    }

    result.enhancedPost = result.enhancedPost.trim();
    
    // Clean up enhancedPost if it contains meta labels or artifacts
    result.enhancedPost = result.enhancedPost
        .replace(/\[TITLE\]:.*?\n/gi, '')
        .replace(/\[HOOK\]:.*?\n/gi, '')
        .replace(/\[HASHTAGS\]:.*?\n/gi, '')
        .replace(/\[VISUAL\]:.*?\n/gi, '')
        .replace(/\[TIP\]:.*?\n/gi, '')
        .replace(/\[\d+\]/g, '') // Remove citations like [1], [2]
        .replace(/\(Word count.*?\)/gi, '') // Remove word count artifacts
        .replace(/\n{3,}/g, '\n\n') // Normalize spacing
        .trim();

    return result;
}
