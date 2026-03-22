import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger';
import config from '../config';
import { SecurityService } from '../utils/security.util';

let genAI: GoogleGenerativeAI | null = null;
const getValidationClient = (): GoogleGenerativeAI => {
    if (!genAI) {
        const apiKey = config.validation.apiKey;
        if (!config.validation.isMockMode && apiKey) {
            genAI = new GoogleGenerativeAI(apiKey);
        } else if (!config.validation.isMockMode && !apiKey) {
            throw new Error('Validation API key is missing');
        }
    }
    return genAI as GoogleGenerativeAI;
};

export const synthesizeImageToNotes = async (base64Image: string, mimeType: string): Promise<string> => {
    logger.info('Synthesizing image to notes...');

    // MOCK MODE FALLBACK
    if (config.validation.isMockMode || !config.validation.apiKey) {
        logger.warn('Validation API key not set or invalid. Returning mock vision data.');
        return `
# Mock Notes Output
- Key Point 1: Extracted from image handwriting.
- Key Point 2: Analysis of diagram.
- Summary: The image contained mock architectural blocks.
        `;
    }

    try {
        const genAIClient = getValidationClient();
        const model = genAIClient.getGenerativeModel({ model: config.validation.model });
        
        const prompt = `
        You are an expert digital archivist and note-taker. 
        I am giving you an image which could be handwriting, a diagram, or a screenshot of an article.
        Your job is to transcribe, synthesize and format the image content into a clean, structured set of OneNote-style notes.
        
        INSTRUCTIONS:
        1. Always start with a # Main Title (if obvious, otherwise "Extracted Notes").
        2. Use Bullet Points for lists, fragmented thoughts, or items.
        3. Use Bold text for emphasis or key terms.
        4. Organize content hierarchically (H2 sections, H3 sub-sections).
        5. If there is a diagram, describe it clearly in a fenced text block.
        
        Do not wrap the final output in code blocks unless they were in the image.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();
        
        if (!text) throw new Error('No content received from Vision API');

        const safeText = await SecurityService.scanOutput(text);

        logger.info('Successfully synthesized image via Vision API');
        return safeText;
    } catch (error: any) {
        logger.error({ error: error.message }, 'Vision synthesis failed');
        throw new Error(`Vision synthesis failed: ${error.message}`);
    }
};
