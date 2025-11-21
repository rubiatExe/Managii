"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast";
// Actually shadcn usually adds a toast component if requested, but I didn't request it.
// I'll stick to simple alert or console for now to avoid missing dependency issues, or check if I can add it.
// I'll just use a simple state for status.

export function ResumeForm({ initialContent }: { initialContent: string }) {
    const [content, setContent] = useState(initialContent);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSave = async () => {
        setLoading(true);
        setMessage("");
        try {
            const res = await fetch("/api/resume", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });

            if (res.ok) {
                setMessage("Resume saved successfully!");
            } else {
                setMessage("Failed to save resume.");
            }
        } catch (e) {
            setMessage("Error saving resume.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Paste the text content of your master resume here. The AI will use this to analyze job fit and generate tailored resumes.
            </p>
            <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your resume text here..."
                className="min-h-[400px] font-mono text-sm"
            />
            <div className="flex items-center justify-between">
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? "Saving..." : "Save Master Resume"}
                </Button>
                {message && <span className="text-sm font-medium">{message}</span>}
            </div>
        </div>
    );
}
