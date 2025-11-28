import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import getServerSession from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

        const { id } = await params;

        // Verify ownership
        const existingResume = await prisma.resume.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!existingResume) {
            return NextResponse.json({ success: false, error: "Resume not found or unauthorized" }, { status: 404 });
        }

        // Get the current master's skillsContext before changing
        const currentMaster = await prisma.resume.findFirst({
            where: {
                userId,
                isMaster: true
            },
            select: { skillsContext: true }
        });

        // Transaction to update all others to false and this one to true
        // CRITICAL: Ensure we only touch resumes belonging to this user
        // AND preserve the skillsContext from the old master
        await prisma.$transaction([
            prisma.resume.updateMany({
                where: {
                    userId,
                    id: { not: id }
                },
                data: { isMaster: false }
            }),
            prisma.resume.update({
                where: { id },
                data: {
                    isMaster: true,
                    // Preserve skillsContext from old master if the new one doesn't have it
                    skillsContext: existingResume.skillsContext || currentMaster?.skillsContext || null
                }
            })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error selecting resume:", error);
        return NextResponse.json({ success: false, error: "Failed to select resume" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

        const { id } = await params;

        const result = await prisma.resume.deleteMany({
            where: {
                id,
                userId
            }
        });

        if (result.count === 0) {
            return NextResponse.json({ success: false, error: "Resume not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting resume:", error);
        return NextResponse.json({ success: false, error: "Failed to delete resume" }, { status: 500 });
    }
}
