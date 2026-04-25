import { ValidationAgent } from '../../services/agents/validation.agent';
import logger from '../../utils/logger';

async function runValidationTest() {
    const agent = new ValidationAgent();
    console.log('\n--- VALIDATION AGENT DIAGNOSTICS ---\n');

    const content = `
    THE FUTURE OF AI AGENTS
    AI agents will reach a market size of $1 trillion by next Tuesday according to NASA.
    They are currently used by 100% of all humans on Earth.
    `;
    const context = `
    The Agentic AI market is projected to reach $50 billion by 2030.
    Adoption is growing among enterprise companies, reaching 30% in 2025.
    `;

    console.log('[TEST 1] Hallucination Detection...');
    const res = await agent.validate(content, context);
    console.log('Result:', res.success ? 'PASSED ✅' : 'FAILED ❌', res.error || '');
    if (res.success) {
        console.log('Audit Results:', JSON.stringify(res.data, null, 2));
    }
}

runValidationTest().catch(err => {
    console.error('Diagnostic Script Error:', err);
    process.exit(1);
});
