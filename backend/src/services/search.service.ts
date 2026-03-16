import axios from 'axios';
import logger from '../utils/logger';

export interface SearchResult {
    title: string;
    content: string;
    url: string;
}

/**
 * A generic search service to gather facts and statistics.
 * In a real-world scenario, this would connect to Tavily, Serper, or Brave Search.
 * For now, it provides a structure to integrate with such APIs.
 */
export const performResearch = async (topic: string): Promise<string> => {
    const apiKey = process.env.TAVILY_API_KEY;
    
    if (!apiKey || apiKey === 'your_tavily_api_key_here') {
        logger.warn('TAVILY_API_KEY not set. Using mock research data.');
        return getMockResearch(topic);
    }

    try {
        // Log query but NEVER the apiKey
        logger.info({ topic }, 'Performing web research via Tavily');
        
        const response = await axios.post('https://api.tavily.com/search', {
            api_key: apiKey,
            query: topic,
            search_depth: 'advanced',
            include_answer: true,
            max_results: 5
        });

        const { results, answer } = response.data;
        
        if (!results || results.length === 0) {
            logger.warn({ topic }, 'No research results found for topic');
            return `No specific real-time data found for "${topic}". Proceeding with general knowledge.`;
        }

        let researchContent = `Research Answer: ${answer || 'N/A'}\n\nKey Findings:\n`;
        results.forEach((res: any, index: number) => {
            researchContent += `[${index + 1}] ${res.title}: ${res.content} (Source: ${res.url})\n\n`;
        });

        return researchContent;
    } catch (error: any) {
        // Redact any potential key leaks in error message if necessary, 
        // though axios errors usually don't include post body in msg unless configured.
        logger.error({ 
            error: error.message, 
            status: error.response?.status,
            topic 
        }, 'Failed to perform research');
        
        return `Note: Real-time research was partially unavailable (${error.message}). The content will be based on general knowledge and available statistics.`;
    }
};

const getMockResearch = (topic: string): string => {
    return `
        Mock Research Data for: "${topic}"
        - Stat 1: 75% of professionals believe ${topic} will impact their industry by 2030.
        - Fact 2: Industry leaders have seen a 20% increase in productivity when using ${topic} frameworks.
        - Trend 3: Global investment in ${topic}-related technologies reached $50B last year.
        Disclaimer: This is simulated research data because no search API key was provided.
    `;
};
