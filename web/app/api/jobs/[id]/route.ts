import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import getServerSession from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        let userId: string | undefined;
        const session = await getServerSession(authOptions) as any;

        if (session?.user?.id) {
            userId = session.user.id;
        } else {
            const defaultUser = await prisma.user.findFirst();
            if (defaultUser) {
                userId = defaultUser.id;
            }
        }

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const result = await prisma.job.deleteMany({
            where: {
                id,
                userId
            }
        });

        if (result.count === 0) {
            return NextResponse.json({ success: false, error: "Job not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting job:", error);
        return NextResponse.json({ success: false, error: "Failed to delete job" }, { status: 500 });
    }
}


export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        let userId: string | undefined;
        const session = await getServerSession(authOptions) as any;

        if (session?.user?.id) {
            userId = session.user.id;
        } else {
            const defaultUser = await prisma.user.findFirst();
            if (defaultUser) {
                userId = defaultUser.id;
            }
        }

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const job = await prisma.job.findFirst({
            where: {
                id,
                userId
            }
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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        let userId: string | undefined;
        const session = await getServerSession(authOptions) as any;

        if (session?.user?.id) {
            userId = session.user.id;
        } else {
            const defaultUser = await prisma.user.findFirst();
            if (defaultUser) {
                userId = defaultUser.id;
            }
        }

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // Verify ownership before update
        const existingJob = await prisma.job.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!existingJob) {
            return NextResponse.json({ success: false, error: "Job not found or unauthorized" }, { status: 404 });
        }

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
