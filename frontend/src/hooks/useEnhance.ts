import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';

interface EnhanceRequest {
    text: string;
    tone: string;
}

interface EnhanceResponse {
    enhancedPost: string;
    hookScore: number;
    hookTip: string;
    hashtags: string[];
}

export const useEnhance = () => {
    return useMutation({
        mutationFn: async (data: EnhanceRequest) => {
            const response = await api.post<EnhanceResponse>('/enhance', data);
            return response.data;
        },
    });
};
