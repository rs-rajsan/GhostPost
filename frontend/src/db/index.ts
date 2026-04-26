export interface WatchlistCompany {
    id?: number;
    category: string;
    name: string;
    marketRank: number;
    lastUpdate: string;
}

export interface PipelineTopic {
    id?: number;
    topic: string;
    sourceUrl?: string;
    newsDate?: string;
    addedDate: string;
    status: 'draft' | 'approved' | 'denied' | 'generating' | 'generated' | 'posted';
    tone: string;
    mode: 'post' | 'article';
    pages: number;
    article?: string;
    hook?: string;
    hookScore?: number;
    confidenceScore?: number;
    trendScore?: number;
    momentumScores?: {
        linkedin: number;
        twitter: number;
        instagram: number;
        facebook: number;
    };
    approvedAt?: string;
    generatedAt?: string;
    postedAt?: string;
    deletedAt?: string; // For soft delete (30 days)
    isUpdate?: boolean;
}

export interface AppSetting {
    key: string;
    value: any;
}
