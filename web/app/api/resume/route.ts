import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { content } = body;

        if (!content) {
            return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 });
        }

        // Upsert the master resume
        // Since we don't have a user system yet, we assume one master resume for the single user
        const existing = await prisma.resume.findFirst({ where: { isMaster: true } });

        if (existing) {
            await prisma.resume.update({
                where: { id: existing.id },
                data: { content }
            });
        } else {
            await prisma.resume.create({
                data: {
                    name: "Master Resume",
                    content,
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
