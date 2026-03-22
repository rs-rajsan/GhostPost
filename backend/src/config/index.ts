import dotenv from 'dotenv';
// Load environment variables immediately
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
}

export interface PromptOptions {
    tone: string;
    text: string;
    targetPages?: number;
    researchData?: string;
}

const env = process.env.NODE_ENV || 'development';
const securityApiKey = process.env.SECURITY_API_KEY || '';
const draftingApiKey = process.env.DRAFTING_API_KEY || '';
const validationApiKey = process.env.VALIDATION_API_KEY || '';
const refinementApiKey = process.env.REFINEMENT_API_KEY || '';

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
    prompts: {
        article: ({ tone, text, targetPages = 2, researchData }: PromptOptions) => {
            const wordCount = targetPages * 650;
            return `
You are a world-class investigative journalist and technical writer.
Your mission: Write a comprehensive, high-authority article based on the provided input and research.

TONE: ${tone}
TARGET LENGTH: Exactly ${targetPages} pages (~${wordCount} words). This is a LONG FORM article.

INPUT MATERIAL:
"""
${text}
"""

${researchData ? `RESEARCH DATA & STATISTICS:
"""
${researchData}
"""` : ''}

GUIDELINES:
1. STRUCTURE: Use a compelling title, introduction, at least ${targetPages * 2} detailed subheadings (H2, H3), and a strong conclusion.
2. DEPTH & SUBSTANCE: DO NOT summarize. For every point you make, provide a detailed explanation, a real-world case study or example, and incorporate at least 4-5 relevant facts, technical details, or search-backed statistics. Add historical context or future predictions where relevant to increase authority.
3. TARGET REACH: You MUST reach the target length of ~${wordCount} words through dense, high-value information. Each section should be approximately 300-450 words long. This is a strict requirement for a premium, long-form investigative piece.
4. READABILITY: Use clear, professional language. Use bullet points for lists.
5. FORMATTING: Use Markdown for structure.

OUTPUT REQUIREMENTS:
- Return ONLY a valid JSON object. No conversational preamble.
- JSON structure must include:
- enhancedPost: The complete, formatted article content (in Markdown).

RESPONSE FORMAT:
{
  "enhancedPost": "...",
  "hookScore": 9,
  "hookTip": "...",
  "hashtags": ["#tag1", "#tag2"],
  "visualSuggestion": "..."
}
`;
        },
        post: ({ tone, text, researchData }: PromptOptions) => {
            return `
You are a world-class Ghostwriter for TOP 1% creators. 
Your mission: Transform raw, messy thoughts into a viral-ready post that stops the scroll and builds authority.

TONE: ${tone}
TARGET LENGTH: Half to 1 page maximum (~250-400 words). LESS IS MORE.

INPUT MATERIAL:
"""
${text}
"""

${researchData ? `RESEARCH DATA & STATISTICS to incorporate:
"""
${researchData}
"""` : ''}

GUIDELINES:
1. THE HOOK: The first sentence must be a digital "stop sign." Use curiosity gaps, bold claims, or relatable pain points.
2. THE RE-HOOK: The second sentence must justify the hook and pull them deeper.
3. CONCISENESS & IMPACT: Keep it tight. Every word must earn its place. Use lots of whitespace (one sentence or short paragraph per block).
4. THE BODY: 
   - Transform complex ideas into simple bullet points or analogies.
   - Ensure every line adds value or moves the story forward.
5. THE CTA: End with a high-friction engagement question that forces a thoughtful comment.
6. THE HASHTAGS: 3-5 high-relevance tags. No generic spam.

OUTPUT REQUIREMENTS:
- Return ONLY a valid JSON object. No conversational preamble.
- JSON structure must include:
- enhancedPost: The complete, formatted post content.

RESPONSE FORMAT:
{
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
