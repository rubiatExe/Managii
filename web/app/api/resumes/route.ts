import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Use pdfjs-dist for server-side parsing
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Critical fix for Next.js/Vercel: Set worker to dummy to prevent file load error
// This forces it to run in the main thread or use the fake worker without external file
pdfjsLib.GlobalWorkerOptions.workerSrc = 'data:application/javascript;base64,';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const name = formData.get('name') as string;
        const file = formData.get('file') as File;

        let content = formData.get('content') as string; // Fallback if content is sent directly
        let fileName = formData.get('fileName') as string;
        let fileType = formData.get('fileType') as string;

        // If a file is uploaded, parse it
        if (file && file instanceof File) {
            fileName = file.name;
            fileType = file.type;

            const arrayBuffer = await file.arrayBuffer();

            if (file.type === 'application/pdf') {
                try {
                    // Load the PDF document
                    const loadingTask = pdfjsLib.getDocument({
                        data: new Uint8Array(arrayBuffer),
                        useSystemFonts: true,
                        disableFontFace: true
                    });

                    const pdf = await loadingTask.promise;
                    let fullText = '';

                    // Extract text from all pages
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items
                            .map((item: any) => item.str)
                            .join(' ');
                        fullText += pageText + '\n';
                    }

                    content = fullText;
                } catch (e: any) {
                    console.error("PDF parse error:", e);
                    return NextResponse.json({
                        success: false,
                        error: "Failed to parse PDF file: " + (e.message || "Unknown error")
                    }, { status: 400 });
                }
            } else {
                // Assume text/markdown
                content = Buffer.from(arrayBuffer).toString('utf-8');
            }
        }

        if (!name || !content) {
            return NextResponse.json({ success: false, error: "Name and content (or valid file) are required" }, { status: 400 });
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
