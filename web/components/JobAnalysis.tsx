"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";

interface AnalysisResult {
    fitScore: number;
    recommendation: "APPLY" | "DO NOT APPLY";
    strengths: Array<{ requirement: string; evidence: string }>;
    gaps: Array<{ gap: string; analysis: string; mitigation: string }>;
    optimizedBullets: string[];
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
            // Validate schema
            if (
                typeof parsed.fitScore === 'number' &&
                Array.isArray(parsed.strengths) &&
                parsed.strengths.length > 0 &&
                typeof parsed.strengths[0] === 'object' && // Check if strength is object (new format)
                Array.isArray(parsed.gaps)
            ) {
                return parsed as AnalysisResult;
            }
            return null; // Invalid or legacy format
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
                                <h4 className="font-semibold text-green-700 mb-3 text-lg">✓ Strengths - Alignment Points</h4>
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

                            {/* Gaps & Mitigation */}
                            <div>
                                <h4 className="font-semibold text-red-700 mb-3 text-lg">⚠ Gaps & Mitigation Strategies</h4>
                                <div className="space-y-3">
                                    {analysis.gaps.map((g, i) => (
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

                            {/* Optimized Resume Bullets */}
                            {analysis.optimizedBullets && analysis.optimizedBullets.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-blue-700 mb-3 text-lg">📝 Suggested Optimized Resume Content</h4>
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <ul className="list-disc list-inside text-sm space-y-2 text-blue-900">
                                            {analysis.optimizedBullets.map((bullet, i) => (
                                                <li key={i} className="leading-relaxed">{bullet}</li>
                                            ))}
                                        </ul>
                                        <Button
                                            variant="outline"
                                            className="w-full mt-4"
                                            onClick={() => navigator.clipboard.writeText(analysis.optimizedBullets.join('\n'))}
                                        >
                                            Copy Bullets to Clipboard
                                        </Button>
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
