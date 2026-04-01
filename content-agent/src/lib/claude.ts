import { anthropic } from '@ai-sdk/anthropic';

export { anthropic };

export const MODEL = 'claude-sonnet-4-20250514' as const;

// Modelo pronto para passar direto ao streamText
export const claude = anthropic(MODEL);
