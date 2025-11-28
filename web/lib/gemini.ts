import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function analyzeFit(jobDescription: string, resumeContent: string, skillsContext?: string | null) {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Sanitize resume content to remove potential filename artifacts
  let cleanResumeContent = resumeContent.trim();
  if (cleanResumeContent.endsWith(".pdf")) {
    // If the content ends with .pdf, it might be a footer artifact, but we should have caught this in validation.
    // Just in case, we can try to strip it if it's on a new line.
    cleanResumeContent = cleanResumeContent.replace(/\n.*\.pdf$/i, "");
  }

  const prompt = `
Role & Persona: Act as a cynical, brutally honest Senior Staff Engineer at a FAANG company (Google/Meta/Netflix) who has been forced to review 50 resumes before lunch. You are also running an internal mental "ATS Algorithm" (Applicant Tracking System) check.

Your Goal: Your goal is to find reasons to reject me so you can move on to the next candidate. You do not care about my feelings; you care about Engineering Excellence, signal-to-noise ratio, and whether I can actually ship code or if I just talk a big game.

Input Data:
Job Description:
${jobDescription}

Resume Content (Ignore any filenames if present):
${cleanResumeContent}

Additional Skills Context:
${skillsContext || "None provided"}

Instructions for Analysis: Analyze my resume against the JD using the following three phases. Be harsh, direct, and concise.

Phase 1: The ATS Audit (Machine Vision)
Compare my "Skills" section against the JD’s "Requirements."
List exactly which keywords are Missing (e.g., if JD says "Docker" and I don't have it, flag it as a critical failure).
Give me an "ATS Match Score" out of 100.

Phase 2: The Senior Engineer BS Detector (Human Vision)
Metric Audit: Look at my bullet points. If I claim I "increased revenue by 50%" as an intern, call me a liar and tell me to fix it to an engineering metric (latency, uptime, code coverage).
Title Inflation: If I am a New Grad/Junior but my resume says "Team Lead," "CTO," or "Head of Engineering," rip that apart. Tell me why it makes me look junior.
Manager vs. Builder: specific check: Do I sound like I managed the work or built the work? For a junior role, if I sound like a manager, mark that as a "Yellow Flag."
Vagueness: If I say "Stealth Startup" without context, or "various technologies," call it out as suspicious.

Phase 3: Hygiene & Fatal Errors
Find every single typo, formatting error (like "undefined"), or grammatical mistake.
Tell me if these errors are "Auto-Rejects."

OUTPUT FORMAT (JSON ONLY):
{
  "fitScore": number (0-100),
  "recommendation": "APPLY" or "DO NOT APPLY",
  "strengths": [{"requirement": string, "evidence": string}],
  "weaknesses": [{"gap": string, "analysis": string, "mitigation": string}],
  "bulletRecommendations": [
    {
      "action": "IMPROVE" | "ADD" | "REMOVE",
      "originalText": string (if IMPROVE or REMOVE, else null),
      "suggestedText": string (if IMPROVE or ADD, else null),
      "reason": string (why this change helps)
    }
  ],
  "executiveSummary": {
    "atsScore": number (0-100),
    "seniorEngineerScore": number (0-10)
  },
  "theRoast": [ "Bullet 1", "Bullet 2" ],
  "theFix": [ "Priority 1", "Priority 2" ]
}
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

// Helper for exponential backoff retry
async function generateContentWithRetry(model: any, prompt: string, retries = 3, delay = 2000): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes('429') || error.status === 429)) {
      console.warn(`⚠️ Gemini Rate Limit (429). Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateContentWithRetry(model, prompt, retries - 1, delay * 2);
    }
    throw error;
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

  return generateContentWithRetry(model, prompt);
}

