/**
 * LaTeX to PDF compilation service
 * Generates LaTeX source from structured resume data and compiles it to PDF
 */

// Jake Gutierrez resume template - User's preferred format
const LATEX_TEMPLATE = String.raw`
%-------------------------
% Resume in Latex
% Author : Jake Gutierrez
% Based off of: https://github.com/sb2nov/resume
% License : MIT
%------------------------

\documentclass[letterpaper,11pt]{article}

\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\input{glyphtounicode}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

% Adjust margins - SAFE OPTIMIZATION FOR 11PT FIT
\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1.0in}
\addtolength{\topmargin}{-.5in}
\addtolength{\textheight}{1.0in}

\urlstyle{same}

\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

% Sections formatting
\titleformat{\section}{
  \vspace{-10pt}\scshape\raggedright\large
}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

% Ensure that generate pdf is machine readable/ATS parsable
\pdfgentounicode=1

%-------------------------
% Custom commands
\newcommand{\resumeItem}[1]{
  \item\small{
    {#1 \vspace{-2pt}}
  }
}

\newcommand{\resumeSubheading}[4]{
  \vspace{-1pt}\item
    \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & #2 \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubSubheading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \textit{\small#1} & \textit{\small #2} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{p{0.75\textwidth}@{\extracolsep{\fill}}r}
      \small#1 & #2 \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubItem}[1]{\resumeItem{#1}\vspace{-4pt}}

\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}

\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}[itemsep=-2pt, leftmargin=0.15in]}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\begin{document}

%----------HEADING----------
\begin{center}
    \textbf{\Huge \scshape {{ name }}} \\ \vspace{2pt}
    \small {% if phone %}{{ phone }}{% endif %}{% if email %} $|$ \href{mailto:{{ email }}}{\underline{ {{- email -}} }}{% endif %}{% if linkedin %} $|$ \href{ {{- linkedin -}} }{\underline{ {{- linkedin -}} }}{% endif %}{% if github %} $|$ \href{ {{- github -}} }{\underline{ {{- github -}} }}{% endif %}
\end{center}

{% if education %}
%-----------EDUCATION-----------
\section{Education}
  \resumeSubHeadingListStart
{% for edu in education %}
    \resumeSubheading
      { {{- edu.institution -}} }{ {{- edu.location -}} }
      { {{- edu.degree -}} }{ {{- edu.date -}} }
{% endfor %}
  \resumeSubHeadingListEnd
{% endif %}

{% if skills %}
%-----------SKILLS-----------
\section{Technical Skills}
 \begin{itemize}[leftmargin=0.15in, label={}]
    \small{\item{
{% for skill in skills %}
     \textbf{ {{- skill.category -}} }{: {{ skill.items }}}{% if not loop.last %} \\{% endif %}
{% endfor %}
    }}
 \end{itemize}
{% endif %}

{% if experience %}
%-----------EXPERIENCE-----------
\section{Experience}
  \resumeSubHeadingListStart
{% for exp in experience %}
    \resumeSubheading
      { {{- exp.company -}} }{ {{- exp.location -}} }
      { {{- exp.title -}} }{ {{- exp.date -}} }
      \resumeItemListStart
{% for bullet in exp.bullets %}
        \resumeItem{ {{- bullet -}} }
{% endfor %}
      \resumeItemListEnd
{% endfor %}
  \resumeSubHeadingListEnd
{% endif %}

{% if projects %}
%-----------PROJECTS-----------
\section{Projects}
    \resumeSubHeadingListStart
{% for project in projects %}
      \resumeProjectHeading
          {\textbf{ {{- project.name -}} }{% if project.tech %} $|$ \emph{ {{- project.tech -}} }{% endif %}}{{% if project.date %}{{ project.date }}{% endif %}}
          \resumeItemListStart
{% for bullet in project.bullets %}
            \resumeItem{ {{- bullet -}} }
{% endfor %}
          \resumeItemListEnd
{% endfor %}
    \resumeSubHeadingListEnd
{% endif %}

\end{document}
`.trim();

