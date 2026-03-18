import OpenAI from 'openai';
import logger from '../utils/logger';
import { ARTICLE_PROMPT, POST_PROMPT, HOOK_PROMPT } from '../utils/prompts';

// --- Configuration & Singleton ---
// ... (rest of the imports and singleton logic remains the same)
const getApiKey = () => process.env.OPENAI_API_KEY;
const isMockMode = () => {
    const key = getApiKey();
    return !key || key === 'your_openai_api_key_here';
};

let openAIClientInstance: OpenAI | null = null;
const getOpenAIClient = (): OpenAI => {
    if (!openAIClientInstance) {
        const apiKey = getApiKey();
        if (!apiKey) throw new Error('OpenAI API key is missing');
        openAIClientInstance = new OpenAI({ apiKey });
    }
    return openAIClientInstance;
};

export interface ToneResponse {
    enhancedPost: string;
    hookScore: number;
    hookTip: string;
    hashtags: string[];
}

export type EnhancePostResponse = Record<'Professional' | 'Conversational' | 'Storytelling' | 'Bold/Contrarian', ToneResponse>;

export type EnhancementMode = 'post' | 'article';

interface EnhanceOptions {
    mode?: EnhancementMode;
    targetPages?: number;
    researchData?: string;
}

// --- Logic & Generators ---
const buildPrompt = (text: string, tone: string, options: EnhanceOptions): string => {
    const { mode = 'post', targetPages = 2, researchData } = options;
    const promptOptions = { tone, text, targetPages, researchData };

    return mode === 'article' 
        ? ARTICLE_PROMPT(promptOptions)
        : POST_PROMPT(promptOptions);
};

const getMockResponse = (text: string, options: EnhanceOptions): EnhancePostResponse => {
    logger.warn('OPENAI_API_KEY not set or invalid. Returning mock data.');
    const { mode = 'post', targetPages = 2 } = options;
    
    const makeMock = (t: string) => ({
        enhancedPost: mode === 'article' 
            ? `# Mock ${t} Article\n\nThis is a simulated ${targetPages}-page article about "${text.substring(0, 30)}...".\n\n## Section 1\nIt contains multiple sections and research-backed data simulator. Lorem ipsum...`
            : `(MOCK RESULT) This is a polished version of your post in a ${t} tone.\n\nYour original thoughts: "${text}"\n\nI've restructured this to be more engaging for LinkedIn.`,
        hookScore: 8,
        hookTip: "This is a mock tip: try making the first sentence even more punchy!",
        hashtags: ["#mock", "#linkedin", "#ai"]
    });

    return {
        'Professional': makeMock('Professional'),
        'Conversational': makeMock('Conversational'),
        'Storytelling': makeMock('Storytelling'),
        'Bold/Contrarian': makeMock('Bold/Contrarian'),
    };
};

const generateSingleTone = async (openai: OpenAI, text: string, tone: string, options: EnhanceOptions): Promise<ToneResponse> => {
    const prompt = buildPrompt(text, tone, options);
    
    // Dynamic token calculation based on target pages
    // Approx 1500 tokens per page + 1000 for JSON/formatting overhead
    const targetPages = options.targetPages || 2;
    const calculatedMaxTokens = options.mode === 'article' 
        ? Math.min((targetPages * 1500) + 1000, 16000) 
        : 1000;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-2024-08-06',
        messages: [
            { role: 'system', content: 'You are an elite copywriter and ghostwriter. You specialize in high-impact content across LinkedIn and long-form articles.' },
            { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        max_tokens: calculatedMaxTokens,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content received from OpenAI');

    return JSON.parse(content) as ToneResponse;
};

export const enhancePost = async (text: string, options: EnhanceOptions = {}): Promise<EnhancePostResponse> => {
    logger.info({ textLength: text.length, mode: options.mode }, 'Enhancing post started for all 4 tones');

    if (isMockMode()) {
        return getMockResponse(text, options);
    }

    try {
        const openai = getOpenAIClient();
        
        const tones = ['Professional', 'Conversational', 'Storytelling', 'Bold/Contrarian'] as const;
        
        // Run all inferences concurrently (DRY approach)
        const results = await Promise.all(
            tones.map(tone => generateSingleTone(openai, text, tone, options))
        );

        logger.info('Successfully enhanced post from OpenAI across all tones');
        
        // Reconstruct expected Response payload
        const responsePayload = tones.reduce((acc, tone, index) => {
            acc[tone] = results[index];
            return acc;
        }, {} as EnhancePostResponse);

        return responsePayload;
    } catch (error) {
        logger.error({ error }, 'Error enhancing post with OpenAI in parallel');
        throw error;
    }
};
export const generateHook = async (text: string, tone: string, hookTip: string): Promise<string> => {
    logger.info({ tone, hookTipLength: hookTip.length }, 'Generating custom hook');

    if (isMockMode()) {
        return `(MOCK HOOK) This is a ${tone} hook based on: ${hookTip}`;
    }

    try {
        const openai = getOpenAIClient();
        const prompt = HOOK_PROMPT(tone, hookTip, text);

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-2024-08-06',
            messages: [
                { role: 'system', content: 'You are a world-class Headline and Hook specialist.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 300,
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error('No content received from OpenAI for hook');

        return content.trim();
    } catch (error) {
        logger.error({ error }, 'Error generating hook with OpenAI');
        throw error;
    }
};
