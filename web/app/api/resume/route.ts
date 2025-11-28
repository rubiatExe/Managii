import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import getServerSession from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
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

        const body = await request.json();
        const { content, skillsContext } = body;

        if (!content && !skillsContext) {
            return NextResponse.json({ success: false, error: "Content or skillsContext is required" }, { status: 400 });
        }

        // Upsert the master resume for this user
        const existing = await prisma.resume.findFirst({
            where: {
                userId,
                isMaster: true
            }
        });

        if (existing) {
            const updateData: any = {
                skillsContext: skillsContext || null
            };
            if (content) {
                updateData.content = content;
            }

            await prisma.resume.update({
                where: { id: existing.id },
                data: updateData
            });
        } else {
            if (!content) {
                return NextResponse.json({ success: false, error: "Content is required for creating a new resume" }, { status: 400 });
            }
            await prisma.resume.create({
                data: {
                    userId,
                    name: "Master Resume",
                    content,
                    skillsContext: skillsContext || null,
                    isMaster: true
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving resume:", error);
        return NextResponse.json({ success: false, error: "Failed to save resume" }, { status: 500 });
    }
}
