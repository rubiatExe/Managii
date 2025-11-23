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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold tracking-tight">Managify Dashboard</h1>
        <a
          href="/api/extension/download"
          download="managify-extension.zip"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 0 112 0v7.586l1.293-1.293a1 0 111.414 1.414l-3 3a1 0 01-1.414 0l-3-3a1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Download Chrome Extension
        </a>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">📥 How to Install</h3>
        <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
          <li>Click &quot;Download Chrome Extension&quot; button above</li>
          <li>Extract the ZIP file to a folder on your computer</li>
          <li>Open Chrome and go to <code className="bg-blue-100 px-1 rounded">chrome://extensions/</code></li>
          <li>Enable &quot;Developer mode&quot; (toggle in top-right)</li>
          <li>Click &quot;Load unpacked&quot; and select the extracted folder</li>
          <li>Pin the extension to your toolbar and start saving jobs!</li>
        </ol>
      </div>

      <div className="rounded-md border p-4">
        <JobTable jobs={serializedJobs} />
      </div>
    </main>
  );
}
