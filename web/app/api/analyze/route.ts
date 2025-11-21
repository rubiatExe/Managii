import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { analyzeFit } from '@/lib/gemini';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { jobId } = body;

        if (!jobId) {
            return NextResponse.json({ success: false, error: "Job ID is required" }, { status: 400 });
        }

        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job) {
            return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
        }

        // Get the master resume
        const resume = await prisma.resume.findFirst({ where: { isMaster: true } });
        if (!resume) {
            return NextResponse.json({ success: false, error: "No master resume found. Please upload one first." }, { status: 400 });
        }

        const analysis = await analyzeFit(job.description, resume.content);

        // Update job with analysis
        await prisma.job.update({
            where: { id: jobId },
            data: {
                fitScore: analysis.fitScore,
                analysis: JSON.stringify(analysis)
            }
        });

        return NextResponse.json({ success: true, analysis });
    } catch (error) {
        console.error("Error analyzing job:", error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Analysis failed" }, { status: 500 });
    }
}
