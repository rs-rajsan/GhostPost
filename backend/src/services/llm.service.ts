import OpenAI from 'openai';
import logger from '../utils/logger';

// --- Configuration & Singleton ---
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

export interface EnhancePostResponse {
    enhancedPost: string;
    hookScore: number;
    hookTip: string;
    hashtags: string[];
}

// --- Logic & Generators ---
const buildPrompt = (text: string, tone: string): string => `
    You are a world-class LinkedIn ghostwriter for TOP 1% creators. 
    Your mission: Transform raw, messy thoughts into a viral-ready post that stops the scroll and builds authority.
    
    TONE: ${tone}
    
    INPUT MATERIAL:
    """
    ${text}
    """
    
    GUIDELINES:
    1. THE HOOK: The first sentence must be a digital "stop sign." Use curiosity gaps, bold claims, or relatable pain points.
    2. THE RE-HOOK: The second sentence must justify the hook and pull them deeper.
    3. THE BODY: 
       - Use lots of whitespace (one sentence or short paragraph per block).
       - Transform complex ideas into simple bullet points or analogies.
       - Ensure every line adds value or moves the story forward.
    4. THE CTA: End with a high-friction engagement question that forces a thoughtful comment.
    5. THE HASHTAGS: 3-5 high-relevance tags. No generic spam.
    
    OUTPUT REQUIREMENTS:
    - Return valid JSON.
    - hookScore: A brutal but fair rating (1-10).
    - hookTip: One specific, actionable way to make the opening even stronger.
    - enhancedPost: The complete, formatted post content.
    
    RESPONSE FORMAT:
    {
      "enhancedPost": "...",
      "hookScore": 9,
      "hookTip": "...",
      "hashtags": ["#tag1", "#tag2"]
    }
`;

const getMockResponse = (text: string, tone: string): EnhancePostResponse => {
    logger.warn('OPENAI_API_KEY not set or invalid. Returning mock data.');
    return {
        enhancedPost: `(MOCK RESULT) This is a polished version of your post in a ${tone} tone.\n\nYour original thoughts: "${text}"\n\nI've restructured this to be more engaging for LinkedIn.`,
        hookScore: 8,
        hookTip: "This is a mock tip: try making the first sentence even more punchy!",
        hashtags: ["#mock", "#linkedin", "#ai"]
    };
};

export const enhancePost = async (text: string, tone: string): Promise<EnhancePostResponse> => {
    logger.info({ tone, textLength: text.length }, 'Enhancing post started');

    if (isMockMode()) {
        return getMockResponse(text, tone);
    }

    try {
        const openai = getOpenAIClient();
        const prompt = buildPrompt(text, tone);

        const response = await openai.chat.completions.create({
            model: 'gpt-4o', // Upgrading model for better quality if available, or gpt-4o
            messages: [
                { role: 'system', content: 'You are an elite LinkedIn copywriter. You specialize in viral growth and personal branding.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error('No content received from OpenAI');

        const parsedContent = JSON.parse(content) as EnhancePostResponse;
        logger.info('Successfully enhanced post from OpenAI');
        return parsedContent;
    } catch (error) {
        logger.error({ error }, 'Error enhancing post with OpenAI');
        throw error;
    }
};
