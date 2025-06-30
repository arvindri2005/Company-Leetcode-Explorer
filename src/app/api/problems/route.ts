
import { NextResponse } from 'next/server';
import { getProblemsByCompanyFromDb } from '@/lib/data';
import { z } from 'zod';

const problemRequestSchema = z.object({
  companyId: z.string(),
  cursor: z.string().optional(),
  pageSize: z.number().min(1).max(50).default(15),
  filters: z.object({
    difficultyFilter: z.string().optional(),
    lastAskedFilter: z.string().optional(),
    statusFilter: z.string().optional(),
    searchTerm: z.string().optional(),
    sortKey: z.string().optional(),
  }).optional(),
  userId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedRequest = problemRequestSchema.safeParse(body);

    if (!parsedRequest.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsedRequest.error.format() }, { status: 400 });
    }

    const { companyId, cursor, pageSize, filters, userId } = parsedRequest.data;

    const result = await getProblemsByCompanyFromDb(companyId, {
      cursor,
      pageSize,
      filters,
      userId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/problems:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch problems', details: errorMessage }, { status: 500 });
  }
}
