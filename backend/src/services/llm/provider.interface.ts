export interface LLMOptions {
    maxTokens?: number;
    responseFormat?: 'json_object' | 'text';
    temperature?: number;
}

export interface PromptPayload {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMProvider {
    getName(): string;
    generateText(payload: PromptPayload[], options?: LLMOptions): Promise<string>;
}
