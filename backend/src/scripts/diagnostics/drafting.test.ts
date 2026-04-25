import { DraftingAgent } from '../../services/agents/drafting.agent';
import logger from '../../utils/logger';

async function runDraftingTest() {
    const agent = new DraftingAgent();
    console.log('\n--- DRAFTING AGENT DIAGNOSTICS ---\n');

    // Test 1: Web Research
    console.log('[TEST 1] Web Research...');
    const res1 = await agent.research('Latest trends in Agentic AI as of 2026');
    console.log('Result:', res1.success ? 'PASSED ✅' : 'FAILED ❌', res1.error || '');
    if (res1.success) {
        console.log('Research Data Snippet:', res1.data.substring(0, 200) + '...');
    }

    // Test 2: Drafting (Social Post)
    console.log('\n[TEST 2] Social Post Drafting...');
    const res2 = await agent.draft({
        mode: 'post',
        tone: 'Professional',
        text: 'AI agents are changing how we build software.',
        researchData: res1.data
    });
    console.log('Result:', res2.success ? 'PASSED ✅' : 'FAILED ❌', res2.error || '');
    if (res2.success) {
        console.log('Draft Snippet:', res2.data.substring(0, 200) + '...');
    }
}

runDraftingTest().catch(err => {
    console.error('Diagnostic Script Error:', err);
    process.exit(1);
});
