import * as dotenv from 'dotenv';
import * as llmService from './src/services/llm.service';

dotenv.config();

async function testLongArticle() {
    console.log('--- Starting Long Article Verification Test ---');
    
    // Simulating a large input (about 5000 chars)
    const topic = 'The Future of Renewable Energy and its Global Economic Impact';
    const longInput = topic + '. ' + 'This is a test input sentence repeated to increase length. '.repeat(100);
    const mode: llmService.EnhancementMode = 'article';
    const targetPages = 5; // Testing 5 pages

    console.log(`\nTesting LLM Enhancement (Article Mode, ${targetPages} pages, Input length: ${longInput.length} chars)...`);
    try {
        const result = await llmService.enhancePost(longInput, {
            mode,
            targetPages
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
        
        if (profContent.length > 5000) {
            console.log('\nPASSED: Content length is substantial (> 5000 chars).');
        } else {
            console.log('\nFAILED: Content length is still relatively short.');
        }

    } catch (error: any) {
        console.error('\nVerification failed:', error.message);
    }

    console.log('\n--- Verification Test Complete ---');
}

testLongArticle();
