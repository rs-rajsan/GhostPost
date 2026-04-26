import { Request, Response } from 'express';
import { prisma } from '../db';
import { asyncHandler } from '../utils/asyncHandler';
import { ResearchService } from '../services/research.service';

export const getWatchlist = asyncHandler(async (req: Request, res: Response) => {
    const watchlist = await (prisma as any).watchlist.findMany({
        orderBy: [{ category: 'asc' }, { marketRank: 'asc' }]
    });
    res.json(watchlist);
});

export const refreshWatchlist = asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.body;
    
    if (!category) {
        return res.status(400).json({ error: 'Category is required' });
    }

    const researchService = ResearchService.getInstance();
    const companies = await researchService.findMarketRankings(category);

    // Bulk upsert logic
    const lastUpdate = new Date();
    
    for (const company of companies) {
        await (prisma as any).watchlist.upsert({
            where: { name: company.name },
            update: {
                category,
                marketRank: company.marketRank,
                lastUpdate
            },
            create: {
                name: company.name,
                category,
                marketRank: company.marketRank,
                lastUpdate
            }
        });
    }

    const updatedWatchlist = await (prisma as any).watchlist.findMany({
        where: { category },
        orderBy: { marketRank: 'asc' }
    });

    res.json(updatedWatchlist);
});

export const addToWatchlist = asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.body;
    const item = await (prisma as any).watchlist.create({
        data: { name }
    });
    res.status(201).json(item);
});

export const removeFromWatchlist = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await (prisma as any).watchlist.delete({
        where: { id: parseInt(id) }
    });
    res.json({ success: true });
});

export const bulkAddWatchlist = asyncHandler(async (req: Request, res: Response) => {
    const { items } = req.body;
    await (prisma as any).watchlist.createMany({
        data: items,
        skipDuplicates: true
    });
    res.json({ success: true });
});
