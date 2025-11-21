import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const isRelevant = searchParams.get('isRelevant');

        const where: any = {};
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
