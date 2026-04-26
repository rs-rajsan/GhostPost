import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root directory
dotenv.config({ path: path.join(__dirname, '../../../.env') });
// Also load local .env if it exists for fallback/backwards compatibility
dotenv.config();

import { MODELS } from './models.config';

/**
 * Interface for the application configuration (Provider-agnostic)
 */
export interface Config {
    env: string;
    port: number;
    logLevel: string;
    databaseUrl: string;
    security: {
        apiKey: string;
        model: string;
        isMockMode: boolean;
    };
    research: {
        apiKey: string;
        model: string;
        url: string;
    };
    drafting: {
        apiKey: string;
        model: string;
        url: string; // Generic URL property
        isMockMode: boolean;
    };
    validation: {
        apiKey: string;
        model: string;
        isMockMode: boolean;
    };
    refinement: {
        apiKey: string;
        model: string;
        isMockMode: boolean;
    };
    rateLimit: {
        windowMs: number;
        max: number;
    };
    extraction: {
        httpTimeout: number;
        userAgent: string;
    };
    prompts: {
        article: (options: PromptOptions) => string;
        post: (options: PromptOptions) => string;
        hook: (tone: string, hookTip: string, content: string) => string;
    };
    helicone: {
        enabled: boolean;
        apiKey: string;
        baseUrl: string;
    };
    guard: {
        enabled: boolean;
        redactPii: boolean;
        filterToxicity: boolean;
        promptProtection: boolean;
    };
    clickhouse: {
        url: string;
        timeout: number;
    };
}

export interface PromptOptions {
    tone: string;
    text: string;
    targetPages?: number;
    researchData?: string;
    isTopic?: boolean;
}

const env = process.env.NODE_ENV || 'development';

/**
 * Resolves an API key string. If the string matches an existing environment variable name,
 * it returns the value of that environment variable. Otherwise, it returns the string itself.
 */
const resolveKey = (key: string | undefined): string => {
    if (!key) return '';
    if (process.env[key]) return process.env[key] as string;
    return key;
};

const securityApiKey = resolveKey(process.env.SECURITY_API_KEY);
const draftingApiKey = resolveKey(process.env.DRAFTING_API_KEY);
const validationApiKey = resolveKey(process.env.VALIDATION_API_KEY);
const refinementApiKey = resolveKey(process.env.REFINEMENT_API_KEY);

