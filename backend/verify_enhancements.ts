import * as dotenv from 'dotenv';
import * as searchService from './src/services/search.service';
import * as llmService from './src/services/llm.service';

dotenv.config();

async function testResearchAndEnhance() {
    console.log('--- Starting Backend Verification Test ---');
    
    const topic = 'Impact of AI on software engineering in 2026';
    const mode: llmService.EnhancementMode = 'article';
    const targetPages = 1;
    const deepResearch = true;

    console.log(`\n1. Testing Research Service for: "${topic}"...`);
    const researchData = await searchService.performResearch(topic);
    console.log('Research Results (first 200 chars):');
    console.log(researchData.substring(0, 200) + '...');

    console.log(`\n2. Testing LLM Enhancement (Article Mode, ${targetPages} page)...`);
    try {
        const result = await llmService.enhancePost(topic, {
            mode,
            targetPages,
            researchData
        });
        
        console.log('\nSuccess! Tones generated:');
        Object.keys(result).forEach(tone => {
            const data = (result as any)[tone];
            console.log(`- ${tone}: ${data.enhancedPost.length} chars, Hook Score: ${data.hookScore}`);
        });

        console.log('\nSample Content (Professional Tone, first 200 chars):');
        console.log(result.Professional.enhancedPost.substring(0, 200) + '...');

    } catch (error: any) {
        console.error('\nVerification failed:', error.message);
    }

    console.log('\n--- Verification Test Complete ---');
}

testResearchAndEnhance();