/**
 * Escape special LaTeX characters in text
 * Uses a single regex to prevent double-escaping (e.g., replacing \ after replacing #)
 */
function escapeLatex(text: string): string {
    if (!text) return text;

    return text.replace(/[&%$#_{}~^\\]/g, (match) => {
        switch (match) {
            case '&': return '\\&';
            case '%': return '\\%';
            case '$': return '\\$';
            case '#': return '\\#';
            case '_': return '\\_';
            case '{': return '\\{';
            case '}': return '\\}';
            case '~': return '\\textasciitilde{}';
            case '^': return '\\^{}';
            case '\\': return '\\textbackslash{}';
            default: return match;
        }
    });
}

/**
 * Recursively clean and escape LaTeX special characters in resume data
 * EXCEPT for bullets which may contain LaTeX markup from Gemini
 */
function cleanResumeData(data: any, keyPath: string = ''): any {
    if (typeof data === 'string') {
        // Don't escape if this is a bullet string that contains LaTeX markup from Gemini
        const isInBulletsArray = keyPath.includes('.bullets') || keyPath === 'bullets';
        const hasLatexMarkup = data.includes('\\textbf{') || data.includes('\\%');

        if (isInBulletsArray && hasLatexMarkup) {
            console.log("Skipping escape for LaTeX bullet:", data.substring(0, 60));
            return data; // Already has LaTeX markup from Gemini
        }

        // For non-bullet fields (like skills), if we have escaped chars like \# or \%, 
        // we need to unescape them first so escapeLatex can handle them properly.
        // Example: "C\#" -> "C#" -> "C\#" (via escapeLatex)
        // Otherwise: "C\#" -> "C\textbackslash\#" (via escapeLatex)
        let cleaned = data;
        if (cleaned.includes('\\#')) cleaned = cleaned.replace(/\\#/g, '#');
        if (cleaned.includes('\\%')) cleaned = cleaned.replace(/\\%/g, '%');
        if (cleaned.includes('\\&')) cleaned = cleaned.replace(/\\&/g, '&');
        if (cleaned.includes('\\$')) cleaned = cleaned.replace(/\\\$/g, '$');
        if (cleaned.includes('\\_')) cleaned = cleaned.replace(/\\_/g, '_');

        return escapeLatex(cleaned);
    } else if (Array.isArray(data)) {
        return data.map((item, index) => cleanResumeData(item, `${keyPath}[${index}]`));
    } else if (typeof data === 'object' && data !== null) {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(data)) {
            const newKeyPath = keyPath ? `${keyPath}.${key}` : key;
            cleaned[key] = cleanResumeData(value, newKeyPath);
        }
        return cleaned;
    }
    return data;
}

/**
 * Resolve a dot-notation path in an object
 */
function resolvePath(data: any, path: string): any {
    if (!path) return undefined;
    const parts = path.split('.');
    let current = data;
    for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        current = current[part];
    }
    return current;
}

/**
 * Find the closing tag for a given opening tag, handling nesting
 */
function findBalancedClose(text: string, openTagRegex: RegExp, closeTag: string, startIndex: number): number {
    let depth = 0;
    let currentIndex = startIndex;

    // Find the first opening tag to start tracking
    const firstMatch = text.slice(currentIndex).match(openTagRegex);
    if (!firstMatch) return -1;

    // Move past the first tag
    currentIndex += firstMatch.index! + firstMatch[0].length;
    depth = 1;

    while (depth > 0 && currentIndex < text.length) {
        const nextOpen = text.slice(currentIndex).match(openTagRegex);
        const nextClose = text.indexOf(closeTag, currentIndex);

        if (nextClose === -1) return -1; // Unbalanced

        if (nextOpen && nextOpen.index! < (nextClose - currentIndex)) {
            // Found nested open tag
            depth++;
            currentIndex += nextOpen.index! + nextOpen[0].length;
        } else {
            // Found close tag
            depth--;
            currentIndex = nextClose + closeTag.length;
        }
    }

    return currentIndex; // Position after the closing tag
}

