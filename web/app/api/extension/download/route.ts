import { NextResponse } from 'next/server';
import archiver from 'archiver';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs';

export async function GET() {
    try {
        // Path to the extension folder (go up from web to root, then to extension)
        const extensionPath = path.join(process.cwd(), '..', 'extension');

        // Check if extension folder exists
        if (!fs.existsSync(extensionPath)) {
            return NextResponse.json({ error: 'Extension folder not found' }, { status: 404 });
        }

        // Create a zip archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        // Add all files from extension folder
        archive.directory(extensionPath, 'managify-extension');

        // Convert archive to buffer
        const chunks: Buffer[] = [];
        archive.on('data', (chunk: Buffer) => chunks.push(chunk));

        await new Promise((resolve, reject) => {
            archive.on('end', resolve);
            archive.on('error', reject);
            archive.finalize();
        });

        const buffer = Buffer.concat(chunks);

        // Return the zip file
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': 'attachment; filename="managify-extension.zip"',
            },
        });
    } catch (error: any) {
        console.error('Error creating extension zip:', error);
        return NextResponse.json({
            error: 'Failed to create extension package',
            details: error.message
        }, { status: 500 });
    }
}
