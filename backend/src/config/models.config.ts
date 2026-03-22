/**
 * AI Model configurations (Role-based, provider-agnostic)
 */
export const MODELS = {
    SECURITY: {
        DEFAULT: process.env.SECURITY_MODEL || '',
        GUARD: process.env.GUARD_MODEL || '',
    },
    DRAFTING: {
        DEFAULT: process.env.DRAFTING_MODEL || '',
    },
    VALIDATION: {
        DEFAULT: process.env.VALIDATION_MODEL || '',
    },
    REFINEMENT: {
        DEFAULT: process.env.REFINEMENT_MODEL || '',
    }
};
