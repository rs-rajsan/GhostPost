import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';

interface EnhanceRequest {
    text: string;
    inputType: 'text' | 'article' | 'topic';
    mode?: 'post' | 'article';
    targetPages?: number;
    deepResearch?: boolean;
    requestId?: string;
    tone?: string;
}

export interface ToneResponse {
    title: string;
    enhancedPost: string;
    hookScore: number;
    hookTip: string;
    confidenceScore: number;
    hashtags: string[];
    visualSuggestion?: string;
}

export type EnhanceResponse = Record<'Professional' | 'Conversational' | 'Storytelling' | 'Bold/Contrarian', ToneResponse>;

export const useEnhance = () => {
    return useMutation({
        mutationFn: async (data: EnhanceRequest) => {
            const response = await api.post<EnhanceResponse>('/enhance', data);
            return response.data;
        },
    });
};

export interface GenerateHookRequest {
    text: string;
    tone: string;
    hookTip: string;
}

export const useGenerateHook = () => {
    return useMutation({
        mutationFn: async (data: GenerateHookRequest) => {
            const response = await api.post<{ hook: string }>('/enhance/generate-hook', data);
            return response.data;
        },
    });
};
