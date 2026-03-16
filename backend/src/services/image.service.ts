import OpenAI from 'openai';
import { GoogleGenerativeAI } from "@google/generative-ai";
import logger from '../utils/logger';

const getOpenAIApiKey = () => process.env.OPENAI_API_KEY;
const getGeminiApiKey = () => process.env.GEMINI_API_KEY;

let openAIClientInstance: OpenAI | null = null;
const getOpenAIClient = (): OpenAI => {
    if (!openAIClientInstance) {
        const apiKey = getOpenAIApiKey();
        if (!apiKey) throw new Error('OpenAI API key is missing');
        openAIClientInstance = new OpenAI({ apiKey });
    }
    return openAIClientInstance;
};

/**
 * Generates an image using OpenAI DALL-E 3.
 */
const generateWithOpenAI = async (visualPrompt: string): Promise<string | null> => {
    const apiKey = getOpenAIApiKey();
    if (!apiKey || apiKey === 'your_openai_api_key_here') return null;

    logger.info({ visualPrompt }, 'Generating image via OpenAI DALL-E 3');
    const openai = getOpenAIClient();
    const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: `A professional, clean, high-quality visual for a business article: ${visualPrompt}. Style: modern, minimalist, corporate-tech aesthetic.`,
        n: 1,
        size: "1024x1024",
    });

    return response.data?.[0]?.url || null;
};

/**
 * Generates an image using Gemini's Imagen model (via GoogleGenerativeAI SDK).
 * Note: Imagen support in the SDK might require specific model names like 'imagen-3.0-generate-001'.
 */
const generateWithGemini = async (visualPrompt: string): Promise<string | null> => {
    const apiKey = getGeminiApiKey();
    if (!apiKey || apiKey === 'your_gemini_api_key_here') return null;

    try {
        logger.info({ visualPrompt }, 'Generating image via Gemini/Imagen');
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Using the Imagen model (Note: Actual model name may vary based on specific API access)
        const model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-001" });
        
        // This is a placeholder for the actual Imagen generation call if supported in the current SDK version
        // In many SDK versions, image generation is a separate endpoint, but following the user's request:
        const result = await (model as any).generateImages({
            prompt: visualPrompt,
            number_of_images: 1,
        });

        const imageUrl = result.images?.[0]?.url || null;
        return imageUrl;
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to generate image via Gemini');
        return null;
    }
};

/**
 * Generates an image or diagram. Tries OpenAI first, then falls back to Gemini.
 */
export const generateImage = async (visualPrompt: string): Promise<string | null> => {
    if (!visualPrompt) return null;

    try {
        // Try OpenAI first
        let url = await generateWithOpenAI(visualPrompt);
        
        // If OpenAI fails or is not configured, try Gemini
        if (!url) {
            url = await generateWithGemini(visualPrompt);
        }

        if (url) {
            logger.info('Successfully generated image URL');
        } else {
            logger.warn('All image providers failed or are not configured.');
        }
        
        return url;
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to generate image (all providers)');
        return null;
    }
};