const config: Config = {
    env,
    port: parseInt(process.env.PORT || '5000', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
    databaseUrl: process.env.DATABASE_URL || '',
    security: {
        apiKey: securityApiKey,
        model: MODELS.SECURITY.DEFAULT,
        isMockMode: !securityApiKey || securityApiKey.includes('your_'),
    },
    research: {
        apiKey: resolveKey(process.env.PERPLEXITY_API_KEY),
        model: 'sonar',
        url: 'https://api.perplexity.ai/chat/completions',
    },
    drafting: {
        apiKey: draftingApiKey,
        model: MODELS.DRAFTING.DEFAULT,
        url: process.env.DRAFTING_URL || '',
        isMockMode: !draftingApiKey || draftingApiKey.includes('your_'),
    },
    validation: {
        apiKey: validationApiKey,
        model: MODELS.VALIDATION.DEFAULT,
        isMockMode: !validationApiKey || validationApiKey.includes('your_'),
    },
    refinement: {
        apiKey: refinementApiKey,
        model: MODELS.REFINEMENT?.DEFAULT || 'gpt-4o',
        isMockMode: !refinementApiKey || refinementApiKey.includes('your_'),
    },
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
    },
    extraction: {
        httpTimeout: 5000,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
    helicone: {
        enabled: process.env.HELICONE_ENABLED === 'true',
        apiKey: process.env.HELICONE_API_KEY || 'sk-helicone-dummy',
        baseUrl: process.env.HELICONE_URL || 'http://localhost:8787/v1',
    },
    guard: {
        enabled: process.env.GUARD_ENABLED !== 'false',
        redactPii: true,
        filterToxicity: true,
        promptProtection: true,
    },
    clickhouse: {
        url: process.env.CLICKHOUSE_URL || 'http://clickhouse:8123',
        timeout: 5000,
    },
    prompts: {
        article: (options: PromptOptions) => {
            const { tone, text, targetPages = 0.5, researchData, isTopic } = options;
            const wordCount = Math.round(targetPages * 1600);
            return `
You are a world-class investigative journalist and technical writer.
Your mission: Write a comprehensive, high-authority article based on the provided input and research.

TONE: ${tone}
TARGET LENGTH: Exactly ${targetPages} pages.
STRICT WORD LIMIT: Your response MUST be approximately ${wordCount} words. DO NOT exceed ${wordCount + 100} words.

${tone.toLowerCase() === 'conversational' ? `
STYLE GUIDE (CONVERSATIONAL - TWO FRIENDS CHATTING):
- STYLE: Write like two friends or peers talking over coffee. USE CONTRACTIONS (don't, it's, you're).
- VIBE: Casual, informal, and relaxed. Avoid "corporate speak" or "interview mode".
- STRUCTURE: A natural back-and-forth flow. Address the reader as a peer.` : ''}

${tone.toLowerCase() === 'inspirational' ? `
STYLE GUIDE (INSPIRATIONAL - VISIONARY & UPLIFTING):
- STYLE: Future-oriented, motivational, and high-energy. Focus on "what's possible".
- PHRASING: Use powerful verbs (Imagine, Transform, Ignite) and rhetorical questions about the future.
- VIBE: Empowering and hopeful. End with a strong "call to greatness".` : ''}

${tone.toLowerCase() === 'provocative' ? `
STYLE GUIDE (PROVOCATIVE - PATTERN INTERRUPT):
- STYLE: Contrarian and assertive. Challenge the status quo or common industry "best practices".
- PHRASING: Start with a bold, controversial claim. Use strong, unapologetic language.
- VIBE: Intellectual friction. Force the reader to stop and re-think their current position.` : ''}

${tone.toLowerCase() === 'academic' ? `
STYLE GUIDE (ACADEMIC - FORMAL & ANALYTICAL):
- STYLE: Objective, third-person perspective. Use formal vocabulary and complex sentence structures.
- PHRASING: Focus on evidence, methodology, and logical derivation. AVOID CONTRACTIONS.
- VIBE: High-authority, rigorous, and completely objective.` : ''}

${tone.toLowerCase() === 'story' ? `
STYLE GUIDE (STORY - JOURNALISTIC NARRATIVE):
- STYLE: Narrative-driven. Use a classic "Lead" followed by a character or situation-based arc.
- PHRASING: Use sensory details and quotes (real or illustrative) to bring the "story" to life.
- VIBE: Captivating and human. Like a front-page feature story in a major publication.` : ''}

${tone.startsWith('custom:') ? `
STYLE GUIDE (CUSTOM PERSONA - ADOPT THIS CHARACTER):
- YOU ARE NOW: ${tone.replace('custom:', '')}
- INSTRUCTION: You must adopt this persona's specific vocabulary, biases, and perspective throughout the entire article.` : ''}

${isTopic ? 'CORE TOPIC/THEME' : 'INPUT MATERIAL'}:
"""
${text}
"""

${researchData ? `RESEARCH DATA & STATISTICS:
"""
${researchData}
"""` : ''}

You are an elite, highly-efficient Content Generation Engine. 
Your ONLY task is to return a valid JSON object containing a deep-dive article based on the provided data.

OUTPUT FORMAT (MANDATORY):
Return ONLY a valid JSON object with this structure:
{
  "title": "A compelling, catchy title for the article",
  "hook": "The actual attention-grabbing hook text (1-3 sentences)",
  "enhancedPost": "The full article text starting with the TITLE in ALL CAPS",
  "hookScore": 9,
  "hookTip": "Optimization advice or strategy used for this hook",
  "hashtags": ["#AgentAISchool", "#tag1", "#tag2"],
  "visualSuggestion": "Image description"
}

GUIDELINES:
1. FORMATTING: Use PLAIN TEXT for the "enhancedPost" value. NO Markdown, NO bolding (**), NO special headers (##). Use simple capitalized titles and blank lines for structure.
2. CITATIONS: List all source URLs in a "SOURCES & CITATIONS" section at the very bottom of the article text.
3. CONTENT: Provide detailed explanations and at least 5-7 relevant facts or statistics.
4. NO META-COMMENTARY: DO NOT include word counts or section notes.
`;
        },
        post: (options: PromptOptions) => {
            const { tone, text, researchData, isTopic } = options;
            return `
You are an elite Social Media Copywriter. 
Return ONLY a JSON object.

OUTPUT FORMAT (MANDATORY):
{
  "title": "A short, punchy title",
  "hook": "The actual attention-grabbing hook text (1-2 sentences)",
  "enhancedPost": "The post text starting with the TITLE",
  "hookScore": 9,
  "hookTip": "Optimization advice or strategy used for this hook",
  "hashtags": ["#AgentAISchool", "#tag1"],
  "visualSuggestion": "..."
}

TONE: ${tone}
STRICT RULE: Your response must be 300 words or less. DO NOT exceed this limit.

${tone.toLowerCase() === 'conversational' ? `
STYLE GUIDE (CONVERSATIONAL - TWO FRIENDS CHATTING):
- STYLE: Write like two friends talking. USE CONTRACTIONS. Casual and relaxed.` : ''}

${tone.toLowerCase() === 'inspirational' ? `
STYLE GUIDE (INSPIRATIONAL - VISIONARY & UPLIFTING):
- STYLE: Motivational and high-energy. Focus on "what's possible".` : ''}

${tone.toLowerCase() === 'provocative' ? `
STYLE GUIDE (PROVOCATIVE - PATTERN INTERRUPT):
- STYLE: Contrarian and assertive. Challenge the status quo.` : ''}

${tone.toLowerCase() === 'academic' ? `
STYLE GUIDE (ACADEMIC - FORMAL & ANALYTICAL):
- STYLE: Objective and formal. Use evidence and logic. AVOID CONTRACTIONS.` : ''}

${tone.toLowerCase() === 'story' ? `
STYLE GUIDE (STORY - JOURNALISTIC NARRATIVE):
- STYLE: Narrative-driven. Use a compelling hook followed by a short arc.` : ''}

${tone.startsWith('custom:') ? `
STYLE GUIDE (CUSTOM PERSONA - ADOPT THIS CHARACTER):
- YOU ARE NOW: ${tone.replace('custom:', '')}
- INSTRUCTION: Adopt this persona's specific voice and perspective for this post.` : ''}

${isTopic ? 'CORE TOPIC/THEME' : 'INPUT MATERIAL'}:
"""
${text}
"""

${researchData ? `RESEARCH DATA & STATISTICS to incorporate:
"""
${researchData}
"""` : ''}

GUIDELINES:
1. FORMATTING: PLAIN TEXT only. No markdown.
2. CITATIONS: List source links only at the very bottom of the post.
3. HASHTAGS: Always include #AgentAISchool as the first hashtag.
4. NO META-COMMENTARY: No word counts.

OUTPUT REQUIREMENTS:
- Return ONLY a valid JSON object. No conversational preamble.
- JSON structure must include:
- enhancedPost: The complete, formatted post content.

RESPONSE FORMAT:
{
  "hook": "...",
  "enhancedPost": "...",
  "hookScore": 9,
  "hookTip": "...",
  "hashtags": ["#tag1", "#tag2"],
  "visualSuggestion": "..."
}
`;
        },
        hook: (tone: string, hookTip: string, content: string) => {
            return `
You are a world-class Headline and Hook specialist.
Your mission: Generate a powerful, attention-grabbing "Hook" (1-3 sentences) specifically for a LinkedIn post or Article.

TONE: ${tone}
HOOK STRATEGY: ${hookTip}

CONTEXT (The content this hook is for):
"""
${content}
"""

GUIDELINES:
1. SPECIFICITY: The hook MUST be tailored to the ${tone} tone. 
   - Professional: Data-driven, authoritative, high-value.
   - Conversational: Friendly, relatable, "common-sense" but professional.
   - Story: Narrative-driven, emotional, "I was there" feel.
   - Bold: Contrarian, provocative, pattern-interrupting.
2. ACTIONABLE: Follow the "Hook Tip" strategy provided above exactly.
3. CONCISE: Keep it to 1-3 sentences maximum.

OUTPUT:
Return ONLY the hook text. No preamble, no quotes.
`;
        }
    }
};

export default config;
