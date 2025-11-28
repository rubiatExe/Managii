import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import pdf from 'pdf-parse';
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
                console.warn("⚠️ Unauthenticated request to POST /api/resumes. Using default user:", defaultUser.id);
                userId = defaultUser.id;
            }
        }

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const name = formData.get('name') as string;
        const file = formData.get('file') as File;
        const fileName = formData.get('fileName') as string;
        const fileType = formData.get('fileType') as string;

        if (!name || !file) {
            return NextResponse.json({ success: false, error: "Name and file are required" }, { status: 400 });
        }

        let content = '';

        if (fileType === 'application/pdf') {
            try {
                const buffer = Buffer.from(await file.arrayBuffer());
                console.log(`📄 Processing PDF: ${fileName}, Size: ${buffer.length} bytes`);

                const pdfData = await pdf(buffer);
                content = pdfData.text;

                console.log("PDF Parsing Result:");
                console.log("- Text Length:", content.length);
                console.log("- First 100 chars:", content.substring(0, 100));
                console.log("- Last 50 chars:", content.substring(content.length - 50));
                console.log("- PDF Info:", JSON.stringify(pdfData.info));
                console.log("- Number of pages:", pdfData.numpages);

            } catch (pdfError) {
                console.error("PDF Parsing failed:", pdfError);
                return NextResponse.json({
                    success: false,
                    error: "Failed to parse PDF file. The PDF might be corrupted or protected.",
                    details: pdfError instanceof Error ? pdfError.message : "Unknown error"
                }, { status: 400 });
            }
        } else {
            content = await file.text();
            console.log(`📝 Processing text file: ${fileName}, Length: ${content.length}`);
        }

        // Validation: Ensure content was actually extracted and is not just the filename
        const isFilename = content.trim() === fileName || content.trim().endsWith(".pdf");
        const isTooShort = content.trim().length < 50;

        if (!content || isTooShort || isFilename) {
            console.error("❌ Invalid content extracted:", {
                length: content?.length,
                isFilename,
                isTooShort,
                preview: content?.substring(0, 100)
            });

            return NextResponse.json({
                success: false,
                error: "Failed to extract valid text from resume.",
                details: `Extracted only ${content?.length} characters. Content preview: "${content?.substring(0, 50)}..."`,
                suggestion: isFilename
                    ? "The PDF appears to only contain the filename. Please ensure your PDF is text-based (not a scanned image)."
                    : "The extracted text is too short. Try exporting your resume as a new PDF or use a .txt file."
            }, { status: 400 });
        }

        // Check if this is the first resume for THIS user
        const count = await prisma.resume.count({
            where: { userId }
        });
        const isMaster = count === 0;

        const resume = await prisma.resume.create({
            data: {
                userId,
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

        const resumes = await prisma.resume.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ success: true, resumes });
    } catch (error) {
        console.error("Error fetching resumes:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch resumes" }, { status: 500 });
    }
}
