import axios from 'axios';
import config from '../config';

export interface ResearchTopic {
    topic: string;
    sourceUrl: string;
    newsDate: string;
    trendScore: number;
    confidence: number;
}

export class ResearchService {
    private static instance: ResearchService;

    public static getInstance(): ResearchService {
        if (!ResearchService.instance) {
            ResearchService.instance = new ResearchService();
        }
        return ResearchService.instance;
    }

    /**
     * Finds top trending topics based on a watchlist of companies.
     */
    public async findTrendingTopics(watchlist: string[], signal?: AbortSignal): Promise<ResearchTopic[]> {
        const apiKey = config.research.apiKey;
        const apiUrl = config.research.url;

        if (!apiKey || apiKey.includes('your_')) {
            // Mock response if no API key
            return this.getMockTopics(watchlist);
        }

        const prompt = `
            Find the top 10 most recent and impactful news stories or technical updates related to these companies/topics:
            ${watchlist.join(', ')}

            Return ONLY a valid JSON array of objects with this structure:
            [
              {
                "topic": "Concise headline of the news",
                "sourceUrl": "Primary source URL",
                "newsDate": "YYYY-MM-DD",
                "trendScore": 0-100 score of how much this is trending,
                "confidence": 0-100 factual confidence score
              }
            ]
            
            Prioritize news from the last 48 hours. Ensure topics are distinct.
        `;

        try {
            const response = await axios.post(apiUrl, {
                model: config.research.model,
                messages: [
                    { role: 'system', content: 'You are a technical research agent.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.2
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                signal
            });

            const content = response.data.choices[0].message.content;
            const cleanedContent = content.replace(/```json|```/g, '').trim();
            return JSON.parse(cleanedContent);
        } catch (error: any) {
            if (axios.isCancel(error)) {
                console.log('Research request cancelled');
                throw new Error('Research cancelled by user');
            }
            console.error('Research Bot Error:', error);
            return this.getMockTopics(watchlist);
        }
    }

    /**
     * Finds top companies and their market rankings for a given category.
     */
    public async findMarketRankings(category: string, signal?: AbortSignal): Promise<any[]> {
        const apiKey = config.research.apiKey;
        const apiUrl = config.research.url;

        if (!apiKey || apiKey.includes('your_')) {
            // Return mock rankings if no API key
            return this.getMockRankings(category);
        }

        const prompt = `
            Identify the top 15 most relevant and influential companies in the ${category} sector.
            For each company, provide a "marketRank" from 1 to 15 (1 being most influential).

            Return ONLY a valid JSON array of objects with this structure:
            [
              {
                "name": "Full Company Name",
                "marketRank": 1-15
              }
            ]
        `;

        try {
            const response = await axios.post(apiUrl, {
                model: config.research.model,
                messages: [
                    { role: 'system', content: 'You are a market research agent.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                signal
            });

            const content = response.data.choices[0].message.content;
            const cleanedContent = content.replace(/```json|```/g, '').trim();
            return JSON.parse(cleanedContent);
        } catch (error: any) {
            console.error('Market Rankings Bot Error:', error);
            return this.getMockRankings(category);
        }
    }

    private getMockRankings(category: string): any[] {
        if (category === 'IT Strategy') {
            return [
                { name: 'Accenture', marketRank: 1 },
                { name: 'Gartner', marketRank: 2 },
                { name: 'McKinsey & Company', marketRank: 3 },
                { name: 'Deloitte', marketRank: 4 },
                { name: 'IBM Consulting', marketRank: 5 },
                { name: 'BCG', marketRank: 6 },
                { name: 'Capgemini', marketRank: 7 },
                { name: 'Bain & Company', marketRank: 8 },
                { name: 'Infosys', marketRank: 9 },
                { name: 'Wipro', marketRank: 10 },
                { name: 'TCS', marketRank: 11 },
                { name: 'Cognizant', marketRank: 12 },
                { name: 'PwC', marketRank: 13 },
                { name: 'EY', marketRank: 14 },
                { name: 'KPMG', marketRank: 15 }
            ];
        }
        // Default to AI Companies
        return [
            { name: 'OpenAI', marketRank: 1 },
            { name: 'NVIDIA', marketRank: 2 },
            { name: 'Microsoft', marketRank: 3 },
            { name: 'Google DeepMind', marketRank: 4 },
            { name: 'Anthropic', marketRank: 5 },
            { name: 'Meta AI', marketRank: 6 },
            { name: 'Tesla', marketRank: 7 },
            { name: 'Amazon AWS', marketRank: 8 },
            { name: 'Mistral AI', marketRank: 9 },
            { name: 'Databricks', marketRank: 10 },
            { name: 'Hugging Face', marketRank: 11 },
            { name: 'Scale AI', marketRank: 12 },
            { name: 'Cohere', marketRank: 13 },
            { name: 'Midjourney', marketRank: 14 },
            { name: 'Perplexity AI', marketRank: 15 }
        ];
    }

    private getMockTopics(watchlist: string[]): ResearchTopic[] {
        const companies = watchlist.slice(0, 5);
        return [
            {
                topic: `${companies[0] || 'OpenAI'} launches GPT-5 preview for developers`,
                sourceUrl: "https://openai.com/blog",
                newsDate: new Date().toISOString().split('T')[0],
                trendScore: 98,
                confidence: 95
            },
            {
                topic: `${companies[1] || 'NVIDIA'} announces new Blackwell Ultra GPUs`,
                sourceUrl: "https://nvidianews.nvidia.com",
                newsDate: new Date().toISOString().split('T')[0],
                trendScore: 94,
                confidence: 99
            },
            {
                topic: `${companies[2] || 'Anthropic'} Claude 4 achieves state-of-the-art on reasoning benchmarks`,
                sourceUrl: "https://www.anthropic.com/news",
                newsDate: new Date().toISOString().split('T')[0],
                trendScore: 91,
                confidence: 92
            },
            {
                topic: `${companies[3] || 'Microsoft'} integrates Agentic Workflows into Excel`,
                sourceUrl: "https://blogs.microsoft.com",
                newsDate: new Date().toISOString().split('T')[0],
                trendScore: 88,
                confidence: 96
            },
            {
                topic: `${companies[4] || 'Google'} DeepMind releases AlphaCode 3`,
                sourceUrl: "https://deepmind.google/blog",
                newsDate: new Date().toISOString().split('T')[0],
                trendScore: 92,
                confidence: 94
            }
        ];
    }
}
