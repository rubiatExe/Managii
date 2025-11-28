import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // 1. Find broken master resumes (empty or filename-only)
        const brokenResumes = await prisma.resume.findMany({
            where: {
                OR: [
                    { content: { equals: "" } },
                    { content: { endsWith: ".pdf" } }
                ]
            },
        });

        console.log(`Found ${brokenResumes.length} broken resumes.`);

        for (const r of brokenResumes) {
            console.log(`Deleting broken resume: ${r.id} (${r.name}) - Content: "${r.content?.slice(0, 20)}..."`);
            await prisma.resume.delete({ where: { id: r.id } });
        }

        // 2. Check if we have a master now
        const currentMaster = await prisma.resume.findFirst({
            where: { isMaster: true }
        });

        if (!currentMaster) {
            console.log("No master resume currently selected. Promoting the latest valid one...");

            // Find latest valid resume
            const latestValid = await prisma.resume.findFirst({
                where: {
                    NOT: {
                        content: { equals: "" } // Ensure not empty
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            if (latestValid && latestValid.content && latestValid.content.length > 50) {
                await prisma.resume.update({
                    where: { id: latestValid.id },
                    data: { isMaster: true }
                });
                console.log(`✅ Promoted "${latestValid.name}" (ID: ${latestValid.id}) to MASTER.`);
            } else {
                console.warn("⚠️ No valid resumes found to promote.");
            }
        } else {
            console.log(`Current master is: "${currentMaster.name}"`);
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
