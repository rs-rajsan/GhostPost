import { RefiningAgent } from '../../services/agents/refining.agent';
import { ValidationResult } from '../../services/agents/validation.agent';
import logger from '../../utils/logger';

async function runRefiningTest() {
    const agent = new RefiningAgent();
    console.log('\n--- REFINING AGENT DIAGNOSTICS ---\n');

    const content = JSON.stringify({
        title: "AI Agents everywhere",
        enhancedPost: "AI agents will reach a market size of $1 trillion by next Tuesday according to NASA. They are currently used by 100% of all humans on Earth.",
        hookScore: 1,
        hashtags: ["#fake"]
    });

    const audit: ValidationResult = {
        isValid: false,
        qualityScore: 1,
        confidenceScore: 0,
        hallucinations: [
            "AI agents will reach a market size of $1 trillion by next Tuesday",
            "according to NASA",
            "They are currently used by 100% of all humans on Earth"
        ],
        suggestions: [
            "Replace hallucinated claims with verified data from research.",
            "Make the hook more professional."
        ]
    };

    console.log('[TEST 1] Content Refinement...');
    const res = await agent.refine(content, audit);
    console.log('Result:', res.success ? 'PASSED ✅' : 'FAILED ❌', res.error || '');
    if (res.success) {
        console.log('Refined Content Snippet:', res.data.substring(0, 300) + '...');
    }
}

runRefiningTest().catch(err => {
    console.error('Diagnostic Script Error:', err);
    process.exit(1);
});
