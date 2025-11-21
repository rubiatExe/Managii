import { JobTable } from "@/components/JobTable";
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

  return (
    <main className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Managify Dashboard</h1>
      </div>

      <div className="rounded-md border p-4">
        <JobTable jobs={serializedJobs} />
      </div>
    </main>
  );
}
