import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
    try {
        console.log("🧹 Cleaning database...");

        // Delete all jobs (this will cascade delete analyses and generated resumes)
        const deletedJobs = await prisma.job.deleteMany({});
        console.log(`✅ Deleted ${deletedJobs.count} jobs`);

        // Delete all resumes
        const deletedResumes = await prisma.resume.deleteMany({});
        console.log(`✅ Deleted ${deletedResumes.count} resumes`);

        console.log("\n✨ Database reset complete! You can now:");
        console.log("1. Upload your resume again");
        console.log("2. Add a job and analyze it");
        console.log("3. Generate a tailored resume with all the fixes");

    } catch (error) {
        console.error("Error resetting database:", error);
    } finally {
        await prisma.$disconnect();
    }
}

resetDatabase();
