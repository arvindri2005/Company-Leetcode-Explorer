/**
 * @fileoverview Defines the API route for on-demand cache revalidation.
 *
 * This file contains a Next.js API route handler that allows for the invalidation
 * of the cache for a specific path (or cache tag). It's a secure endpoint that
 * requires a secret token for authorization, typically triggered by an admin action
 * or a webhook after data has been updated.
 */
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Handles POST requests to revalidate the cache for a given path.
 *
 * This function expects a JSON body with a `path` to revalidate and a `token` for
 * authentication. It validates the token against an environment variable. If valid,
 * it calls Next.js's `revalidatePath` function to purge the cache for that path.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} A response indicating whether the revalidation
 * was successful, or an error response if the token is invalid or an issue occurs.
 */
export async function POST(request: NextRequest) {
    try {
        const requestData = await request.json();
        const { path, token } = requestData;

        // Check for valid token (you should set this in your environment variables)
        const expectedToken = process.env.REVALIDATION_TOKEN;
        if (!expectedToken || token !== expectedToken) {
            return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
        }

        // Revalidate the specific path
        revalidatePath(path);

        return NextResponse.json({ revalidated: true, now: Date.now() });
    } catch (err) {
        return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
    }
}
