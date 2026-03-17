export interface PromptOptions {
    tone: string;
    text: string;
    targetPages?: number;
    researchData?: string;
}

export const ARTICLE_PROMPT = ({ tone, text, targetPages = 2, researchData }: PromptOptions) => {
    const wordCount = targetPages * 500;
    return `
You are a world-class investigative journalist and technical writer.
Your mission: Write a comprehensive, high-authority article based on the provided input and research.

TONE: ${tone}
TARGET LENGTH: Exactly ${targetPages} pages (~${wordCount} words). This is a LONG FORM article.

INPUT MATERIAL:
"""
${text}
"""

${researchData ? `RESEARCH DATA & STATISTICS:
"""
${researchData}
"""` : ''}

GUIDELINES:
1. STRUCTURE: Use a compelling title, introduction, at least ${targetPages * 2} detailed subheadings (H2, H3), and a strong conclusion.
2. DEPTH & EXPANSION: DO NOT summarize. For every point you make, provide a detailed explanation, use a real-world example, and incorporate at least 3-4 relevant facts or search-backed statistics. 
3. TARGET REACH: You MUST reach the target length of ~${wordCount} words. Each section should be approximately 250-400 words long. This is a strict requirement for a premium, high-value, long-form article.
4. READABILITY: Use clear, professional language. Use bullet points for lists.
5. FORMATTING: Use Markdown for structure.

OUTPUT REQUIREMENTS:
- Return valid JSON.
- hookScore: A rating of the article's title and introduction (1-10).
- hookTip: One specific way to make the opening hook even more engaging.
- enhancedPost: The complete, formatted article content (in Markdown).

RESPONSE FORMAT:
{
  "enhancedPost": "...",
  "hookScore": 9,
  "hookTip": "...",
  "hashtags": ["#tag1", "#tag2"],
  "visualSuggestion": "..."
}
`;
};

export const POST_PROMPT = ({ tone, text, researchData }: PromptOptions) => {
    return `
You are a world-class LinkedIn ghostwriter for TOP 1% creators. 
Your mission: Transform raw, messy thoughts into a viral-ready post that stops the scroll and builds authority.

TONE: ${tone}

INPUT MATERIAL:
"""
${text}
"""

${researchData ? `RESEARCH DATA & STATISTICS to incorporate:
"""
${researchData}
"""` : ''}

GUIDELINES:
1. THE HOOK: The first sentence must be a digital "stop sign." Use curiosity gaps, bold claims, or relatable pain points.
2. THE RE-HOOK: The second sentence must justify the hook and pull them deeper.
3. THE BODY: 
   - Use lots of whitespace (one sentence or short paragraph per block).
   - Transform complex ideas into simple bullet points or analogies.
   - Ensure every line adds value or moves the story forward.
4. THE CTA: End with a high-friction engagement question that forces a thoughtful comment.
5. THE HASHTAGS: 3-5 high-relevance tags. No generic spam.

OUTPUT REQUIREMENTS:
- Return valid JSON.
- hookScore: A brutal but fair rating (1-10).
- hookTip: One specific, actionable way to make the opening even stronger.
- enhancedPost: The complete, formatted post content.

RESPONSE FORMAT:
{
  "enhancedPost": "...",
  "hookScore": 9,
  "hookTip": "...",
  "hashtags": ["#tag1", "#tag2"],
  "visualSuggestion": "..."
}
`;
};
