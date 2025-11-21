import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, company, description, url } = body;

        // Basic validation
        if (!title || !url) {
            return NextResponse.json({ success: false, error: "Title and URL are required" }, { status: 400 });
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
            }, { status: 409 });
        }

        const job = await prisma.job.create({
            data: {
                title,
                company: company || "Unknown",
                description: description || "",
                url,
                status: "Applied",
            },
        });

        return NextResponse.json({ success: true, job });
    } catch (error) {
        console.error("Error saving job:", error);
        return NextResponse.json({ success: false, error: "Failed to save job" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const jobs = await prisma.job.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ success: true, jobs });
    } catch (error) {
        console.error("Error fetching jobs:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch jobs" }, { status: 500 });
    }
}
