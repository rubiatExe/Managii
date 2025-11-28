"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, CheckCircle, FileText, Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Resume {
    id: string;
    name: string;
    fileName: string | null;
    isMaster: boolean;
    createdAt: string;
}

export function ResumeManager() {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [uploading, setUploading] = useState(false);
    const [skillsContext, setSkillsContext] = useState<string>("");
    const [savingContext, setSavingContext] = useState(false);

    useEffect(() => {
        fetchResumes();
        fetchSkillsContext();
    }, []);

    const fetchResumes = async () => {
        const res = await fetch("/api/resumes");
        const data = await res.json();
        if (data.success) {
            setResumes(data.resumes);
        }
    };

    const fetchSkillsContext = async () => {
        const res = await fetch("/api/resumes");
        const data = await res.json();
        if (data.success) {
            const masterResume = data.resumes.find((r: any) => r.isMaster);
            if (masterResume?.skillsContext) {
                setSkillsContext(masterResume.skillsContext);
            }
        }
    };

    const handleSaveSkillsContext = async () => {
        setSavingContext(true);
        try {
            const res = await fetch("/api/resume", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    skillsContext
                }),
            });
            const data = await res.json();
            if (data.success) {
                alert("✅ Skills context saved successfully!");
            } else {
                alert("Failed to save skills context: " + data.error);
            }
        } catch (error) {
            alert("Error saving skills context");
        } finally {
            setSavingContext(false);
        }
    };

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUploading(true);

        try {
            const formElement = e.currentTarget;
            const formData = new FormData(formElement);
            const file = formData.get('file') as File;
            const name = formData.get('name') as string;

            // Check file size (limit to 4MB for Vercel Serverless)
            if (file && file.size > 4 * 1024 * 1024) {
                alert("File is too large. Maximum size is 4MB.");
                setUploading(false);
                return;
            }

            // We will handle PDF parsing on the server side now
            // just pass the file directly

            // Send extracted text to API
            const uploadData = new FormData();
            uploadData.append('name', name);
            uploadData.append('file', file); // Send the file object
            // uploadData.append('content', textContent); // No longer sending extracted text
            uploadData.append('fileName', file.name);
            uploadData.append('fileType', file.type);

            const res = await fetch("/api/resumes", {
                method: "POST",
                body: uploadData,
            });

            if (res.ok) {
                fetchResumes();
                formElement.reset();
                alert("✅ Resume uploaded successfully!");
            } else {
                // Handle non-JSON errors (like 413 Payload Too Large which returns HTML)
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const data = await res.json();
                    const errorMessage = data.details
                        ? `${data.error}\n\nDetails: ${data.details}\n\n${data.suggestion || ''}`
                        : data.error || "Upload failed";
                    alert(`❌ Upload Failed:\n\n${errorMessage}`);
                } else {
                    const text = await res.text();
                    if (res.status === 413) {
                        alert("File is too large (Max 4MB)");
                    } else {
                        console.error("Server error:", text);
                        alert(`Upload failed (Status ${res.status})`);
                    }
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert("Error uploading resume: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setUploading(false);
        }
    };

    const handleSelect = async (id: string) => {
        try {
            const res = await fetch(`/api/resumes/${id}`, {
                method: "PUT",
            });
            if (res.ok) {
                fetchResumes();
            }
        } catch (error) {
            alert("Error selecting resume");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this resume?")) return;
        try {
            const res = await fetch(`/api/resumes/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchResumes();
            }
        } catch (error) {
            alert("Error deleting resume");
        }
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Upload New Resume</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpload} className="flex items-end gap-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="name">Resume Name</Label>
                            <Input type="text" id="name" name="name" placeholder="e.g. Software Engineer 2024" required />
                        </div>
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="file">File (PDF or Text)</Label>
                            <Input type="file" id="file" name="file" accept=".pdf,.txt,.md" required />
                        </div>
                        <Button type="submit" disabled={uploading}>
                            {uploading ? "Uploading..." : <><Upload className="mr-2 h-4 w-4" /> Upload</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Skills Context Section */}
            <Card>
                <CardHeader>
                    <CardTitle>📝 Skills Context (Optional)</CardTitle>
                    <p className="text-sm text-gray-600 mt-2">
                        Add technologies and skills you've used but may not be explicitly mentioned in your resume.
                        This helps AI tailor your resume more accurately.
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Textarea
                            placeholder="Example:
- Prisma ORM, Google Gemini API, LaTeX (Managify project)
- Redux, Electron, Mantine (Stealth Startup)
- Android Architecture Components, Espresso, JUnit (Save Tuba)
- Price prediction ML, data visualization (WanderWise)"
                            value={skillsContext}
                            onChange={(e) => setSkillsContext(e.target.value)}
                            rows={8}
                            className="font-mono text-sm"
                        />
                        <Button
                            onClick={handleSaveSkillsContext}
                            disabled={savingContext}
                            className="w-full sm:w-auto"
                        >
                            {savingContext ? "Saving..." : "Save Skills Context"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4">
                {resumes.map((resume) => (
                    <Card key={resume.id} className={resume.isMaster ? "border-green-500 bg-green-50/50" : ""}>
                        <CardContent className="flex items-center justify-between p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-muted rounded-full">
                                    <FileText className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        {resume.name}
                                        {resume.isMaster && <Badge className="bg-green-600">Active</Badge>}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {resume.fileName || "Pasted Content"} • Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {!resume.isMaster && (
                                    <Button variant="outline" size="sm" onClick={() => handleSelect(resume.id)}>
                                        Select as Master
                                    </Button>
                                )}
                                {resume.isMaster && (
                                    <div className="flex items-center text-green-600 text-sm font-medium mr-4">
                                        <CheckCircle className="mr-1 h-4 w-4" /> Selected
                                    </div>
                                )}
                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(resume.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {resumes.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                        No resumes uploaded yet.
                    </div>
                )}
            </div>
        </div>
    );
}
