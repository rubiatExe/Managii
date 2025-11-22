import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const name = formData.get('name') as string;
        const content = formData.get('content') as string;
        const fileName = formData.get('fileName') as string;
        const fileType = formData.get('fileType') as string;

        if (!name || !content) {
            return NextResponse.json({ success: false, error: "Name and content are required" }, { status: 400 });
        }

        // Check if this is the first resume, if so make it master
        const count = await prisma.resume.count();
        const isMaster = count === 0;

        const resume = await prisma.resume.create({
            data: {
                name,
                fileName,
                fileType,
                content,
                isMaster
            }
        });

        return NextResponse.json({ success: true, resume });
    } catch (error: any) {
        console.error("Error uploading resume:", error);
        // Log specific error details
        if (error.message) console.error("Error message:", error.message);
        if (error.stack) console.error("Error stack:", error.stack);

        return NextResponse.json({
            success: false,
            error: "Failed to upload resume: " + (error.message || "Unknown error")
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        const resumes = await prisma.resume.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ success: true, resumes });
    } catch (error) {
        console.error("Error fetching resumes:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch resumes" }, { status: 500 });
    }
}
