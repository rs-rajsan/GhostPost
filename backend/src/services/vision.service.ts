import OpenAI from 'openai';
import logger from '../utils/logger';

const getApiKey = () => process.env.OPENAI_API_KEY;

let openAIClientInstance: OpenAI | null = null;
const getOpenAIClient = (): OpenAI => {
    if (!openAIClientInstance) {
        const apiKey = getApiKey();
        if (!apiKey) throw new Error('OpenAI API key is missing');
        openAIClientInstance = new OpenAI({ apiKey });
    }
    return openAIClientInstance;
};

export const synthesizeImageToNotes = async (base64Image: string, mimeType: string): Promise<string> => {
    logger.info('Starting image synthesis to OneNote layout');

    // MOCK MODE FALLBACK for Missing Key
    if (!getApiKey() || getApiKey() === 'your_openai_api_key_here') {
        logger.warn('OPENAI_API_KEY not set or invalid. Returning mock vision data.');
        return `
# Mock OneNote Output
        
*This is a fallback response because no valid OpenAI key was found.*
        
## Key Extracted Points
- Point 1 from image handwriting
- Point 2 from diagram
        
**Summary:** The image contained mock architectural blocks.
        `.trim();
    }

    try {
        const openai = getOpenAIClient();
        
        const prompt = `
        You are an expert digital archivist and note-taker. 
        I am giving you an image (which could be handwriting, a diagram, or a screenshot of an article).
        
        Your job is to transcribe, synthesize, and format this image's content into highly structured Markdown that mimics a clean Microsoft OneNote page.
        
        INSTRUCTIONS FOR ONENOTE COMPATIBILITY:
        1. Always start with a Title (Heading 1).
        2. Use Bullet Points for lists of items or fragmented thoughts.
        3. Use Bold text for emphasis or key terms.
        4. Organize content hierarchically (H2 for sections, H3 for sub-sections).
        5. If there is a diagram, describe it clearly in a fenced text block.
        6. Do not wrap the final output in \`\`\`markdown tags. Just return the raw markdown string.
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`,
                                detail: "high"
                            },
                        },
                    ],
                },
            ],
            max_tokens: 1500,
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error('No content received from OpenAI Vision');

        logger.info('Successfully synthesized image via Vision API');
        return content;
    } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to synthesize image to Notes');
        throw new Error(`Vision synthesis failed: ${error.message}`);
    }
};
