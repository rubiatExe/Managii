import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;

        // Transaction to update all others to false and this one to true
        await prisma.$transaction([
            prisma.resume.updateMany({
                where: { id: { not: id } },
                data: { isMaster: false }
            }),
            prisma.resume.update({
                where: { id },
                data: { isMaster: true }
            })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error selecting resume:", error);
        return NextResponse.json({ success: false, error: "Failed to select resume" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        await prisma.resume.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting resume:", error);
        return NextResponse.json({ success: false, error: "Failed to delete resume" }, { status: 500 });
    }
}
