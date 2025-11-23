"use client";

import { JobTable } from "@/components/JobTable";

interface DashboardContentProps {
    jobs: any[];
}

export function DashboardContent({ jobs }: DashboardContentProps) {
    return (
        <main className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
            </div>

            <div className="rounded-md border p-4">
                <JobTable jobs={jobs} />
            </div>
        </main>
    );
}
