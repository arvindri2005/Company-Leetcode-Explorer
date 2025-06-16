import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const requestData = await request.json();
        const { path, token } = requestData;

        // Check for valid token (you should set this in your environment variables)
        const expectedToken = process.env.REVALIDATION_TOKEN;
        if (!expectedToken || token !== expectedToken) {
            return NextResponse.json(
                { message: "Invalid token" },
                { status: 401 }
            );
        }

        // Revalidate the specific path
        revalidatePath(path);

        return NextResponse.json({ revalidated: true, now: Date.now() });
    } catch (err) {
        return NextResponse.json(
            { message: "Error revalidating" },
            { status: 500 }
        );
    }
}
