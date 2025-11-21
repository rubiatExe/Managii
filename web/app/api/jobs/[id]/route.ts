import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;

        await prisma.job.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting job:", error);
        return NextResponse.json({ success: false, error: "Failed to delete job" }, { status: 500 });
    }
}


export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;

        const job = await prisma.job.findUnique({
            where: { id }
        });

        if (!job) {
            return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, job });
    } catch (error) {
        console.error("Error fetching job:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch job" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const job = await prisma.job.update({
            where: { id },
            data: body
        });

        return NextResponse.json({ success: true, job });
    } catch (error) {
        console.error("Error updating job:", error);
        return NextResponse.json({ success: false, error: "Failed to update job" }, { status: 500 });
    }
}
