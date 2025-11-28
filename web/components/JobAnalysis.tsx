"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, ArrowRight, PlusCircle, MinusCircle, RefreshCw } from "lucide-react";

interface AnalysisResult {
    fitScore: number;
    recommendation: "APPLY" | "DO NOT APPLY";
    strengths: Array<{ requirement: string; evidence: string }>;
    weaknesses: Array<{ gap: string; analysis: string; mitigation: string }>;
    bulletRecommendations: Array<{
        action: "IMPROVE" | "ADD" | "REMOVE";
        originalText: string | null;
        suggestedText: string | null;
        reason: string;
    }>;
}

interface JobAnalysisProps {
    jobId: string;
    initialAnalysis: string | null;
    fitScore: number | null;
}

export function JobAnalysis({ jobId, initialAnalysis, fitScore }: JobAnalysisProps) {
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(() => {
        if (!initialAnalysis) return null;
        try {
            const parsed = JSON.parse(initialAnalysis);
            // Validate schema (basic check)
            if (
                typeof parsed.fitScore === 'number' &&
                Array.isArray(parsed.strengths) &&
                (Array.isArray(parsed.weaknesses) || Array.isArray(parsed.gaps)) // Handle legacy "gaps"
            ) {
                // Migration for legacy data
                if (parsed.gaps && !parsed.weaknesses) parsed.weaknesses = parsed.gaps;
                if (parsed.optimizedBullets && !parsed.bulletRecommendations) {
                    // Convert old optimized bullets to new format (Improve)
                    parsed.bulletRecommendations = parsed.optimizedBullets.map((b: string) => ({
                        action: "IMPROVE",
                        originalText: null,
                        suggestedText: b,
                        reason: "General optimization"
                    }));
                }
                return parsed as AnalysisResult;
            }
            return null;
        } catch (e) {
            return null;
        }
    });
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId }),
            });
            const data = await res.json();
            if (data.success) {
                setAnalysis(data.analysis);
            } else {
                alert("Analysis failed: " + data.error);
            }
        } catch (e) {
            alert("Error analyzing job");
        } finally {
            setLoading(false);
        }
    };

    const [downloadingLatex, setDownloadingLatex] = useState(false);
    const [projectedFitScore, setProjectedFitScore] = useState<number | null>(null);

    const handleDownloadLatex = async () => {
        setDownloadingLatex(true);
        setProjectedFitScore(null); // Reset previous score
        try {
            const res = await fetch("/api/resumeforge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId }),
            });
            const data = await res.json();

            if (data.success) {
                if (data.projectedFitScore) {
                    setProjectedFitScore(data.projectedFitScore);
                }

                if (data.pdfBase64) {
                    // Download .pdf file
                    const byteCharacters = atob(data.pdfBase64);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });

                    const url = URL.createObjectURL(pdfBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    const filename = `${data.company}_${data.jobTitle}_Resume.pdf`.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    alert(`✅ Resume downloaded as ${filename}!`);
                } else if (data.latexSource) {
                    // Fallback to .tex download
                    const texBlob = new Blob([data.latexSource], { type: 'text/plain' });
                    const url = URL.createObjectURL(texBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    const filename = `${data.company}_${data.jobTitle}_Resume.tex`.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    alert(`⚠️ PDF generation failed, downloaded .tex source instead.\n\nTo compile:\n• Local: pdflatex ${filename}\n• Online: Upload to overleaf.com`);
                }
            } else {
                alert("Failed to generate resume: " + (data.error || "Unknown error"));
            }

            // Show Learning Note if missing skills were injected
            if (data.missingSkills && data.missingSkills.length > 0) {
                alert(`⚠️ SKILLS GAP DETECTED & FILLED\n\nTo pass the ATS, I added these required skills to your resume:\n\n• ${data.missingSkills.join('\n• ')}\n\nIMPORTANT: You must learn these concepts before the interview!`);
            }
        } catch (e) {
            alert("Error generating resume: " + (e instanceof Error ? e.message : "Unknown error"));
        } finally {
            setDownloadingLatex(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>AI Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Fit Score & Recommendation */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Fit Score</div>
                            <div className={`text-4xl font-bold ${analysis?.fitScore ? (analysis.fitScore > 80 ? "text-green-600" : analysis.fitScore > 50 ? "text-yellow-600" : "text-red-600") : ""
                                }`}>
                                {analysis ? `${analysis.fitScore}%` : (fitScore !== null ? `${fitScore}%` : "N/A")}
                            </div>
                        </div>
                        {analysis?.recommendation && (
                            <Badge className={`h-10 text-lg px-4 ${analysis.recommendation === "APPLY" ? "bg-green-600" : "bg-red-600"}`}>
                                {analysis.recommendation === "APPLY" ? (
                                    <><CheckCircle className="mr-2 h-5 w-5" /> APPLY</>
                                ) : (
                                    <><XCircle className="mr-2 h-5 w-5" /> DO NOT APPLY</>
                                )}
                            </Badge>
                        )}
                    </div>

                    {!analysis && (
                        <Button className="w-full" onClick={handleAnalyze} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {loading ? "Analyzing..." : "Analyze with Gemini AI"}
                        </Button>
                    )}

                    {analysis && (
                        <div className="space-y-6 mt-4">
                            {/* Strengths Mapping */}
                            <div>
                                <h4 className="font-semibold text-green-700 mb-3 text-lg">✓ Strengths</h4>
                                <div className="space-y-3">
                                    {analysis.strengths.map((s, i) => (
                                        <div key={i} className="bg-green-50 p-3 rounded-lg border border-green-200">
                                            <div className="flex items-start gap-2">
                                                <ArrowRight className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                                                <div className="text-sm">
                                                    <span className="font-semibold text-green-900">JD: </span>
                                                    <span className="text-green-800">{s.requirement}</span>
                                                    <div className="mt-1">
                                                        <span className="font-semibold text-green-900">Evidence: </span>
                                                        <span className="text-green-700">{s.evidence}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Weaknesses & Mitigation */}
                            <div>
                                <h4 className="font-semibold text-red-700 mb-3 text-lg">⚠ Weaknesses & Gaps</h4>
                                <div className="space-y-3">
                                    {analysis.weaknesses.map((g, i) => (
                                        <div key={i} className="bg-red-50 p-3 rounded-lg border border-red-200">
                                            <div className="text-sm">
                                                <div className="font-semibold text-red-900 mb-1">{g.gap}</div>
                                                <div className="text-red-700 mb-2">{g.analysis}</div>
                                                {g.mitigation && (
                                                    <div className="mt-2 pl-3 border-l-2 border-blue-400">
                                                        <span className="font-semibold text-blue-900">Mitigation: </span>
                                                        <span className="text-blue-700">{g.mitigation}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Bullet Point Recommendations */}
                            {analysis.bulletRecommendations && analysis.bulletRecommendations.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-blue-700 mb-3 text-lg">📝 Resume Action Plan</h4>
                                    <div className="space-y-4">
                                        {analysis.bulletRecommendations.map((rec, i) => (
                                            <div key={i} className={`p-4 rounded-lg border ${rec.action === "ADD" ? "bg-green-50 border-green-200" :
                                                rec.action === "REMOVE" ? "bg-red-50 border-red-200" :
                                                    "bg-blue-50 border-blue-200"
                                                }`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    {rec.action === "ADD" && <Badge className="bg-green-600"><PlusCircle className="w-3 h-3 mr-1" /> ADD</Badge>}
                                                    {rec.action === "REMOVE" && <Badge className="bg-red-600"><MinusCircle className="w-3 h-3 mr-1" /> REMOVE</Badge>}
                                                    {rec.action === "IMPROVE" && <Badge className="bg-blue-600"><RefreshCw className="w-3 h-3 mr-1" /> IMPROVE</Badge>}
                                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reason: {rec.reason}</span>
                                                </div>

                                                {rec.originalText && (
                                                    <div className="mb-2 text-sm text-gray-500 line-through">
                                                        "{rec.originalText}"
                                                    </div>
                                                )}

                                                {rec.suggestedText && (
                                                    <div className="text-sm font-medium text-gray-900 bg-white p-2 rounded border border-gray-100">
                                                        {rec.suggestedText}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Download LaTeX Resume Button */}
                            <Button
                                className="w-full bg-purple-600 hover:bg-purple-700"
                                onClick={handleDownloadLatex}
                                disabled={downloadingLatex}
                            >
                                {downloadingLatex ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {downloadingLatex ? "Generating Resume..." : "📄 Download Tailored Resume (.tex)"}
                            </Button>

                            {/* Projected Fit Score */}
                            {projectedFitScore !== null && (
                                <div className="text-center mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100 animate-in fade-in slide-in-from-top-2">
                                    <div className="text-sm font-medium text-purple-800">New Resume Fit Score</div>
                                    <div className="text-3xl font-bold text-purple-600">
                                        {projectedFitScore}%
                                    </div>
                                    <div className="text-xs text-purple-500 mt-1">
                                        (Estimated improvement based on tailoring)
                                    </div>
                                </div>
                            )}

                            {/* Re-analyze Button */}
                            <Button variant="outline" className="w-full" onClick={handleAnalyze} disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Re-analyze
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
