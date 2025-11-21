import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function analyzeFit(jobDescription: string, resumeContent: string) {
    if (!genAI) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
Analyze the provided Job Description (JD) and the attached Resume. The goal is to provide a strategic, actionable job-fit analysis.

PART 1: JOB FIT RATING & INITIAL ASSESSMENT

1. Generate a Fit Rating for the candidate's experience against the JD on a scale of 0% (No Fit) to 100% (Perfect Fit).
2. Based on this rating, provide a clear, concise final recommendation: "APPLY" or "DO NOT APPLY".

PART 2: DETAILED STRENGTHS MAPPING

1. Identify a minimum of five (5) strong alignment points between the candidate's experience and the Job Description.
2. For each alignment point, structure the output as follows: "JD Requirement" → "Resume Evidence".
3. Prioritize achievements (quantifiable results using numbers and metrics) over basic responsibilities when pulling evidence from the resume.

PART 3: GAP IDENTIFICATION & MITIGATION STRATEGY

1. Identify a minimum of three (3) significant gaps between the candidate's Resume and the Job Description, focusing first on unmet mandatory requirements.
2. For each gap, provide a brief analysis detailing why it is considered a gap (e.g., lack of mention, insufficient depth, or missing key context/seniority).
3. If the overall Fit Rating is 70% or higher, provide a concise Mitigation Strategy for each gap, suggesting how the candidate can address it in their Cover Letter or during a potential Interview.

PART 4: STRATEGIC RESUME MODIFICATION (If Recommendation is "APPLY")

1. Focus on rewriting 5-7 key bullet points from the candidate's experience section.
2. The rewrites must strategically tailor the content to the specific language and requirements of the JD, prioritizing the use of relevant Action Verbs and ensuring the Metrics/Results align with the JD's goals.
3. Present the optimized bullets under the heading: "Suggested Optimized Resume Content".

Job Description:
${jobDescription}

Resume:
${resumeContent}

Provide a JSON response with the following structure:
{
  "fitScore": number (0-100),
  "recommendation": "APPLY" or "DO NOT APPLY",
  "strengths": [{"requirement": string, "evidence": string}],
  "gaps": [{"gap": string, "analysis": string, "mitigation": string}],
  "optimizedBullets": string[]
}

Return ONLY valid JSON. Be thorough, critical, and strategic in your analysis.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up markdown code blocks if present
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("Failed to parse Gemini response:", text);
        throw new Error("Failed to parse AI analysis");
    }
}

export async function tailorResume(jobDescription: string, resumeContent: string, recommendations: string[]) {
    if (!genAI) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
        You are an expert resume writer.
        Tailor the following resume to better fit the job description, incorporating the provided recommendations.
        
        Job Description:
        ${jobDescription}
        
        Original Resume:
        ${resumeContent}
        
        Recommendations to apply:
        ${recommendations.join(", ")}
        
        Rewrite the resume content. Keep the structure similar but optimize the wording, keywords, and highlight relevant experience.
        Do not invent false experience, but you may rephrase existing experience to align with the job.
        
        Return the new resume content as Markdown.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}