/**
 * Robust template rendering function that handles nested loops and conditionals
 */
function renderTemplate(template: string, data: any): string {
    let result = template;

    // STEP 1: Handle {% for item in items %} blocks
    // We loop until no more top-level loops are found
    while (true) {
        const forRegex = /{% for (\w+) in ([\w\.]+) %}/;
        const match = result.match(forRegex);

        if (!match) break;

        const [fullTag, itemName, arrayPath] = match;
        const startIndex = match.index!;
        const endIndex = findBalancedClose(result, /{% for \w+ in [\w\.]+ %}/, "{% endfor %}", startIndex);

        if (endIndex === -1) {
            console.error("Unbalanced for loop found");
            break; // Safety break
        }

        const fullBlock = result.slice(startIndex, endIndex);
        const content = fullBlock.slice(fullTag.length, -"{% endfor %}".length);

        const items = resolvePath(data, arrayPath);
        let renderedItems = "";

        if (Array.isArray(items) && items.length > 0) {
            renderedItems = items.map((item, index) => {
                // Create a new context with the loop variable and loop metadata
                const loopContext = {
                    ...data,
                    [itemName]: item,
                    loop: {
                        index: index + 1,
                        index0: index,
                        first: index === 0,
                        last: index === items.length - 1,
                        length: items.length
                    }
                };
                // Recursively render the content
                return renderTemplate(content, loopContext);
            }).join('');
        }

        // Replace the entire block with the rendered items
        result = result.slice(0, startIndex) + renderedItems + result.slice(endIndex);
    }

    // STEP 2: Handle {% if variable %} blocks
    while (true) {
        const ifRegex = /{% if ([\w\.]+) %}/;
        const match = result.match(ifRegex);

        if (!match) break;

        const [fullTag, varPath] = match;
        const startIndex = match.index!;
        const endIndex = findBalancedClose(result, /{% if [\w\.]+ %}/, "{% endif %}", startIndex);

        if (endIndex === -1) {
            // Try to handle simple non-nested case if balanced search fails (fallback)
            break;
        }

        const fullBlock = result.slice(startIndex, endIndex);
        const content = fullBlock.slice(fullTag.length, -"{% endif %}".length);

        const value = resolvePath(data, varPath);
        const renderedContent = value ? renderTemplate(content, data) : "";

        result = result.slice(0, startIndex) + renderedContent + result.slice(endIndex);
    }

    // Handle {% if not loop.last %} specifically (often used inside loops)
    // Since we processed loops recursively, these should have been handled in the inner render.
    // But if any remain (e.g. malformed), we clean them up.
    // Actually, our recursive logic handles 'loop.last' via the context!
    // We just need to support the 'not' syntax in the if handler or pre-process it.

    // Quick fix for 'if not loop.last':
    // We can support it by checking for it explicitly in the IF block handler
    // OR, we can just replace it with a special variable check.
    // Let's improve the IF regex to support 'not'.

    // IMPROVED STEP 2 (Replace the loop above with this better one if possible, but for now let's just patch the 'not' case)
    // Actually, the previous loop only supports simple variables.
    // Let's add a specific handler for 'if not loop.last' which is common in this template.

    while (true) {
        const ifNotRegex = /{% if not ([\w\.]+) %}/;
        const match = result.match(ifNotRegex);
        if (!match) break;

        const [fullTag, varPath] = match;
        const startIndex = match.index!;
        const endIndex = findBalancedClose(result, /{% if not [\w\.]+ %}/, "{% endif %}", startIndex);

        if (endIndex === -1) break;

        const fullBlock = result.slice(startIndex, endIndex);
        const content = fullBlock.slice(fullTag.length, -"{% endif %}".length);

        const value = resolvePath(data, varPath);
        const renderedContent = !value ? renderTemplate(content, data) : "";

        result = result.slice(0, startIndex) + renderedContent + result.slice(endIndex);
    }


    // STEP 3: Remove any remaining unprocessed Jinja tags (safety cleanup)
    result = result.replace(/{%[^%]*%}/g, '');

    // STEP 4: Handle simple {{- variable -}} replacements (whitespace control)
    result = result.replace(/{{-\s*([\w\.]+)\s*-}}/g, (_match: string, varPath: string) => {
        const val = resolvePath(data, varPath);
        if (typeof val === 'string') return val;
        if (typeof val === 'number') return String(val);
        if (typeof val === 'object' && val !== null) return val.text || val.content || JSON.stringify(val);
        return '';
    });

    // STEP 5: Handle simple {{ variable }} replacements
    result = result.replace(/{{\s*([\w\.]+)\s*}}/g, (_match: string, varPath: string) => {
        const val = resolvePath(data, varPath);
        return val !== undefined && val !== null ? String(val) : '';
    });

    return result;
}

