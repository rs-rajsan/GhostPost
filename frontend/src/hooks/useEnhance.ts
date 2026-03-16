import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';

interface EnhanceRequest {
    text: string;
    inputType: 'text' | 'article' | 'youtube';
    mode?: 'post' | 'article';
    targetPages?: number;
    deepResearch?: boolean;
}

export interface ToneResponse {
    enhancedPost: string;
    hookScore: number;
    hookTip: string;
    hashtags: string[];
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
