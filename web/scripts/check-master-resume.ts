import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const resumes = await prisma.resume.findMany({
            where: { isMaster: true }
        });

        console.log(`Found ${resumes.length} MASTER resumes.`);

        for (const r of resumes) {
            console.log("---------------------------------------------------");
            console.log(`ID: ${r.id}`);
            console.log(`Name: ${r.name}`);
            console.log(`Content Length: ${r.content ? r.content.length : 0}`);

            const content = r.content || "";
            console.log(`Ends with .pdf: ${content.trim().endsWith(".pdf")}`);
            console.log(`Last 50 chars: "${content.slice(-50)}"`);

            if (!content || content.length < 50 || content.trim().endsWith(".pdf")) {
                console.warn("⚠️  INVALID CONTENT (Fails gemini.ts check)");
            } else {
                console.log("✅  Content looks valid");
            }
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
