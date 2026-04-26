import { Request, Response } from 'express';
import { prisma } from '../db';
import { asyncHandler } from '../utils/asyncHandler';
import * as llmService from '../services/llm.service';
import { v4 as uuidv4 } from 'uuid';

export const getPipeline = asyncHandler(async (req: Request, res: Response) => {
    const topics = await (prisma as any).pipelineTopic.findMany({
        where: { deletedAt: null },
        orderBy: { id: 'desc' }
    });
    res.json(topics);
});

export const createPipelineTopic = asyncHandler(async (req: Request, res: Response) => {
    const topic = await (prisma as any).pipelineTopic.create({
        data: req.body
    });
    res.status(201).json(topic);
});

export const bulkCreatePipelineTopic = asyncHandler(async (req: Request, res: Response) => {
    const { topics } = req.body;
    const result = await (prisma as any).pipelineTopic.createMany({
        data: topics,
        skipDuplicates: true
    });
    res.status(201).json(result);
});

export const updatePipelineTopic = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const topic = await (prisma as any).pipelineTopic.update({
        where: { id: parseInt(id) },
        data: req.body
    });
    res.json(topic);
});

export const bulkUpdatePipeline = asyncHandler(async (req: Request, res: Response) => {
    const { updates } = req.body;
    const transactions = updates.map((u: any) => 
        (prisma as any).pipelineTopic.update({
            where: { id: u.key },
            data: u.changes
        })
    );
    await prisma.$transaction(transactions);
    res.json({ success: true });
});

export const bulkDeletePipeline = asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.body;
    await (prisma as any).pipelineTopic.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() }
    });
    res.json({ success: true });
});

export const generatePipelineTopic = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const topic = await (prisma as any).pipelineTopic.findUnique({
        where: { id: parseInt(id) }
    });

    if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
    }

    const requestId = uuidv4();
    const toneMapping: Record<string, string> = {
        'professional': 'Professional',
        'conversational': 'Conversational',
        'story': 'Storytelling',
        'provocative': 'Bold/Contrarian'
    };

    const targetTone = toneMapping[topic.tone.toLowerCase()] || 'Professional';

    const results = await llmService.enhancePost(topic.topic, {
        mode: topic.mode as any,
        targetPages: topic.pages,
        tone: targetTone,
        requestId,
        isTopic: true
    });

    const data = results[targetTone as keyof typeof results];

    const updated = await (prisma as any).pipelineTopic.update({
        where: { id: parseInt(id) },
        data: {
            status: 'generated',
            article: data.enhancedPost,
            hook: data.hook,
            hookScore: data.hookScore,
            confidenceScore: data.confidenceScore,
            generatedAt: new Date()
        }
    });

    res.json(updated);
});
