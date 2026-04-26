import { Request, Response } from 'express';
import { ResearchService } from '../services/research.service';

export const researchLatestNews = async (req: Request, res: Response) => {
    try {
        const { watchlist } = req.body;
        
        if (!watchlist || !Array.isArray(watchlist)) {
            return res.status(400).json({ error: 'Watchlist must be an array of company names' });
        }

        const researchService = ResearchService.getInstance();
        const topics = await researchService.findTrendingTopics(watchlist);

        res.json(topics);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
