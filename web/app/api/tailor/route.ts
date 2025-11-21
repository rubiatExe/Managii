import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { tailorResume } from '@/lib/gemini';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { jobId, recommendations } = body;

        if (!jobId) {
            return NextResponse.json({ success: false, error: "Job ID is required" }, { status: 400 });
        }

        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job) {
            return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
        }

        const resume = await prisma.resume.findFirst({ where: { isMaster: true } });
        if (!resume) {
            return NextResponse.json({ success: false, error: "No master resume found." }, { status: 400 });
        }

        // specific recommendations or just general tailoring
        const recs = recommendations || (job.analysis ? JSON.parse(job.analysis).recommendations : []);

        const tailoredContent = await tailorResume(job.description, resume.content, recs);

        return NextResponse.json({ success: true, tailoredContent });
    } catch (error) {
        console.error("Error tailoring resume:", error);
        return NextResponse.json({ success: false, error: "Failed to tailor resume" }, { status: 500 });
    }
}