export async function convertToLatex(resumeContent: string) {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  // Validation: Check if content is empty or too short (likely just a filename or empty file)
  console.log(`[convertToLatex] Validating resume content. Length: ${resumeContent?.length}`);
  if (!resumeContent || resumeContent.length < 100) {
    console.warn("Resume content appears to be invalid or too short:", resumeContent);
    throw new Error(`Resume content is missing or invalid (Length: ${resumeContent?.length}). Please re-upload your resume to ensure text is extracted correctly.`);
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
You are an expert resume formatter. Convert the following plain text resume into structured JSON format that will be used to generate a professional LaTeX resume.

IMPORTANT INSTRUCTIONS:
1. Parse the resume content and extract all sections
2. Identify: name, contact info (email, phone, linkedin, github, website), education, experience, projects, skills
3. Format dates consistently (e.g., "Jan 2023 - Present" or "2023 - 2024")
4. For experience and projects, extract bullet points that describe achievements
5. For skills, group them by category (e.g., "Languages", "Frameworks", "Tools")
6. Extract location information where available
7. If there's a summary/objective section, include it
8. Preserve all quantifiable achievements and metrics
9. IMPORTANT: Return plain text values (e.g., "C#", "Node.js & Express", "50%"). Do NOT escape special characters or use LaTeX commands in the JSON values. The system will handle LaTeX escaping automatically.

Resume Content:
${resumeContent}

Return ONLY valid JSON with this structure:
{
  "name": "Full Name",
  "contact": {
    "email": "email@example.com",
    "phone": "123-456-7890",
    "linkedin": "url",
    "github": "url",
    "website": "url"
  },
  "education": [
    {
      "school": "University Name",
      "degree": "Degree Name",
      "date": "Graduation Date",
      "location": "City, State"
    }
  ],
  "experience": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "date": "Date Range",
      "location": "City, State",
      "bullets": ["Bullet 1", "Bullet 2"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "tech": "Tech Stack",
      "date": "Date",
      "bullets": ["Bullet 1", "Bullet 2"]
    }
  ],
  "skills": [
    {
      "category": "Category Name",
      "items": "Item 1, Item 2, Item 3"
    }
  ]
}
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
    throw new Error("Failed to parse resume conversion");
  }
}

