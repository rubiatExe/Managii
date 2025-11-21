import { ResumeManager } from "@/components/ResumeManager";

export const dynamic = 'force-dynamic';

export default function ResumePage() {
    return (
        <main className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6">Manage Master Resumes</h1>
            <div className="max-w-4xl">
                <ResumeManager />
            </div>
        </main>
    );
}
