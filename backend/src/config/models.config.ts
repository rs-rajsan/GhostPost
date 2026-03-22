/**
 * AI Model configurations (Role-based, provider-agnostic)
 */
export const MODELS = {
    SECURITY: {
        DEFAULT: process.env.SECURITY_MODEL || 'gpt-4o-2024-08-06',
        GUARD: process.env.GUARD_MODEL || 'gpt-4o-mini',
        VISION: process.env.VISION_MODEL || 'gpt-4o',
    },
    DRAFTING: {
        DEFAULT: process.env.DRAFTING_MODEL || 'sonar',
    },
    VALIDATION: {
        DEFAULT: process.env.VALIDATION_MODEL || 'gemini-2.5-flash',
    }
};
