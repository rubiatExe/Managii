import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { convertToLatex, tailorResumeLatex } from '@/lib/gemini';
import { generateLatexPdf } from '@/lib/latex-compiler';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { jobId } = body;

        if (!jobId) {
            return NextResponse.json({ success: false, error: "Job ID is required" }, { status: 400 });
        }

        // Fetch job details
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job) {
            return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
        }

        // Fetch master resume
        const resume = await prisma.resume.findFirst({ where: { isMaster: true } });
        if (!resume) {
            return NextResponse.json({
                success: false,
                error: "No master resume found. Please upload one first."
            }, { status: 400 });
        }

        console.log(`Generating LaTeX resume for job: ${job.title} at ${job.company}`);

        // Step 1: Parse the resume content to structured data (this will be our base)
        const baseResumeData = await convertToLatex(resume.content);

        console.log("Base resume data parsed:", {
            name: baseResumeData.name,
            hasContact: !!baseResumeData.contact,
            hasEducation: !!baseResumeData.education,
            experienceCount: baseResumeData.experience?.length,
            projectsCount: baseResumeData.projects?.length
        });

        // Step 2: Get optimized bullets from analysis if available
        let optimizedBullets: string[] = [];
        if (job.analysis) {
            try {
                const analysis = JSON.parse(job.analysis);
                // Handle new format (bulletRecommendations) and legacy format (optimizedBullets)
                if (analysis.bulletRecommendations && Array.isArray(analysis.bulletRecommendations)) {
                    optimizedBullets = analysis.bulletRecommendations
                        .filter((b: any) => (b.action === 'IMPROVE' || b.action === 'ADD') && b.suggestedText)
                        .map((b: any) => b.suggestedText);
                } else if (analysis.optimizedBullets) {
                    optimizedBullets = analysis.optimizedBullets;
                }
            } catch (e) {
                console.warn("Could not parse job analysis for optimized bullets");
            }
        }

        // Step 3: Tailor the experience and projects sections
        const tailoredData = await tailorResumeLatex(
            job.description,
            baseResumeData,
            optimizedBullets,
            resume.skillsContext
        );

        console.log("Tailored data generated:", {
            hasName: !!tailoredData.name,
            hasContact: !!tailoredData.contact,
            experienceCount: tailoredData.experience?.length,
            projectsCount: tailoredData.projects?.length
        });

        // Step 4: Merge the tailored data with the base resume data
        // We need to flatten the contact info and map education fields to match the template
        const finalResumeData = {
            ...baseResumeData,
            ...tailoredData,
            // Flatten contact info if it exists in base
            ...(baseResumeData.contact || {}),
            // Map education fields: school -> institution
            education: (baseResumeData.education || []).map((edu: any) => ({
                ...edu,
                institution: edu.institution || edu.school, // Handle both naming conventions
                location: edu.location || [edu.city, edu.state].filter(Boolean).join(', ') // Fallback for location, filtering undefined
            })),
            // Ensure skills are preserved
            skills: tailoredData.skills || baseResumeData.skills
        };

        console.log("Final merged data for PDF:", {
            hasName: !!finalResumeData.name,
            hasEmail: !!finalResumeData.email,
            educationCount: finalResumeData.education?.length,
            experienceCount: finalResumeData.experience?.length
        });

        // Step 5: Generate LaTeX source and compile to PDF
        console.log("Step 4: Generating LaTeX and compiling PDF...");
        const result = await generateLatexPdf(finalResumeData);

        if (!result.success) {
            // If PDF generation failed but we have LaTeX source, return it with a warning
            if (result.latexSource) {
                console.warn("PDF generation failed, but LaTeX source is available.");
                return NextResponse.json({
                    success: true, // Treat as success so frontend can handle fallback
                    latexSource: result.latexSource,
                    pdfBase64: null,
                    jobTitle: job.title,
                    company: job.company,
                    projectedFitScore: tailoredData.projectedFitScore,
                    warning: "PDF generation failed. You can download the .tex file instead."
                });
            }

            return NextResponse.json({
                success: false,
                error: result.error || "Failed to generate PDF"
            }, { status: 500 });
        }

        console.log("✅ Successfully generated tailored LaTeX resume");

        return NextResponse.json({
            success: true,
            latexSource: result.latexSource,
            pdfBase64: result.pdfBase64,
            jobTitle: job.title,
            company: job.company,
            projectedFitScore: tailoredData.projectedFitScore,
            missingSkills: tailoredData.missingSkills
        });

    } catch (error) {
        console.error("Error generating LaTeX resume:", error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Failed to generate resume"
        }, { status: 500 });
    }
}
