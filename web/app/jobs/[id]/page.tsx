"use client";
import { useEffect, useState } from "react";
import prisma from "@/lib/prisma"; // not used client side, keep for type only
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { JobAnalysis } from "@/components/JobAnalysis";

interface Job {
    id: string;
    title: string;
    company: string;
    description: string;
    status: string;
    url: string;
    fitScore: number | null;
    analysis: string | null;
}

interface JobPageProps {
    params: { id: string };
}

export default function JobPage({ params }: JobPageProps) {
    const { id } = params;
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchJob = async () => {
        try {
            const res = await fetch(`/api/jobs?id=${id}`);
            const data = await res.json();
            if (data.success && data.job) {
                setJob(data.job);
            } else {
                console.error("Failed to fetch job", data);
            }
        } catch (e) {
            console.error("Error fetching job", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJob();
        const interval = setInterval(fetchJob, 5000); // refresh every 5 seconds
        return () => clearInterval(interval);
    }, [id]);

    if (loading) {
        return <div className="container mx-auto py-10">Loading...</div>;
    }

    if (!job) {
        notFound();
        return null;
    }

    return (
        <main className="container mx-auto py-10">
            <div className="mb-6">
                <Link href="/" className="text-sm text-muted-foreground hover:underline">
                    &larr; Back to Dashboard
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold">{job.title}</h1>
                            <p className="text-xl text-muted-foreground">{job.company}</p>
                        </div>
                        <Badge className="text-lg px-4 py-1">{job.status}</Badge>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Job Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                {job.description}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <JobAnalysis jobId={job.id} initialAnalysis={job.analysis} fitScore={job.fitScore} />

                    <Card>
                        <CardContent className="pt-6">
                            <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm block text-center">
                                View Original Posting &rarr;
                            </a>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
