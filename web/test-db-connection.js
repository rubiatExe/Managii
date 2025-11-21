
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.$connect();
        console.log('Successfully connected to the database');
        const jobCount = await prisma.job.count();
        console.log(`Found ${jobCount} jobs in the database`);
    } catch (e) {
        console.error('Error connecting to database:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
