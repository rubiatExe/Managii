import { DashboardContent } from "@/components/DashboardContent";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Serialize dates to strings for Client Component
  const serializedJobs = jobs.map(job => ({
    ...job,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  }));

  return <DashboardContent jobs={serializedJobs} />;
}
