import { Request, Response } from 'express';
import { prisma } from '../db';
import { asyncHandler } from '../utils/asyncHandler';

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
    let settings = await (prisma as any).settings.findUnique({
        where: { id: 'global' }
    });
    
    if (!settings) {
        settings = await (prisma as any).settings.create({
            data: { id: 'global', themeHue: 250, userName: 'Ghost Writer' }
        });
    }
    
    res.json(settings);
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
    const settings = await (prisma as any).settings.upsert({
        where: { id: 'global' },
        update: req.body,
        create: { ...req.body, id: 'global' }
    });
    res.json(settings);
});
