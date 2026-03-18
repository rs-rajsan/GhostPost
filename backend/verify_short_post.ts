import * as dotenv from 'dotenv';
import * as llmService from './src/services/llm.service';

dotenv.config();

async function testShortPost() {
    console.log('--- Starting Short Post Verification Test ---');
    
    // Provoking it with a very long input to see if it stays short
    const topic = 'Efficiency in remote work';
    const longInput = 'This is detailed input about remote work efficiency and how to manage time, avoid distractions, and use tools like Slack and Zoom. '.repeat(50);
    const mode: llmService.EnhancementMode = 'post';

    console.log(`\nTesting LLM Enhancement (Post Mode, Input length: ${longInput.length} chars)...`);
    try {
        const result = await llmService.enhancePost(longInput, {
            mode
        });
        
        console.log('\nSuccess! Tones generated:');
        Object.keys(result).forEach(tone => {
            const data = (result as any)[tone];
            const wordCount = data.enhancedPost.split(/\s+/).length;
            console.log(`- ${tone}: ${data.enhancedPost.length} chars, ~${wordCount} words, Hook Score: ${data.hookScore}`);
        });

        const profContent = result.Professional.enhancedPost;
        console.log('\nProfessional Tone Preview (first 500 chars):');
        console.log(profContent.substring(0, 500) + '...');
        
        if (profContent.length < 3000) {
            console.log('\nPASSED: Post length is concise (< 3000 chars).');
        } else {
            console.log('\nFAILED: Post is still too long.');
        }

    } catch (error: any) {
        console.error('\nVerification failed:', error.message);
    }

    console.log('\n--- Verification Test Complete ---');
}

testShortPost();
