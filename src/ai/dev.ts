
import { config } from 'dotenv';
config();

import '@/ai/flows/group-questions.ts';
import '@/ai/flows/find-similar-questions-flow.ts';
import '@/ai/flows/mock-interview-flow.ts';
import '@/ai/flows/generate-flashcards-flow.ts';
import '@/ai/flows/generate-company-strategy-flow.ts';
import '@/ai/flows/generate-problem-insights-flow.ts'; // Added new flow
