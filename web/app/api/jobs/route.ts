import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import getServerSession from "next-auth";
import { authOptions } from "@/lib/auth";
// CORS headers for Chrome extension
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
    try {
        let userId: string | undefined;
        const session = await getServerSession(authOptions) as any;

        if (session?.user?.id) {
            userId = session.user.id;
        } else {
            // Fallback to default user for extension/local dev
            const defaultUser = await prisma.user.findFirst();
            if (defaultUser) {
                console.warn("⚠️ Unauthenticated request to POST /api/jobs. Using default user:", defaultUser.id);
                userId = defaultUser.id;
            }
        }

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { title, company, description, url, location, category, isRelevant } = body;

        // Basic validation
        if (!title || !url) {
            return NextResponse.json({ success: false, error: "Title and URL are required" }, {
                status: 400,
                headers: corsHeaders
            });
        }

        // Check for duplicate URL
        const existingJob = await prisma.job.findFirst({
            where: { url }
        });

        if (existingJob) {
            return NextResponse.json({
                success: false,
                error: "Job already exists with this URL",
                duplicate: true
            }, {
                status: 409,
                headers: corsHeaders
            });
        }

        const job = await prisma.job.create({
            data: {
                userId,
                title,
                company: company || "Unknown",
                description: description || "",
                url,
                location: location || null,
                category: category || null,
                isRelevant: isRelevant !== undefined ? isRelevant : true,
                status: "Applied",
            },
        });

        return NextResponse.json({ success: true, job }, { headers: corsHeaders });
    } catch (error) {
        console.error("Error saving job:", error);
        return NextResponse.json({ success: false, error: "Failed to save job" }, {
            status: 500,
            headers: corsHeaders
        });
    }
}

export async function GET(request: Request) {
    try {
        let userId: string | undefined;
        const session = await getServerSession(authOptions) as any;

        if (session?.user?.id) {
            userId = session.user.id;
        } else {
            // Fallback to default user
            const defaultUser = await prisma.user.findFirst();
            if (defaultUser) {
                userId = defaultUser.id;
            }
        }

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const isRelevant = searchParams.get('isRelevant');

        const where: any = {
            userId // Filter by user
        };
        if (category) where.category = category;
        if (isRelevant !== null) where.isRelevant = isRelevant === 'true';

        const jobs = await prisma.job.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ success: true, jobs }, { headers: corsHeaders });
    } catch (error) {
        console.error("Error fetching jobs:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch jobs" }, {
            status: 500,
            headers: corsHeaders
        });
    }
}