/**
 * Generate LaTeX source from resume data
 */
export function generateLatexSource(resumeData: any, skipEscaping: boolean = false): string {
    // Clean data to escape LaTeX special characters
    // Skip escaping if data is already LaTeX-formatted (e.g., from tailorResumeLatex)
    const cleanedData = skipEscaping ? resumeData : cleanResumeData(resumeData);

    // Render template with custom rendering function
    return renderTemplate(LATEX_TEMPLATE, cleanedData);
}

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

/**
 * Generate LaTeX source from resume data
 * Compiles to PDF using local pdflatex if available, otherwise uses latexonline.cc API
 */
export async function generateLatexPdf(resumeData: any): Promise<{
    success: boolean;
    latexSource?: string;
    pdfBase64?: string;
    error?: string;
}> {
    try {
        // Generate LaTeX source
        // Don't skip escaping - let cleanResumeData intelligently skip only LaTeX-formatted bullets
        const latexSource = generateLatexSource(resumeData);
        console.log('✅ Successfully generated LaTeX source');

        let pdfBuffer: Buffer;

        // Check if pdflatex is available locally
        try {
            // Add /Library/TeX/texbin to PATH for macOS BasicTeX support
            const env = { ...process.env, PATH: `${process.env.PATH}:/Library/TeX/texbin` };

            await execAsync('pdflatex --version', { env });
            console.log('✅ Local pdflatex found, compiling locally...');

            // Local compilation logic
            const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'resume-'));
            const texPath = path.join(tempDir, 'resume.tex');
            const pdfPath = path.join(tempDir, 'resume.pdf');

            await fs.writeFile(texPath, latexSource);

            // Run pdflatex twice to resolve references (though usually once is enough for this template)
            await execAsync(`pdflatex -interaction=nonstopmode -output-directory=${tempDir} ${texPath}`, { env });

            pdfBuffer = await fs.readFile(pdfPath);

            // Cleanup
            await fs.rm(tempDir, { recursive: true, force: true });

        } catch (localError) {
            console.log('⚠️ Local pdflatex not found or failed, falling back to latexonline.cc API');
            console.error(localError);

            // Fallback to latexonline.cc API
            const response = await fetch('https://latexonline.cc/compile?text=' + encodeURIComponent(latexSource));

            if (!response.ok) {
                throw new Error(`Cloud compilation failed: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            pdfBuffer = Buffer.from(arrayBuffer);
        }

        return {
            success: true,
            latexSource,
            pdfBase64: pdfBuffer.toString('base64'),
        };

    } catch (error) {
        console.error('LaTeX generation error:', error);
        return {
            success: false,
            // Return source even if PDF fails so user can still download .tex
            latexSource: generateLatexSource(resumeData),
            error: error instanceof Error ? error.message : 'Unknown generation error',
        };
    }
}