export async function tailorResumeLatex(
  jobDescription: string,
  resumeData: any,
  optimizedBullets: string[],
  skillsContext?: string | null
) {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const prompt = `Role: You are an elite Technical Resume Architect and former FAANG Hiring Manager. Your goal is to tailor a "Master Resume" to a specific "Target Job Description (JD)" to maximize the Interview Probability Score.

  Input Data:

  Master Resume Data:
  ${JSON.stringify(resumeData, null, 2)}

  Target Job Description (JD):
  ${jobDescription}

  Previously Identified Optimized Bullets (reference):
  ${optimizedBullets.join('\\n')}

  Additional Skills Context (CRITICAL SOURCE):
  ${skillsContext || 'None provided'}

  PROCESS: You must follow this 4-Step "Chain of Thought" process strictly. Do not skip steps.

  STEP 1: The Keyword Extraction (The "ATS Filter")
  *   Analyze the [TARGET_JD]. Extract the top 5-7 "Fatal Keywords" (Hard requirements: e.g., Python, AWS, Docker, specific frameworks).
  *   Scan the [MASTER_RESUME] and skill context. Identify where I currently possess these skills.
  *   **CRITICAL RULE:** If a skill exists in the Master Resume or the skill context AND the JD, it is now **SACRED**. You must not delete it. You must ensure it appears in the Technical Skills section AND within a bullet point.

  STEP 2: The Space Economy Strategy (The "Editor")
  *   **Tier 1 (Direct Match):** Experiences using "Fatal Keywords" get maximum space (3-4 bullets).
  *   **Tier 2 (Transferable):** Recent engineering work (last 2 years) gets medium space (2-3 bullets).
  *   **Tier 3 (Sacrifice):** Old internships (>3 years ago), non-technical roles, or unrelated stacks (e.g., Unity/GameDev for a Fintech role). **Aggressively compress these into 1 line** to save vertical space.

  STEP 3: The Narrative Rewrite (The "Builder")
  *   Rewrite Tier 1 bullet points to prioritize the JD's specific keywords.
  *   *Example:* If JD wants "Scaling," change "Built app" to "Architected scalable solution handling X users."
  *   *Example:* If JD wants "Testing," add "ensuring code quality via Jest unit tests" to an existing bullet.
  *   **Constraint:** Do not invent facts. Only reframe existing experience.

  STEP 4: The Final Output (The "Typographer")
  *   Generate the full resume text.
  *   **Strict Constraints:**
      *   **1 Page Limit:** Use concise phrasing.
      *   **Widow Control:** No bullet point should end with a single word on a new line.
      *   **Skills Section:** Must be the first section after Education. It MUST list the "Fatal Keywords" first.
      *   **Formatting:** Clean, standard headers, even spacing between sentences.

  **EXECUTION PROTOCOL (STRICT ANTI-HALLUCINATION RULES):**
  *   **NO HALLUCINATIONS:** Do NOT invent text. Do not add random words like "mor", "and and", or "track track".
  *   **NO PREAMBLE:** Return ONLY the JSON object.
  *   **NO MIXING:** Do not put Education dates in Skills.

        **5. 1-PAGE LAYOUT MATH:**
        *   **Spacing:** Prioritize "breathing room" between sections. If text is too long, cut from Tier 3 roles (Save Tuba/RiVR) BEFORE touching Tier 1 roles.
        *   **Project Positioning:** If a "Project" (like Managify) is more relevant to the JD than an old job (like Save Tuba), ensure the Project section is prominent and detailed.

        **6. SURGICAL FIXES (USER FEEDBACK LOOP - CRITICAL):**
        *   **React is NOT a Language:** Do NOT list "React" under "Programming Languages". It belongs in "Frameworks & Libraries".
        *   **Kill Widows (Specific Targets):**
            *   *Mentessa (Metrics):* Shorten "improving user query success rate by 20%" to "improving query success rate by 20%".
            *   *Mentessa (OpenAI):* **CRITICAL:** You MUST include "...parsing responses to render structured UI components." Do NOT simplify this to just "integrated API".
            *   *Managify:* Shorten "streamlining deployment and ensuring environment consistency..." to "streamlining deployments and ensuring environment consistency."
        *   **Lehigh RiVR (Dynamic Logic):**
            *   **Check JD:** Does the JD mention VR, Unity, C#, or 3D graphics?
            *   **If YES:** Treat as Tier 2 (Keep 2-3 strong technical bullets).
            *   **If NO (Standard Web/Backend Role):** Treat as Tier 3 (Sacrifice). Limit to 1-2 lines total. Aggressively remove "fluff" bullets like "Translated functional requirements".

  **Formatting & JSON Structure:**
  *   **CRITICAL JSON ESCAPING:** LaTeX commands contain backslashes that MUST be escaped properly for valid JSON:
      - For \\textbf{text}: Use FOUR backslashes in JSON string: "\\\\\\\\textbf{text}"
      - For \\%: Use FOUR backslashes: "\\\\\\\\%"
      - Example bullet in JSON: "Increased performance by \\\\\\\\textbf{30\\\\\\\\%} using \\\\\\\\textbf{React}"
  *   **Structure:** Return a JSON object with "experience", "projects", and "skills" arrays.
      - **CRITICAL:** You MUST identify "Missing Critical Skills" (required by JD but missing in context).
      - **ACTION:** Add these missing skills to the "skills" array so the resume passes ATS.
      - **REPORT:** List these added skills in the "missingSkills" array so the user knows what to learn.

  Output Format (JSON ONLY):
  {
    "experience": [ ... ],
    "projects": [ ... ],
    "skills": [ { "category": "Languages", "items": "Java, Python" }, ... ],
    "missingSkills": [ "Skill 1", "Skill 2" ],
    "projectedFitScore": number (0-100)
  }
`;

  const resultText = await generateContentWithRetry(model, prompt);

  console.log("Gemini raw response length:", resultText.length);
  console.log("Cleaned JSON (first 800 chars):", resultText.substring(0, 800));

  // 2. COMPREHENSIVE FIX: Gemini produces inconsistent LaTeX escaping in JSON
  // We need to normalize ALL LaTeX commands to use exactly 4 backslashes before JSON parsing
  // This way: \\\\textbf in JSON → \\textbf after JSON.parse() → \textbf in final LaTeX

  // Replace any occurrence of \textbf, \textit, \%, etc. with proper escaping
  // We want the JSON string to contain "\\textbf", which means the JS string value must be "\\\\textbf"
  // So the replacement string in code must be "\\\\\\\\textbf" (8) ??
  // NO. We saw that 8 backslashes produced "\\textbf" in the output file.
  // We want "\textbf" in the output file.
  // So we need to reduce the backslashes.
  // Let's try 4 backslashes in the replacement string: '\\\\textbf{'

  const escapedJson = resultText
    // Fix \textbf{...} patterns
    .replace(/\\\\+textbf\{/g, '\\\\textbf{')
    .replace(/\\\\+textit\{/g, '\\\\textit{')
    // Fix special characters
    .replace(/\\\\+%/g, '\\\\%')
    .replace(/\\\\+&/g, '\\\\&')
    .replace(/\\\\+#/g, '\\\\#')
    .replace(/\\\\+_/g, '\\\\_')
    .replace(/\\\\+\$/g, '\\\\$');

  console.log("After escaping fix (first 800 chars):", escapedJson.substring(0, 800));

  let tailoredData;
  try {
    tailoredData = JSON.parse(escapedJson);

    // Log the FIRST bullet from experience to see exactly what we got
    if (tailoredData.experience && tailoredData.experience[0]?.bullets?.[0]) {
      const firstBullet = tailoredData.experience[0].bullets[0];
      console.log("=== BULLET PARSING DEBUG ===");
      console.log("First bullet after JSON.parse:", firstBullet);
      console.log("First bullet length:", firstBullet.length);
      console.log("First 100 chars:", firstBullet.substring(0, 100));
      // Show each character and its code to see if \t is there
      const first50 = firstBullet.substring(0, 50);
      const charCodes = (Array.from(first50) as string[]).map((c, i) => `${i}:${c.charCodeAt(0)}`).join(' ');
      console.log("Char codes of first 50 chars:", charCodes);
    }
  } catch (parseError) {
    console.error("JSON Parse Error:", parseError);
    console.error("Failed JSON (full):", escapedJson);

    // Try to show context around the error position
    if (parseError instanceof SyntaxError && parseError.message.includes('position')) {
      const posMatch = parseError.message.match(/position (\d+)/);
      if (posMatch) {
        const pos = parseInt(posMatch[1]);
        const start = Math.max(0, pos - 50);
        const end = Math.min(escapedJson.length, pos + 50);
        console.error("Context around error:", escapedJson.substring(start, end));
        console.error("                      ", " ".repeat(Math.min(50, pos - start)) + "^");
      }
    }

    throw new Error(`Failed to parse AI-generated JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
  }

  // Helper to ensure bullets are strings
  const normalizeBullets = (sections: any[]) => {
    if (!Array.isArray(sections)) return [];
    return sections.map(section => {
      if (section.bullets && Array.isArray(section.bullets)) {
        section.bullets = section.bullets.map((b: any) => {
          if (typeof b === 'string') return b;
          if (typeof b === 'object' && b !== null) {
            // Try to extract text from common keys or just stringify values
            return b.text || b.content || b.description || b.value || Object.values(b).join(' ');
          }
          return String(b || '');
        }).filter((b: string) => b.trim().length > 0); // Remove empty bullets
      }
      return section;
    });
  };

  return {
    // Preserve all base resume data (name, contact, education, skills)
    ...resumeData,
    // Override only the tailored sections
    experience: normalizeBullets(tailoredData.experience || resumeData.experience || []),
    projects: normalizeBullets(tailoredData.projects || resumeData.projects || []),
    // Use tailored skills if available (includes injected skills), otherwise fallback
    skills: tailoredData.skills || resumeData.skills || [],
    projectedFitScore: tailoredData.projectedFitScore || null,
    missingSkills: tailoredData.missingSkills || [],
  };
}
// Force rebuild Fri Nov 28 02:50:24 EST 2025
